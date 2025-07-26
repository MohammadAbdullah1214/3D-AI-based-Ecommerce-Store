from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)

urlpatterns = [
    # Include the router URLs
    path('', include(router.urls)),
    
    # Authentication endpoints
    path('auth/login/', views.user_login, name='user_login'),
    path('auth/check-username/', views.check_username_availability, name='check_username'),
    
    # Password reset endpoints
    path('auth/forgot-password/', views.forgot_password, name='forgot_password'),
    path('auth/verify-otp/', views.verify_otp, name='verify_otp'),
    path('auth/reset-password/', views.reset_password, name='reset_password'),
    
    # Email verification endpoints
    path('auth/verify-email/', views.verify_email, name='verify_email'),
    path('auth/resend-verification/', views.resend_verification_email, name='resend_verification'),
    
    # Admin endpoints
    path('admin/user-stats/', views.user_stats, name='user_stats'),
]
