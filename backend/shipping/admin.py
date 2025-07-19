from django.contrib import admin
from .models import ShippingMethod, ProductShippingOverride

@admin.register(ShippingMethod)
class ShippingMethodAdmin(admin.ModelAdmin):
    list_display = ['seller', 'shipping_type', 'flat_rate_amount', 'free_shipping_threshold', 'is_active']
    list_filter = ['shipping_type', 'is_active']
    search_fields = ['seller__username']

@admin.register(ProductShippingOverride)
class ProductShippingOverrideAdmin(admin.ModelAdmin):
    list_display = ['product', 'override_seller_settings', 'shipping_type', 'flat_rate_amount', 'is_active']
    list_filter = ['shipping_type', 'is_active', 'override_seller_settings']
    search_fields = ['product__name']