# cart/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer
from products.models import Product, ProductVariant
from shipping.models import ShippingMethod
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from permissions import IsCartOwner
import logging

# Set up logger
logger = logging.getLogger(__name__)

class CartViewSet(viewsets.GenericViewSet):
    """
    Cart API - only exposes specific actions, not the full ModelViewSet
    """
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated, IsCartOwner]
    
    def get_queryset(self):
        """Users can only see their own cart"""
        if self.request.user.is_staff or self.request.user.role == 'admin':
            return Cart.objects.all()
        return Cart.objects.filter(customer=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_cart(self, request):
        """Get or create the user's cart"""
        cart, created = Cart.objects.get_or_create(customer=request.user)
        serializer = self.get_serializer(cart)
        return Response(serializer.data)
    
    @extend_schema(
        description='Calculate shipping costs for the current cart',
        responses={200: {
            'type': 'object',
            'properties': {
                'shipping_details': {
                    'type': 'array',
                    'items': {
                        'type': 'object',
                        'properties': {
                            'seller_id': {'type': 'integer'},
                            'seller_name': {'type': 'string'},
                            'subtotal': {'type': 'number'},
                            'shipping_cost': {'type': 'number'},
                            'shipping_type': {'type': 'string'},
                            'free_shipping_threshold': {'type': 'number'},
                            'qualifies_for_free_shipping': {'type': 'boolean'}
                        }
                    }
                },
                'total_shipping': {'type': 'number'},
                'grand_total': {'type': 'number'}
            }
        }}
    )
    @action(detail=False, methods=['get'])
    def shipping_costs(self, request):
        """Calculate shipping costs for the current cart"""
        cart, created = Cart.objects.get_or_create(customer=request.user)
        serializer = self.get_serializer(cart)
        shipping_info = serializer.data.get('shipping_info', {})
        return Response(shipping_info)
    
    @extend_schema(
        request=OpenApiTypes.OBJECT,
        parameters=[
            OpenApiParameter(
                name='product_id',
                description='Product ID to add to cart',
                required=True,
                type=int,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='variant_id',
                description='Product Variant ID (optional)',
                required=False,
                type=int,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='quantity',
                description='Quantity to add (default: 1)',
                required=False,
                type=int,
                location=OpenApiParameter.QUERY
            ),
        ],
        examples=[
            OpenApiExample(
                'Example Request',
                value={
                    'product_id': 1,
                    'variant_id': 2,
                    'quantity': 2
                },
                request_only=True,
            ),
        ],
        description='Add a product to the user\'s cart'
    )
    @action(detail=False, methods=['post'])
    def add_item(self, request):
        """Add an item to the user's cart"""
        try:
            # Prevent all sellers from adding any products to the cart
            if hasattr(request.user, 'role') and request.user.role == 'seller':
                return Response({"error": "Sellers cannot add products to the cart."}, status=status.HTTP_403_FORBIDDEN)
            # Get or create the cart
            cart, created = Cart.objects.get_or_create(customer=request.user)
            
            # Get product, variant, and quantity from request
            # Check both query parameters and request body
            product_id = request.query_params.get('product_id') or request.data.get('product_id')
            variant_id = request.query_params.get('variant_id') or request.data.get('variant_id')
            
            if not product_id:
                return Response({"error": "Product ID is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                quantity = int(request.query_params.get('quantity') or request.data.get('quantity', 1))
                if quantity <= 0:
                    return Response({"error": "Quantity must be greater than zero"}, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response({"error": "Quantity must be a valid number"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get the product
            try:
                product = Product.objects.get(id=product_id)
            except Product.DoesNotExist:
                return Response({"error": f"Product with ID {product_id} does not exist"}, status=status.HTTP_404_NOT_FOUND)
            
            # Prevent sellers from adding their own products to cart
            if product.seller == request.user:
                return Response({"error": "You cannot add your own product to your cart."}, status=status.HTTP_403_FORBIDDEN)
            
            # Get the variant if specified
            variant = None
            if variant_id:
                try:
                    variant = ProductVariant.objects.get(id=variant_id, product=product)
                except ProductVariant.DoesNotExist:
                    return Response(
                        {"error": f"Variant with ID {variant_id} does not exist for this product"},
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Check if variant is in stock
                if variant.stock < quantity:
                    return Response(
                        {"error": f"Not enough stock for this variant. Only {variant.stock} available."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            else:
                # Check if product is in stock
                if product.stock < quantity:
                    return Response(
                        {"error": f"Not enough stock. Only {product.stock} available."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            # Check if item already exists in cart
            try:
                cart_item = CartItem.objects.get(cart=cart, product=product, variant=variant)
                # Update quantity 
                cart_item.quantity += quantity
                # Validate stock again
                if variant:
                    if variant.stock < cart_item.quantity:
                        return Response(
                            {"error": f"Not enough stock for this variant. Only {variant.stock} available."},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                elif product.stock < cart_item.quantity:
                    return Response(
                        {"error": f"Not enough stock. Only {product.stock} available."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                cart_item.save()
                logger.info(f"Updated cart item: {cart_item.id}, product: {product.id}, variant: {variant.id if variant else None}, quantity: {cart_item.quantity}")
            except CartItem.DoesNotExist:
                # Create new cart item
                cart_item = CartItem.objects.create(
                    cart=cart,
                    product=product,
                    variant=variant,
                    quantity=quantity
                )
                logger.info(f"Created new cart item: {cart_item.id}, product: {product.id}, variant: {variant.id if variant else None}, quantity: {quantity}")
            
            
            # Return updated cart
            cart.refresh_from_db()  # Refresh to ensure we get the latest data
            serializer = self.get_serializer(cart)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error adding item to cart: {str(e)}")
            return Response({"error": f"An error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        request=OpenApiTypes.OBJECT,
        parameters=[
            OpenApiParameter(
                name='item_id',
                description='Cart item ID to update',
                required=True,
                type=int,
                location=OpenApiParameter.QUERY
            ),
            OpenApiParameter(
                name='quantity',
                description='New quantity',
                required=True,
                type=int,
                location=OpenApiParameter.QUERY
            ),
        ],
        examples=[
            OpenApiExample(
                'Example Request',
                value={
                    'item_id': 1,
                    'quantity': 3
                },
                request_only=True,
            ),
        ],
        description='Update the quantity of an item in the cart'
    )
    @action(detail=False, methods=['post'])
    def update_item(self, request):
        """Update quantity of an item in the cart"""
        try:
            cart = get_object_or_404(Cart, customer=request.user)
            
            # Check both query parameters and request body
            item_id = request.query_params.get('item_id') or request.data.get('item_id')
            if not item_id:
                return Response({"error": "Item ID is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                quantity = int(request.query_params.get('quantity') or request.data.get('quantity', 1))
                if quantity <= 0:
                    return Response({"error": "Quantity must be greater than zero"}, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response({"error": "Quantity must be a valid number"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get the cart item
            try:
                cart_item = CartItem.objects.get(id=item_id, cart=cart)
            except CartItem.DoesNotExist:
                return Response({"error": f"Cart item with ID {item_id} does not exist"}, status=status.HTTP_404_NOT_FOUND)
            
            # Check if product is in stock
            if cart_item.variant:
                if cart_item.variant.stock < quantity:
                    return Response(
                        {"error": f"Not enough stock for this variant. Only {cart_item.variant.stock} available."},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            elif cart_item.product.stock < quantity:
                return Response(
                    {"error": f"Not enough stock. Only {cart_item.product.stock} available."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update quantity
            cart_item.quantity = quantity
            cart_item.save()
            logger.info(f"Updated cart item: {cart_item.id}, quantity: {quantity}")
            
            # Return updated cart
            cart.refresh_from_db()  # Refresh to ensure we get the latest data
            serializer = self.get_serializer(cart)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error updating cart item: {str(e)}")
            return Response({"error": f"An error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        request=OpenApiTypes.OBJECT,
        parameters=[
            OpenApiParameter(
                name='item_id',
                description='Cart item ID to remove',
                required=True,
                type=int,
                location=OpenApiParameter.QUERY
            ),
        ],
        examples=[
            OpenApiExample(
                'Example Request',
                value={
                    'item_id': 1
                },
                request_only=True,
            ),
        ],
        description='Remove an item from the cart'
    )
    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        """Remove an item from the cart"""
        try:
            cart = get_object_or_404(Cart, customer=request.user)
            
            # Check both query parameters and request body
            item_id = request.query_params.get('item_id') or request.data.get('item_id')
            if not item_id:
                return Response({"error": "Item ID is required"}, status=status.HTTP_400_BAD_REQUEST)
            
            # Get and delete the cart item
            try:
                cart_item = CartItem.objects.get(id=item_id, cart=cart)
                cart_item.delete()
                logger.info(f"Removed cart item: {item_id}")
            except CartItem.DoesNotExist:
                return Response({"error": f"Cart item with ID {item_id} does not exist"}, status=status.HTTP_404_NOT_FOUND)
            
            # Return updated cart
            cart.refresh_from_db()  # Refresh to ensure we get the latest data
            serializer = self.get_serializer(cart)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error removing cart item: {str(e)}")
            return Response({"error": f"An error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def clear(self, request):
        """Clear all items from the cart"""
        try:
            cart = get_object_or_404(Cart, customer=request.user)
            cart.items.all().delete()
            logger.info(f"Cleared cart for user: {request.user.id}")
            
            # Return empty cart
            cart.refresh_from_db()  # Refresh to ensure we get the latest data
            serializer = self.get_serializer(cart)
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error clearing cart: {str(e)}")
            return Response({"error": f"An error occurred: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)