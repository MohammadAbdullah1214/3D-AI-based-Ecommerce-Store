from rest_framework import viewsets, permissions, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import ShippingMethod, ProductShippingOverride
from .serializers import ShippingMethodSerializer, ProductShippingOverrideSerializer
from products.models import Product
from permissions import IsSellerOrAdmin
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

class ShippingMethodViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing shipping methods
    """
    serializer_class = ShippingMethodSerializer
    permission_classes = [permissions.IsAuthenticated, IsSellerOrAdmin]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role == 'admin':
            return ShippingMethod.objects.all()
        elif user.role == 'seller':
            return ShippingMethod.objects.filter(seller=user)
        return ShippingMethod.objects.none()
    
    def perform_create(self, serializer):
        # Check if user already has a shipping method
        if ShippingMethod.objects.filter(seller=self.request.user).exists():
            raise serializers.ValidationError("You already have a shipping method configured")
        serializer.save(seller=self.request.user)
    
    @extend_schema(
        description="Get the current user's shipping method",
        responses={200: ShippingMethodSerializer}
    )
    @action(detail=False, methods=['get'])
    def my_shipping_method(self, request):
        """Get the current user's shipping method"""
        if request.user.role != 'seller':
            return Response(
                {"error": "Only sellers can have shipping methods"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        shipping_method, created = ShippingMethod.objects.get_or_create(
            seller=request.user,
            defaults={
                'shipping_type': 'flat_rate',
                'flat_rate_amount': 5.00,
                'is_active': True
            }
        )
        
        serializer = self.get_serializer(shipping_method)
        return Response(serializer.data)
    
    @extend_schema(
        description="Calculate shipping cost for a cart",
        request=OpenApiTypes.OBJECT,
        parameters=[
            OpenApiParameter(
                name='seller_id',
                description='Seller ID to calculate shipping for',
                required=True,
                type=int,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='cart_total',
                description='Cart total amount',
                required=True,
                type=float,
                location=OpenApiParameter.QUERY
            ),
        ],
        examples=[
            OpenApiExample(
                'Example Request',
                value={
                    'seller_id': 1,
                    'cart_total': 50.00
                },
                request_only=True,
            ),
        ],
    )
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def calculate_shipping(self, request):
        """Calculate shipping cost for a cart"""
        seller_id = request.data.get('seller_id')
        cart_total = request.data.get('cart_total')
        
        if not seller_id or not cart_total:
            return Response(
                {"error": "seller_id and cart_total are required"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            cart_total = float(cart_total)
        except ValueError:
            return Response(
                {"error": "cart_total must be a valid number"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            shipping_method = ShippingMethod.objects.get(seller_id=seller_id)
        except ShippingMethod.DoesNotExist:
            return Response(
                {"shipping_cost": 0.00, "message": "No shipping method found for this seller"},
                status=status.HTTP_200_OK
            )
            
        shipping_cost = shipping_method.calculate_shipping_cost(cart_total)
        
        return Response({
            "shipping_cost": shipping_cost,
            "shipping_type": shipping_method.shipping_type,
            "free_shipping_threshold": shipping_method.free_shipping_threshold
        })

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='Shipping Method ID'
            ),
        ]
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='Shipping Method ID'
            ),
        ]
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='Shipping Method ID'
            ),
        ]
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='Shipping Method ID'
            ),
        ]
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

class ProductShippingOverrideViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing product-specific shipping overrides
    """
    serializer_class = ProductShippingOverrideSerializer
    permission_classes = [permissions.IsAuthenticated, IsSellerOrAdmin]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role == 'admin':
            return ProductShippingOverride.objects.all()
        elif user.role == 'seller':
            return ProductShippingOverride.objects.filter(product__seller=user)
        return ProductShippingOverride.objects.none()
    
    def perform_create(self, serializer):
        product_id = self.request.data.get('product')
        product = get_object_or_404(Product, id=product_id)
        
        # Check if user is the seller of the product
        if product.seller != self.request.user and not (self.request.user.is_staff or self.request.user.role == 'admin'):
            raise serializers.ValidationError("You can only create shipping overrides for your own products")
            
        # Check if product already has a shipping override
        if ProductShippingOverride.objects.filter(product=product).exists():
            raise serializers.ValidationError("This product already has a shipping override")
            
        serializer.save(product=product)
    
    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='Product Shipping Override ID'
            ),
        ]
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)
    
    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='Product Shipping Override ID'
            ),
        ]
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)
    
    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='Product Shipping Override ID'
            ),
        ]
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
    
    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='id',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
                description='Product Shipping Override ID'
            ),
        ]
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)