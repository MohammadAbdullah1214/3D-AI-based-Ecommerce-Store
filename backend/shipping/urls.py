from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ShippingMethodViewSet, ProductShippingOverrideViewSet

router = DefaultRouter()
router.register(r'methods', ShippingMethodViewSet, basename='shipping-method')
router.register(r'product-overrides', ProductShippingOverrideViewSet, basename='product-shipping-override')

urlpatterns = [
    path('', include(router.urls)),
]