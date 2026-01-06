from django.contrib import admin
from django.apps import apps
from .models import WorkGiven

# Use apps.get_model to avoid circular import problems.
Employee = apps.get_model('crm', 'Employee')
Lead = apps.get_model('crm', 'Lead')
Client = apps.get_model('crm', 'Client')
Project = apps.get_model('crm', 'Project')
Assignment = apps.get_model('crm', 'Assignment')
CallLog = apps.get_model('crm', 'CallLog')
FollowUp = apps.get_model('crm', 'FollowUp')


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('id', 'name','phone','email', 'role', 'access_level', 'status')
    list_display_links = ('name',)
    search_fields = ('name', 'email')
    list_filter = ("access_level", "status")


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('id', 'name','phone','status', 'assigned', 'created_at')
    list_display_links = ('name',)
    search_fields = ('name',)


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('id', 'name','phone', 'industry', 'assigned', 'created_at')
    list_display_links = ('name',)
    search_fields = ('name',)


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'client', 'assigned', 'issue_date', 'submission_date')
    list_display_links = ('client',)
    search_fields = ('title', 'client__name')
    fields = ('title', 'client', 'progress', 'assigned', 'issue_date', 'submission_date', 'notes')


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'employee', 'work_type', 'work_id', 'assigned_at')
    list_display_links = ('employee',)
    search_fields = ('employee__name',)


@admin.register(CallLog)
class CallLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'name','phone','lead', 'client', 'call_type', 'outcome', 'called_at')
    list_display_links = ('name',)
    list_filter = ('call_type', 'outcome', 'name')
    search_fields = ('note', 'lead__name', 'client__name', 'employee__name')
    ordering = ('-called_at',)


@admin.register(FollowUp)
class FollowUpAdmin(admin.ModelAdmin):
    # Use fields that actually exist on the FollowUp model
    list_display = ('id', 'lead', 'assigned_to', 'status', 'due_date', 'completed_at', 'created_at')
    list_display_links = ('lead',)
    list_filter = ('status', 'assigned_to')
    search_fields = ('note', 'lead__name', 'assigned_to__name')
    ordering = ('-due_date',)

@admin.register(WorkGiven)
class WorkGivenAdmin(admin.ModelAdmin):
    # show relevant WorkGiven fields - use fields that actually exist on the model
    list_display = ("id", "employee", "title", "given_on", "submission_date", "priority", "status")
    search_fields = ("title", "description", "employee__name")
    list_filter = ("priority", "status", "given_on")
    raw_id_fields = ("employee",)