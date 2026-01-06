from django.urls import path, include
from rest_framework import routers
from .views import login_view

from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from .views import (
    EmployeeViewSet, LeadViewSet, ClientViewSet, ProjectViewSet,
    AssignmentViewSet, CallLogViewSet, FollowUpViewSet, EventViewSet,
    TrackingViewSet, TaskViewSet, WorkGivenViewSet,
    summary_view, home, dashboard_summary
)

router = routers.DefaultRouter()
router.register(r'employees', EmployeeViewSet)
router.register(r'leads', LeadViewSet)
router.register(r'clients', ClientViewSet)
router.register(r'projects', ProjectViewSet)
router.register(r'assignments', AssignmentViewSet)
router.register(r'call-logs', CallLogViewSet)
router.register(r'followups', FollowUpViewSet)
router.register(r'events', EventViewSet)
router.register(r'tracking', TrackingViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'work-given', WorkGivenViewSet)


urlpatterns = [
    path('v1/', include(router.urls)),
    path('v1/status/', home),
    path('v1/summary/', summary_view),
    path('v1/dashboard/', dashboard_summary),
    path("v1/login/", login_view),

    # ⭐ ONLY THESE TWO FOR DOCS
    path("v1/openapi/", SpectacularAPIView.as_view(), name="schema"),
    path("v1/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),

]
