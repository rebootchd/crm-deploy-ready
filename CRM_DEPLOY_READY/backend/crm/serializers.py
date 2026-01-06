from rest_framework import serializers
from .models import (
    Employee, Lead, Client, Project, Assignment,
    CallLog, FollowUp
)

# ----------------------------
# Simple serializers for core models
# ----------------------------
class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = '__all__'
        read_only_fields = ('id', 'created_at')


class LeadSerializer(serializers.ModelSerializer):
    assigned_display = serializers.StringRelatedField(source='assigned', read_only=True)
    phone = serializers.CharField(required=False, allow_blank=True)  # 👈 add this line

    class Meta:
        model = Lead
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'assigned_display')


class ClientSerializer(serializers.ModelSerializer):
    assigned_display = serializers.StringRelatedField(source='assigned', read_only=True)

    class Meta:
        model = Client
        fields = '__all__'
        read_only_fields = ('id', 'name', 'phone', 'source', 'status', 'assigned', 'created_at', 'notes')


class ProjectSerializer(serializers.ModelSerializer):
    client_display = serializers.StringRelatedField(source='client', read_only=True)
    assigned_display = serializers.StringRelatedField(source='assigned', read_only=True)

    class Meta:
        model = Project
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'client_display', 'assigned_display')

    def validate_progress(self, value):
        """Ensure progress is between 0 and 100."""
        if value is None:
            return value
        if not (0 <= value <= 100):
            raise serializers.ValidationError("Progress must be between 0 and 100.")
        return value


# ---------- ASSIGNMENTS ----------
class AssignmentSerializer(serializers.ModelSerializer):
    employee_display = serializers.StringRelatedField(source='employee', read_only=True)
    assigned_date = serializers.SerializerMethodField()

    def get_assigned_date(self, obj):
        if obj.assigned_at:
            return obj.assigned_at.date().isoformat()
        return None

    class Meta:
        model = Assignment
        fields = [
            'id',
            'employee', 'employee_display',
            'work_type', 'work_id',
            'assigned_at',
            'assigned_date',
            'notes',
        ]


# ---------- CALL LOGS ----------
from rest_framework import serializers
from .models import CallLog, Employee

class CallLogSerializer(serializers.ModelSerializer):
    assigned_display = serializers.SerializerMethodField()
    lead_display = serializers.SerializerMethodField()
    client_display = serializers.SerializerMethodField()

    class Meta:
        model = CallLog
        fields = [
            "id",
            "name",
            "phone",
            "call_type",
            "outcome",
            "called_at",
            "duration_seconds",
            "notes",
            "follow_up",
            "is_missed",
            "assigned",
            "assigned_display",
            "lead",
            "lead_display",
            "client",
            "client_display",
            "created_at",
        ]

    def get_assigned_display(self, obj):
        return obj.assigned.name if obj.assigned else ""

    def get_lead_display(self, obj):
        return obj.lead.name if obj.lead else ""

    def get_client_display(self, obj):
        return obj.client.name if obj.client else ""


class FollowUpSerializer(serializers.ModelSerializer):
    # expose API names your React expects
    linked_type = serializers.CharField(write_only=True, required=False, default='Lead')
    linked_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    linked_name = serializers.CharField(read_only=True)
    date_time = serializers.DateTimeField(source='due_date')
    purpose = serializers.CharField(source='note', allow_blank=True)
    assigned_to = serializers.PrimaryKeyRelatedField(queryset=Employee.objects.all(), allow_null=True)
    status = serializers.CharField()

    class Meta:
        model = FollowUp
        fields = (
            'id','linked_type','linked_id','linked_name','date_time','purpose',
            'assigned_to','status','created_at','completed_at'
        )

    def create(self, validated_data):
        # handle mapped fields
        linked_type = self.initial_data.get('linked_type', 'Lead')
        linked_id = self.initial_data.get('linked_id')
        if linked_type == 'Lead' and linked_id:
            try:
                lead = Lead.objects.get(pk=linked_id)
            except Lead.DoesNotExist:
                lead = None
        else:
            lead = None

        # date_time was mapped to due_date by source option
        due_date = validated_data.get('due_date', None)
        note = validated_data.get('note', '')

        fu = FollowUp.objects.create(
            lead=lead,
            note=note,
            due_date=due_date,
            assigned_to=validated_data.get('assigned_to', None),
            status=validated_data.get('status', 'pending')
        )
        # set linked_name for read responses
        fu_linked_name = lead.name if lead else ""
        fu.linked_name = fu_linked_name  # not saved to DB, but serializer will return it
        return fu

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        # add linked_name for frontend
        rep['linked_name'] = instance.lead.name if instance.lead else ''
        # ensure API shape matches what React expects
        rep['reminder'] = False
        rep['reminder_minutes_before'] = 60
        rep['linked_type'] = 'Lead'
        rep['linked_id'] = instance.lead.id if instance.lead else None
        rep['assigned_display'] = (
            instance.assigned_to.name if instance.assigned_to else ""
        )

        return rep



from .models import Event

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'




from .models import Tracking

class TrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tracking
        fields = '__all__'



from .models import Task

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ('id', 'title', 'owner', 'priority', 'due', 'progress')



from .models import WorkGiven

class WorkGivenSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkGiven
        fields = "__all__"

