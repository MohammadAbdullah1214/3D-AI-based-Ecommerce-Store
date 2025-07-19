from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GenerationRequestViewSet, GenerationProgressViewSet

router = DefaultRouter()
router.register(r'requests', GenerationRequestViewSet, basename='generation-request')
router.register(r'progress', GenerationProgressViewSet, basename='generation-progress')

urlpatterns = [
    path('', include(router.urls)),
]
