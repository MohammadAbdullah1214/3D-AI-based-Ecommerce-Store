from rest_framework import serializers
from .models import ShippingMethod, ProductShippingOverride

class ShippingMethodSerializer(serializers.ModelSerializer):
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    
    class Meta:
        model = ShippingMethod
        fields = ['id', 'seller', 'seller_username', 'shipping_type', 'flat_rate_amount', 
                 'free_shipping_threshold', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['seller', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate shipping method data"""
        shipping_type = data.get('shipping_type')
        flat_rate_amount = data.get('flat_rate_amount')
        
        if shipping_type == 'flat_rate' and flat_rate_amount <= 0:
            raise serializers.ValidationError("Flat rate amount must be greater than zero")
            
        return data

class ProductShippingOverrideSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = ProductShippingOverride
        fields = ['id', 'product', 'product_name', 'override_seller_settings', 
                 'shipping_type', 'flat_rate_amount', 'is_active']
        read_only_fields = ['product']
    
    def validate(self, data):
        """Validate product shipping override data"""
        override_settings = data.get('override_seller_settings')
        shipping_type = data.get('shipping_type')
        flat_rate_amount = data.get('flat_rate_amount')
        
        if override_settings and shipping_type == 'flat_rate' and flat_rate_amount <= 0:
            raise serializers.ValidationError("Flat rate amount must be greater than zero")
            
        return data