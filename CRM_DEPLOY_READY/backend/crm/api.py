from rest_framework import viewsets, serializers, filters
from rest_framework.permissions import AllowAny
from .models import Employee, Lead, Client, Project, Assignment, CallLog, FollowUp

# ---------- Serializers ----------

class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['id', 'name', 'role', 'email']


class LeadSerializer(serializers.ModelSerializer):
    assigned_name = serializers.CharField(source='assigned.name', read_only=True)
    class Meta:
        model = Lead
        fields = ['id', 'name', 'source', 'status', 'assigned', 'assigned_name', 'created_at', 'notes']


class ClientSerializer(serializers.ModelSerializer):
    assigned_name = serializers.CharField(source='assigned.name', read_only=True)
    class Meta:
        model = Client
        fields = ['id', 'name', 'industry', 'assigned', 'assigned_name', 'created_at', 'notes']


class ProjectSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    assigned_name = serializers.CharField(source='assigned.name', read_only=True)
    class Meta:
        model = Project
        fields = ['id', 'title', 'client', 'client_name', 'progress', 'assigned', 'assigned_name', 'due', 'created_at', 'notes']


class AssignmentSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.name', read_only=True)
    class Meta:
        model = Assignment
        fields = ['id', 'employee', 'employee_name', 'work_type', 'work_id', 'assigned_at', 'notes']


class CallLogSerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(source='lead.name', read_only=True)
    class Meta:
        model = CallLog
        fields = ['id', 'lead', 'lead_name', 'note', 'called_at', 'duration_seconds']


class FollowUpSerializer(serializers.ModelSerializer):
    lead_name = serializers.CharField(source='lead.name', read_only=True)
    class Meta:
        model = FollowUp
        fields = ['id', 'lead', 'lead_name', 'note', 'due_date', 'completed', 'created_at']


# ---------- ViewSets ----------

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all().order_by('-id')
    serializer_class = EmployeeSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'email', 'role']


class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all().order_by('-created_at')
    serializer_class = LeadSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'source', 'status']


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all().order_by('-created_at')
    serializer_class = ClientSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'industry']


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by('-created_at')
    serializer_class = ProjectSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title']


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all().order_by('-assigned_at')
    serializer_class = AssignmentSerializer
    permission_classes = [AllowAny]


class CallLogViewSet(viewsets.ModelViewSet):
    queryset = CallLog.objects.all().order_by('-called_at')
    serializer_class = CallLogSerializer
    permission_classes = [AllowAny]


class FollowUpViewSet(viewsets.ModelViewSet):
    queryset = FollowUp.objects.all().order_by('-created_at')
    serializer_class = FollowUpSerializer
    permission_classes = [AllowAny]
