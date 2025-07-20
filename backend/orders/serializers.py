from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from typing import Dict, Any, Optional, List, Union
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes
from decimal import Decimal

from .models import Order, OrderItem, OrderStatusHistory
from products.models import Product, ProductVariant
from products.serializers import ProductSerializer, ProductVariantSerializer
from carts.models import Cart, CartItem


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    updated_by_username = serializers.CharField(source='updated_by.username', read_only=True)
    
    class Meta:
        model = OrderStatusHistory
        fields = ['id', 'status', 'timestamp', 'updated_by', 'updated_by_username', 'notes']
        read_only_fields = ['id', 'timestamp', 'updated_by', 'updated_by_username']


class OrderItemSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    variant_details = ProductVariantSerializer(source='variant', read_only=True)
    quantity = serializers.IntegerField(min_value=1)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'))
    subtotal = serializers.SerializerMethodField()
    product_name = serializers.CharField(read_only=True)
    product_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    seller_name = serializers.CharField(read_only=True)
    seller_username = serializers.CharField(read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'order', 'product', 'product_details', 'variant', 'variant_details', 'quantity', 'price', 'subtotal', 'product_name', 'product_price', 'seller_name', 'seller_username']
        read_only_fields = ['order']
    
    def get_subtotal(self, obj):
        return obj.price * obj.quantity


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    customer_full_name = serializers.SerializerMethodField()
    seller_names = serializers.SerializerMethodField()
    cancelled_by_username = serializers.SerializerMethodField()
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    payment_details = serializers.SerializerMethodField()
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.00'))
    
    class Meta:
        model = Order
        fields = [
            'id', 'user', 'user_username', 'user_email', 'customer_full_name', 'seller_names', 'status', 'created_at', 'updated_at',
            'shipping_address', 'billing_address', 'payment_method', 'payment_status',
            'total_price', 'tracking_number', 'notes', 'items',
            'cancelled_at', 'cancelled_by', 'cancelled_by_username', 'cancelled_by_role',
            'cancellation_reason', 'status_history', 'payment_details'
        ]
        read_only_fields = [
            'user', 'created_at', 'updated_at', 'cancelled_at', 
            'cancelled_by', 'cancelled_by_role', 'status_history', 'payment_details'
        ]
    
    @extend_schema_field(OpenApiTypes.STR)
    def get_cancelled_by_username(self, obj) -> Optional[str]:
        if obj.cancelled_by:
            # Try to get the username of the user who cancelled the order
            User = self.context['request'].user.__class__
            try:
                user = User.objects.get(id=obj.cancelled_by)
                return user.username
            except User.DoesNotExist:
                return None
        return None
    
    @extend_schema_field(OpenApiTypes.OBJECT)
    def get_payment_details(self, obj) -> Optional[Dict[str, Any]]:
        # Get payment details if available
        try:
            payment = obj.payment
            from payments.serializers import PaymentSerializer
            return PaymentSerializer(payment).data  # type: ignore
        except:
            return None

    def get_customer_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_seller_names(self, obj):
        sellers = set()
        for item in obj.items.all():
            # Use snapshot if available, else fallback
            if item.seller_name:
                sellers.add(item.seller_name)
            elif hasattr(item.product, 'seller') and item.product.seller:
                sellers.add(item.product.seller.get_full_name() or item.product.seller.username)
        return ', '.join(sellers) if sellers else 'Unknown'


class OrderCreateSerializer(serializers.ModelSerializer):
    total_price = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.00'))
    
    class Meta:
        model = Order
        fields = [
            'shipping_address', 'billing_address', 'payment_method',
            'total_price', 'notes'
        ]
    
    @transaction.atomic
    def create(self, validated_data):
        user = validated_data.pop('user')
        
        # Create the order
        order = Order.objects.create(  # type: ignore
            user=user,
            status='pending',
            payment_status='pending',
            **validated_data
        )
        
        # Create initial status history entry
        try:
            OrderStatusHistory.objects.create(  # type: ignore
                order=order,
                status='pending',
                updated_by=user
            )
        except:
            # OrderStatusHistory model might not exist yet
            pass
        
        # Get the user's cart (FIX: use 'customer' instead of 'user')
        cart = Cart.objects.filter(customer=user).first()  # type: ignore
        if not cart:
            raise serializers.ValidationError("User has no cart")
        
        # Create order items from cart items
        for cart_item in cart.items.all():
            # Check if the product is still available
            product = cart_item.product
            if product.stock < cart_item.quantity:
                raise serializers.ValidationError(f"Not enough stock for {product.name}")
            
            # Check if variant is available if selected
            variant = cart_item.variant
            if variant and variant.stock < cart_item.quantity:
                raise serializers.ValidationError(f"Not enough stock for variant {variant.sku}")
            
            # Calculate the price
            price = product.discount_price if product.discount_price else product.price
            if variant:
                # Apply variant price adjustment
                price += variant.price_adjustment
            
            # Create the order item with snapshot fields
            OrderItem.objects.create(  # type: ignore
                order=order,
                product=product,
                variant=variant,
                quantity=cart_item.quantity,
                price=price,
                product_name=product.name,
                product_price=price,
                seller_name=(product.seller.get_full_name() if hasattr(product.seller, 'get_full_name') and callable(product.seller.get_full_name) else str(product.seller)),
                seller_username=getattr(product.seller, 'username', str(product.seller))
            )
            
            # Update stock
            product.stock -= cart_item.quantity
            product.save()
            
            if variant:
                variant.stock -= cart_item.quantity
                variant.save()
        
        # Clear the cart
        cart.items.all().delete()
        
        return order