from django.urls import path
from .views import (
    get_csrf_token,
    register_view,
    login_view,
    logout_view,
    profile_view,
    update_profile_view,
    check_auth_status,
)

urlpatterns = [
    path('csrf/', get_csrf_token, name='csrf'),
    path('register/', register_view, name='register'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('profile/', profile_view, name='profile'),
    path('profile/update/', update_profile_view, name='profile_update'),
    path('check/', check_auth_status, name='check_auth'),
]
