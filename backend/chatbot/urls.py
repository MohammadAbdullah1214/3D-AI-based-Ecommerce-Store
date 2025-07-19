from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChatbotViewSet, BehaviorAnalyticsViewSet

router = DefaultRouter()
router.register(r'chat', ChatbotViewSet, basename='chatbot')
router.register(r'analytics', BehaviorAnalyticsViewSet, basename='behavior-analytics')

urlpatterns = [
    path('', include(router.urls)),
]
