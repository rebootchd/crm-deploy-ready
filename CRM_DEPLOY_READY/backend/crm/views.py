# crm/views.py
import logging
from django.utils import timezone
from django.http import JsonResponse

from django.contrib.auth import authenticate

from rest_framework import viewsets, filters, status
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import CallLog
from rest_framework.decorators import action
from rest_framework import status
from django.utils.dateparse import parse_datetime

from django.shortcuts import get_object_or_404

from django_filters.rest_framework import DjangoFilterBackend

from .models import (
    Employee, Lead, Client, Project, Assignment,
    CallLog, FollowUp, Event, Tracking, Task
)
from .serializers import (
    EmployeeSerializer, LeadSerializer, ClientSerializer, ProjectSerializer,
    AssignmentSerializer, CallLogSerializer, FollowUpSerializer, EventSerializer,
    TrackingSerializer, TaskSerializer
)

logger = logging.getLogger(__name__)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get("email")  # frontend ka email field = username
    password = request.data.get("password")

    user = authenticate(username=username, password=password)

    if user is not None and user.is_active:
        return Response(
            {
                "message": "Login successful",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                },
            },
            status=status.HTTP_200_OK,
        )

    return Response(
        {"error": "Invalid credentials"},
        status=status.HTTP_401_UNAUTHORIZED,
    )




class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'email', 'role']
    ordering = ['name']


class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.select_related('assigned').all()
    serializer_class = LeadSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'source', 'assigned']
    search_fields = ['name', 'email', 'phone']
    ordering = ['-created_at']


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.select_related('assigned').all()
    serializer_class = ClientSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'industry']
    ordering = ['name']


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.select_related('client', 'assigned').all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['client', 'assigned', 'issue_date', 'submission_date']
    search_fields = ['title', 'client__name']
    ordering = ['-created_at']


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.select_related('employee').all().order_by('-id')
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee__name', 'work_type', 'notes']
    ordering = ['-assigned_at']




