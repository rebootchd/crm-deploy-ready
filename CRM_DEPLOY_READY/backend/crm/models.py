from django.db import models
from django.conf import settings
from django.utils import timezone
from django.contrib.auth.models import User


# -------------------------
# Core models (Employee, Lead, Client, Project, Assignment)
# -------------------------
class Employee(models.Model):
    # user = models.OneToOneField(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20, null=True, blank=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    joining_date = models.DateField(blank=True, null=True)
    gender = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=200, blank=True)
    email = models.EmailField(blank=True, null=True)
    status = models.CharField(max_length=20, default="Active")
    role_description = models.TextField(blank=True, null=True)
    access_level = models.CharField(max_length=20, default="Executive")

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Lead(models.Model):
    STATUS_CHOICES = [
        ('New', 'New'),
        ('Contacted', 'Contacted'),
        ('Qualified', 'Qualified'),
        ('Lost', 'Lost'),
        ('Converted', 'Converted'),
    ]

    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, null=True, blank=True)
    source = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='New')
    assigned = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='leads')
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Client(models.Model):
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, null=True, blank=True)
    industry = models.CharField(max_length=150, blank=True)
    assigned = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='clients')
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return self.name or f"Client {self.id}"


class Project(models.Model):
    title = models.CharField(max_length=255)
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='projects')
    progress = models.IntegerField(default=0)   # 0-100
    assigned = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='projects')
    issue_date = models.DateField(null=True, blank=True, help_text="Date when project/issue was created")
    submission_date = models.DateField(null=True, blank=True, help_text="Date when project is expected/submitted")
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return self.title or f"Project {self.id}"


class Assignment(models.Model):
    WORK_TYPE_CHOICES = [
        ('lead', 'Lead'),
        ('client', 'Client'),
        ('project', 'Project'),
        ('invoice', 'Invoice'),  # ✅ added
        ('assignment', 'Assignment')  # ✅ added

    ]


    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='assignments')
    phone = models.CharField(max_length=20, null=True, blank=True)
    work_type = models.CharField(max_length=20, choices=WORK_TYPE_CHOICES)
    work_id = models.IntegerField()              # store the id of the work item (Lead/Client/Project)
    assigned_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, default="")
    # created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.employee} -> {self.work_type}:{self.work_id}"

    def get_work_object(self):
        """
        Convenience method to return the actual work object (Lead/Client/Project)
        If object doesn't exist, returns None.
        """
        model_map = {
            'lead': Lead,
            'client': Client,
            'project': Project,
        }
        Model = model_map.get(self.work_type)
        if not Model:
            return None
        try:
            return Model.objects.get(pk=self.work_id)
        except Model.DoesNotExist:
            return None


# -------------------------
class CallLog(models.Model):
    name = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True)

    call_type = models.CharField(
        max_length=20,
        choices=[("inbound", "Inbound"), ("outbound", "Outbound")],
        default="outbound"
    )

    outcome = models.CharField(
        max_length=20,
        choices=[
            ("connected", "Connected"),
            ("voicemail", "Voicemail"),
            ("no_answer", "No Answer"),
            ("busy", "Busy"),
            ("other", "Other"),
        ],
        default="other"
    )

    called_at = models.DateTimeField(null=True, blank=True)

    duration_seconds = models.PositiveIntegerField(default=0)

    notes = models.TextField(blank=True)

    follow_up = models.BooleanField(default=False)

    is_missed = models.BooleanField(default=False)

    # 👇 IMPORTANT (frontend expects this nullable)
    assigned = models.ForeignKey(
        "Employee",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="call_logs"
    )

    # 👇 Relation support
    lead = models.ForeignKey("Lead", null=True, blank=True, on_delete=models.SET_NULL)
    client = models.ForeignKey("Client", null=True, blank=True, on_delete=models.SET_NULL)

    created_at = models.DateTimeField(auto_now_add=True)


class FollowUp(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('done', 'Done'),
        ('skipped', 'Skipped'),
        ('postponed', 'Postponed'),
    ]

    lead = models.ForeignKey(Lead, on_delete=models.SET_NULL, null=True, blank=True, related_name='followups')
    note = models.TextField(blank=True)
    due_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    assigned_to = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='followups')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_followups')
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-due_date']

    def __str__(self):
        subject = self.lead
        subject_name = getattr(subject, 'name', None) if subject else 'Unknown'
        return f"FollowUp for {subject_name} - {self.status} (due: {self.due_date.date() if self.due_date else 'N/A'})"



# //tacking
class Event(models.Model):
    entity_type = models.CharField(max_length=50)
    entity_id = models.IntegerField()
    event_type = models.CharField(max_length=50)
    user_id = models.IntegerField()
    metadata = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.event_type} - {self.entity_type} ({self.entity_id})"


from django.db import models

class Tracking(models.Model):
    total_revenue = models.FloatField(default=0.0)
    employees_active = models.IntegerField(default=0)
    receivables = models.FloatField(default=0.0)
    cash_balance = models.FloatField(default=0.0)
    month = models.CharField(max_length=20)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.month} — ₹{self.total_revenue}"




class Task(models.Model):
    title = models.CharField(max_length=200)
    owner = models.CharField(max_length=100, blank=True)
    priority = models.CharField(max_length=20, default="Medium")
    due = models.DateField(null=True, blank=True)
    progress = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title




class WorkGiven(models.Model):
    employee = models.ForeignKey(Employee, null=True, blank=True, on_delete=models.SET_NULL)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    submission_date = models.DateField()
    given_on = models.DateField(auto_now_add=True)
    priority = models.CharField(max_length=20, default="Medium")
    status = models.CharField(max_length=20, default="PENDING")

    def __str__(self):
        return self.title