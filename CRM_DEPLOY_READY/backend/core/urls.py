from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    # 👇 Default redirect — opens /crm/v1/ automatically
    path('', RedirectView.as_view(url='/crm/v1/', permanent=False)),

    path('admin/', admin.site.urls),
    path('crm/', include('crm.urls')),
]