import pandas as pd
class CallLogViewSet(viewsets.ModelViewSet):
    queryset = CallLog.objects.select_related(
        "assigned", "lead", "client"
    ).order_by("-created_at")

    serializer_class = CallLogSerializer

    @action(detail=True, methods=["patch"])
    def toggle_follow_up(self, request, pk=None):
        obj = self.get_object()
        obj.follow_up = not obj.follow_up
        obj.save(update_fields=["follow_up"])
        return Response({"follow_up": obj.follow_up})

    # ===================== IMPORT CALL LOGS =====================
    @action(detail=False, methods=["post"], url_path="import")
    def import_calllogs(self, request):
        file = request.FILES.get("file")

        # 1️⃣ FILE CHECK
        if not file:
            return Response(
                {"error": "No file uploaded"},
                status=status.HTTP_400_BAD_REQUEST
            )

        name = file.name.lower()

        # 2️⃣ READ FILE
        try:
            if name.endswith(".csv"):
                df = pd.read_csv(file)
            elif name.endswith((".xlsx", ".xls")):
                df = pd.read_excel(file)
            else:
                return Response(
                    {"error": "Unsupported file format"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Exception as e:
            return Response(
                {"error": f"Failed to read file: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 3️⃣ COLUMN AUTO-MAPPING
        def normalize(col):
            return "".join(ch for ch in col.lower() if ch.isalnum())

        SMART_MAP = {
            "company_name": [
                "name", "client", "customer", "company", "firm", "org", "organisation", "organization"
            ],
            "phone": [
                "phone", "mobile", "contact", "number", "phoneno", "mobileno"
            ],
            "called_at": [
                "calledat", "calltime", "calldate", "date", "time", "datetime"
            ],
            "duration": [
                "duration", "length", "seconds", "minutes", "mins"
            ],
            "outcome": [
                "outcome", "result", "status", "remark", "response"
            ],
            "assigned": [
                "assigned", "agent", "caller", "executive", "employee", "user"
            ],
        }

        new_columns = {}

        for col in df.columns:
            ncol = normalize(col)
            matches = []

            for target, keywords in SMART_MAP.items():
                if any(k in ncol for k in keywords):
                    matches.append(target)

            # confidence rule: only auto-map if ONE clear match
            if len(matches) == 1:
                new_columns[col] = matches[0]

        df = df.rename(columns=new_columns)

        # 4️⃣ REQUIRED FIELD VALIDATION
        REQUIRED_FIELDS = {"company_name", "phone"}
        missing = REQUIRED_FIELDS - set(df.columns)

        if missing:
            return Response(
                {
                    "success": False,
                    "error": "Required fields missing after mapping",
                    "missing_fields": list(missing),
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 5️⃣ ROW CLEANING + OBJECT BUILD
        created = []
        skipped = []

        for idx, row in df.iterrows():
            company = str(row.get("company_name", "")).strip()
            phone = str(row.get("phone", "")).strip()

            if not company or not phone:
                skipped.append(idx + 2)
                continue

            called_at = None
            called_at_raw = row.get("called_at")
            if called_at_raw:
                called_at = parse_datetime(str(called_at_raw))

            duration = row.get("duration")
            try:
                duration = int(duration) if duration not in ("", None) else None
            except Exception:
                duration = None

            assigned = None
            emp_name = str(row.get("assigned", "")).strip()
            if emp_name:
                assigned = Employee.objects.filter(name__iexact=emp_name).first()

            created.append(
                CallLog(
                    name=company,
                    phone=phone,
                    called_at=called_at,
                    # duration=duration,
                    outcome=str(row.get("outcome", "")).strip(),
                    assigned=assigned,
                )
            )

        # 6️⃣ BULK SAVE
        CallLog.objects.bulk_create(created, batch_size=500)

        # 7️⃣ FINAL RESPONSE
        return Response(
            {
                "success": True,
                "message": "Column mapping successful",
                "created": len(created),  # ✅ ADD THIS
                "skipped": len(skipped),  # ✅ ADD THIS TOO (helpful!)
                "rows": len(df),
                "columns": list(df.columns),
            },
            status=status.HTTP_200_OK
        )


class FollowUpViewSet(viewsets.ModelViewSet):
    queryset = FollowUp.objects.select_related('lead').all()
    serializer_class = FollowUpSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['lead', 'due_date']
    search_fields = ['note', 'lead__name']
    ordering = ['-due_date']

    def get_queryset(self):
        try:
            return FollowUp.objects.select_related('lead').all()
        except Exception:
            logger.exception("Error building FollowUp queryset with select_related('lead')")
            return FollowUp.objects.all()

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        lead = None
        linked_id = self.request.data.get('linked_id') or self.request.data.get('lead')
        if linked_id:
            try:
                lead = Lead.objects.get(pk=linked_id)
            except Lead.DoesNotExist:
                lead = None
        serializer.save(created_by=user, lead=lead)


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by('-created_at')
    serializer_class = EventSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['event_type', 'entity_type', 'metadata']
    ordering = ['-created_at']


# Tracking viewset (for dashboard KPIs / trend)
class TrackingViewSet(viewsets.ModelViewSet):
    queryset = Tracking.objects.all().order_by("-created_at")
    serializer_class = TrackingSerializer
    permission_classes = [permissions.AllowAny]


# Task viewset (tasks used by Tracking page)
class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by('-created_at')
    serializer_class = TaskSerializer
    permission_classes = [permissions.AllowAny]


# summary endpoint (function-based)
@api_view(['GET'])
def summary_view(request):
    today = timezone.localdate()
    return Response({
        "total_leads": Lead.objects.count(),
        "total_clients": Client.objects.count(),
        "total_projects": Project.objects.count(),
        "total_employees": Employee.objects.count(),
        "total_assignments": Assignment.objects.count(),
        "total_calllogs": CallLog.objects.count(),
        "total_followups": FollowUp.objects.count(),
        "open_followups": FollowUp.objects.filter(status='pending').count(),
        "calls_today": CallLog.objects.filter(called_at__date=today).count(),
    })


@api_view(['GET'])
def dashboard_summary(request):
    """
    KPI data for Tracking dashboard (frontend KPIs).
    Abhi demo / simple values, baad me real finance models se connect kar sakte ho.
    """
    today = timezone.localdate()

    data = {
        "total_revenue": "₹ 0",          # TODO: replace with real calc later
        "total_revenue_percent": 0,      # e.g. month-on-month %
        "employees_active": Employee.objects.count(),
        "employees_pending": FollowUp.objects.filter(status='pending').count(),
        "receivables": "₹ 0",            # TODO: real receivables
        "receivables_note": "No data yet",
        "cash_balance": "₹ 0",           # TODO: real cash/bank balance
        "cash_note": "No data yet",
    }
    return Response(data)


from .models import WorkGiven
from .serializers import WorkGivenSerializer

class WorkGivenViewSet(viewsets.ModelViewSet):
    serializer_class = WorkGivenSerializer
    queryset = WorkGiven.objects.all()

    # 🔥 Add this block RIGHT HERE
    def perform_create(self, serializer):
        entity_type = self.request.data.get("entity_type", "").strip().lower()
        entity_id = self.request.data.get("entity_id")
        if entity_type in ("employee", "emp") and entity_id:
            serializer.save(employee_id=entity_id)
        else:
            serializer.save()

    def get_queryset(self):
        qs = super().get_queryset()
        try:
            entity_type = self.request.query_params.get("entity_type")
            entity_id = self.request.query_params.get("entity_id")
            if entity_type and entity_id:
                et_lower = str(entity_type).strip().lower()
                if et_lower in ("employee", "emp"):
                    try:
                        WorkGiven._meta.get_field("employee")
                        return qs.filter(employee_id=entity_id)
                    except Exception:
                        pass
            # fallback filters (keep original, but safe)
            try:
                if entity_type:
                    WorkGiven._meta.get_field("entity_type")
                    qs = qs.filter(entity_type=entity_type)
            except Exception:
                pass
            try:
                if entity_id:
                    WorkGiven._meta.get_field("entity_id")
                    qs = qs.filter(entity_id=entity_id)
            except Exception:
                pass
            return qs
        except Exception as e:
            # prevent 500: log and return empty queryset
            import logging
            logging.exception("WorkGiven get_queryset error")
            return WorkGiven.objects.none()


# small home/status JSON for /crm/status or similar
def home(request):
    return JsonResponse({
        "message": "CRM API running",
        "events_create": "/crm/events/create/",
        "note": "POST to /crm/events/ to create via ViewSet or to /crm/events/create/ for function endpoint"
    })
