import uuid

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q, Count, Sum
from django.utils import timezone
from django.db import transaction
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample, OpenApiResponse
from drf_spectacular.types import OpenApiTypes

from .models import Order, OrderItem, OrderStatusHistory
from .serializers import OrderSerializer, OrderItemSerializer, OrderCreateSerializer
from permissions import IsSellerOrAdmin


# Define custom permission classes for orders
class IsOrderOwner(permissions.BasePermission):
    """
    Custom permission to only allow the owner of an order to view or edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Allow if user is admin or staff
        if request.user.is_staff or request.user.role == 'admin':
            return True
        
        # Allow if user is the owner of the order
        return obj.user == request.user


class IsOrderSeller(permissions.BasePermission):
    """
    Custom permission to only allow the seller of products in an order to view or edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Allow if user is admin or staff
        if request.user.is_staff or request.user.role == 'admin':
            return True
        
        # Allow if user is a seller with products in this order
        return obj.items.filter(product__seller=request.user).exists()


class OrderViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing orders
    """
    queryset = Order.objects.all()
    serializer_class = OrderSerializer
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsOrderOwner()]
        elif self.action in ['seller_orders', 'update_status']:
            return [IsAuthenticated(), IsSellerOrAdmin()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin can see all orders
        if user.is_staff or user.role == 'admin':
            queryset = Order.objects.all()
        # Seller can see orders for their products
        elif user.role == 'seller':
            queryset = Order.objects.filter(items__product__seller=user).distinct()
        # Customer can see their own orders
        else:
            queryset = Order.objects.filter(user=user)
        
        # Filter by cancelled_by and cancelled_by_role if provided
        cancelled_by = self.request.query_params.get('cancelled_by')
        cancelled_by_role = self.request.query_params.get('cancelled_by_role')
        
        if cancelled_by:
            queryset = queryset.filter(cancelled_by=cancelled_by)
        
        if cancelled_by_role:
            queryset = queryset.filter(cancelled_by_role=cancelled_by_role)
            
        # Filter by status if provided
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
            
        # Filter by payment status if provided
        payment_status = self.request.query_params.get('payment_status')
        if payment_status:
            queryset = queryset.filter(payment_status=payment_status)
            
        # Filter by date range if provided
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        
        if start_date:
            queryset = queryset.filter(created_at__gte=start_date)
        
        if end_date:
            queryset = queryset.filter(created_at__lte=end_date)
            
        return queryset
    
    @extend_schema(
        description="List orders with optional filtering",
        parameters=[
            OpenApiParameter(
                name='cancelled_by',
                description='Filter by user ID who cancelled the order',
                required=False,
                type=int,
            ),
            OpenApiParameter(
                name='cancelled_by_role',
                description='Filter by role of who cancelled the order (customer, seller, admin)',
                required=False,
                type=str,
                enum=['customer', 'seller', 'admin']
            ),
            OpenApiParameter(
                name='status',
                description='Filter by order status',
                required=False,
                type=str,
                enum=['pending', 'processing', 'shipped', 'delivered', 'cancelled']
            ),
            OpenApiParameter(
                name='payment_status',
                description='Filter by payment status',
                required=False,
                type=str,
                enum=['pending', 'completed', 'failed', 'refunded']
            ),
            OpenApiParameter(
                name='start_date',
                description='Filter by start date (YYYY-MM-DD)',
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name='end_date',
                description='Filter by end date (YYYY-MM-DD)',
                required=False,
                type=str,
            ),
        ],
    )
    def list(self, request, *args, **kwargs):
        """
        List orders with optional filtering by who cancelled the order, status, payment status, and date range
        """
        return super().list(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        """
        Create a new order
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Set the user to the current user
        serializer.save(user=request.user)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @extend_schema(
        description="Get orders for products sold by the authenticated seller",
        parameters=[
            OpenApiParameter(
                name='cancelled_by',
                description='Filter by user ID who cancelled the order',
                required=False,
                type=int,
            ),
            OpenApiParameter(
                name='cancelled_by_role',
                description='Filter by role of who cancelled the order (customer, seller, admin)',
                required=False,
                type=str,
                enum=['customer', 'seller', 'admin']
            ),
            OpenApiParameter(
                name='status',
                description='Filter by order status',
                required=False,
                type=str,
                enum=['pending', 'processing', 'shipped', 'delivered', 'cancelled']
            ),
            OpenApiParameter(
                name='payment_status',
                description='Filter by payment status',
                required=False,
                type=str,
                enum=['pending', 'completed', 'failed', 'refunded']
            ),
            OpenApiParameter(
                name='start_date',
                description='Filter by start date (YYYY-MM-DD)',
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name='end_date',
                description='Filter by end date (YYYY-MM-DD)',
                required=False,
                type=str,
            ),
        ],
    )
    @action(detail=False, methods=['get'])
    def seller_orders(self, request):
        """
        Get orders for products sold by the authenticated seller
        """
        user = request.user
        
        # Check if user is a seller or admin
        if not (user.role == 'seller' or user.role == 'admin' or user.is_staff):
            return Response(
                {'error': 'Only sellers and admins can access this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get orders for products sold by the current user
        orders = Order.objects.filter(items__product__seller=user).distinct()
        
        # Filter by cancelled_by and cancelled_by_role if provided
        cancelled_by = request.query_params.get('cancelled_by')
        cancelled_by_role = request.query_params.get('cancelled_by_role')
        
        if cancelled_by:
            orders = orders.filter(cancelled_by=cancelled_by)
        
        if cancelled_by_role:
            orders = orders.filter(cancelled_by_role=cancelled_by_role)
        
        # Filter by status if provided
        status_param = request.query_params.get('status')
        if status_param:
            orders = orders.filter(status=status_param)
            
        # Filter by payment status if provided
        payment_status = request.query_params.get('payment_status')
        if payment_status:
            orders = orders.filter(payment_status=payment_status)
            
        # Filter by date range if provided
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            orders = orders.filter(created_at__gte=start_date)
        
        if end_date:
            orders = orders.filter(created_at__lte=end_date)
        
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        description="Get orders for the authenticated customer",
        parameters=[
            OpenApiParameter(
                name='cancelled_by',
                description='Filter by user ID who cancelled the order',
                required=False,
                type=int,
            ),
            OpenApiParameter(
                name='cancelled_by_role',
                description='Filter by role of who cancelled the order (customer, seller, admin)',
                required=False,
                type=str,
                enum=['customer', 'seller', 'admin']
            ),
            OpenApiParameter(
                name='status',
                description='Filter by order status',
                required=False,
                type=str,
                enum=['pending', 'processing', 'shipped', 'delivered', 'cancelled']
            ),
            OpenApiParameter(
                name='payment_status',
                description='Filter by payment status',
                required=False,
                type=str,
                enum=['pending', 'completed', 'failed', 'refunded']
            ),
            OpenApiParameter(
                name='start_date',
                description='Filter by start date (YYYY-MM-DD)',
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name='end_date',
                description='Filter by end date (YYYY-MM-DD)',
                required=False,
                type=str,
            ),
        ],
    )
    @action(detail=False, methods=['get'])
    def my_orders(self, request):
        """
        Get orders for the authenticated customer
        """
        user = request.user
        
        # Get orders for the current user
        orders = Order.objects.filter(user=user)
        
        # Filter by cancelled_by and cancelled_by_role if provided
        cancelled_by = request.query_params.get('cancelled_by')
        cancelled_by_role = request.query_params.get('cancelled_by_role')
        
        if cancelled_by:
            orders = orders.filter(cancelled_by=cancelled_by)
        
        if cancelled_by_role:
            orders = orders.filter(cancelled_by_role=cancelled_by_role)
        
        # Filter by status if provided
        status_param = request.query_params.get('status')
        if status_param:
            orders = orders.filter(status=status_param)
            
        # Filter by payment status if provided
        payment_status = request.query_params.get('payment_status')
        if payment_status:
            orders = orders.filter(payment_status=payment_status)
            
        # Filter by date range if provided
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            orders = orders.filter(created_at__gte=start_date)
        
        if end_date:
            orders = orders.filter(created_at__lte=end_date)
        
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        description="Update the status of an order",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'status': {
                        'type': 'string',
                        'enum': ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
                    },
                    'tracking_number': {'type': 'string'},
                    'notes': {'type': 'string'},
                    'cancellation_reason': {'type': 'string'},
                    'payment_status': {
                        'type': 'string',
                        'enum': ['pending', 'completed', 'failed', 'refunded']
                    }
                },
                'required': ['status']
            }
        }
    )
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """
        Update the status of an order
        """
        order = self.get_object()
        
        # Get the status from the request
        status_value = request.data.get('status')
        if not status_value:
            return Response(
                {'error': 'Status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate the status
        valid_statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
        if status_value not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Must be one of {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update the status
        order.status = status_value
        
        # If the status is cancelled, record who cancelled it
        if status_value == 'cancelled':
            order.cancelled_at = timezone.now()
            order.cancelled_by = request.user.id
            
            # Determine the role of the user who cancelled
            if request.user.is_staff:
                order.cancelled_by_role = 'admin'
            elif request.user.role == 'seller':
                order.cancelled_by_role = 'seller'
            else:
                order.cancelled_by_role = 'customer'
                
            # Record cancellation reason if provided
            cancellation_reason = request.data.get('cancellation_reason')
            if cancellation_reason:
                order.cancellation_reason = cancellation_reason
        
        # Update payment status if provided
        payment_status = request.data.get('payment_status')
        if payment_status:
            valid_payment_statuses = ['pending', 'completed', 'failed', 'refunded']
            if payment_status not in valid_payment_statuses:
                return Response(
                    {'error': f'Invalid payment status. Must be one of {", ".join(valid_payment_statuses)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            order.payment_status = payment_status
            
            # If there's a payment record, update it too
            try:
                payment = order.payment
                payment.status = payment_status
                payment.save()
            except:
                pass
        
        # Update tracking number if provided
        tracking_number = request.data.get('tracking_number')
        if tracking_number:
            order.tracking_number = tracking_number
        
        # Update notes if provided
        notes = request.data.get('notes')
        if notes:
            order.notes = notes
        
        # Create a status history entry
        try:
            OrderStatusHistory.objects.create(
                order=order,
                status=status_value,
                updated_by=request.user,
                notes=notes
            )
        except:
            # OrderStatusHistory model might not exist yet
            pass
        
        order.save()
        
        serializer = self.get_serializer(order)
        return Response(serializer.data)
    
    @extend_schema(
        description="Get order statistics and analytics",
        parameters=[
            OpenApiParameter(
                name='start_date',
                description='Filter by start date (YYYY-MM-DD)',
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name='end_date',
                description='Filter by end date (YYYY-MM-DD)',
                required=False,
                type=str,
            ),
        ],
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsSellerOrAdmin])
    def analytics(self, request):
        """
        Get order statistics and analytics
        """
        user = request.user
        
        # Determine which orders to analyze based on user role
        if user.is_staff or user.role == 'admin':
            orders = Order.objects.all()
        elif user.role == 'seller':
            orders = Order.objects.filter(items__product__seller=user).distinct()
        else:
            return Response(
                {'error': 'Only sellers and admins can access analytics'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Filter by date range if provided
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            orders = orders.filter(created_at__gte=start_date)
        
        if end_date:
            orders = orders.filter(created_at__lte=end_date)
        
        # Calculate analytics
        total_orders = orders.count()
        total_revenue = orders.filter(status__in=['processing', 'shipped', 'delivered']).aggregate(
            total=Sum('total_price')
        )['total'] or 0
        
        # Status breakdown
        status_counts = orders.values('status').annotate(count=Count('id'))
        status_breakdown = {item['status']: item['count'] for item in status_counts}
        
        # Payment status breakdown
        payment_status_counts = orders.values('payment_status').annotate(count=Count('id'))
        payment_status_breakdown = {item['payment_status']: item['count'] for item in payment_status_counts}
        
        # Cancellation analytics
        cancelled_orders = orders.filter(status='cancelled')
        total_cancelled = cancelled_orders.count()
        
        # Cancellation by role
        cancellation_by_role = cancelled_orders.values('cancelled_by_role').annotate(count=Count('id'))
        cancellation_role_breakdown = {
            item['cancelled_by_role'] or 'unknown': item['count'] 
            for item in cancellation_by_role
        }
        
        # Cancellation reasons (if the field exists)
        try:
            cancellation_reasons = cancelled_orders.exclude(cancellation_reason__isnull=True).exclude(
                cancellation_reason=''
            ).values('cancellation_reason').annotate(count=Count('id'))
            reason_breakdown = {
                item['cancellation_reason']: item['count'] 
                for item in cancellation_reasons
            }
        except:
            reason_breakdown = {}
        
        return Response({
            'total_orders': total_orders,
            'total_revenue': total_revenue,
            'status_breakdown': status_breakdown,
            'payment_status_breakdown': payment_status_breakdown,
            'cancellation': {
                'total_cancelled': total_cancelled,
                'by_role': cancellation_role_breakdown,
                'reasons': reason_breakdown
            }
        })
    
    @extend_schema(
        description="Export orders as CSV",
        parameters=[
            OpenApiParameter(
                name='status',
                description='Filter by order status',
                required=False,
                type=str,
                enum=['pending', 'processing', 'shipped', 'delivered', 'cancelled']
            ),
            OpenApiParameter(
                name='payment_status',
                description='Filter by payment status',
                required=False,
                type=str,
                enum=['pending', 'completed', 'failed', 'refunded']
            ),
            OpenApiParameter(
                name='start_date',
                description='Filter by start date (YYYY-MM-DD)',
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name='end_date',
                description='Filter by end date (YYYY-MM-DD)',
                required=False,
                type=str,
            ),
            OpenApiParameter(
                name='cancelled_by_role',
                description='Filter by role of who cancelled the order',
                required=False,
                type=str,
                enum=['customer', 'seller', 'admin']
            ),
        ],
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsSellerOrAdmin])
    def export(self, request):
        """
        Export orders as CSV
        """
        import csv
        from django.http import HttpResponse
        
        user = request.user
        
        # Determine which orders to export based on user role
        if user.is_staff or user.role == 'admin':
            orders = Order.objects.all()
        elif user.role == 'seller':
            orders = Order.objects.filter(items__product__seller=user).distinct()
        else:
            return Response(
                {'error': 'Only sellers and admins can export orders'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Apply filters
        status_param = request.query_params.get('status')
        if status_param:
            orders = orders.filter(status=status_param)
        
        payment_status = request.query_params.get('payment_status')
        if payment_status:
            orders = orders.filter(payment_status=payment_status)
        
        start_date = request.query_params.get('start_date')
        if start_date:
            orders = orders.filter(created_at__gte=start_date)
        
        end_date = request.query_params.get('end_date')
        if end_date:
            orders = orders.filter(created_at__lte=end_date)
        
        cancelled_by_role = request.query_params.get('cancelled_by_role')
        if cancelled_by_role:
            orders = orders.filter(cancelled_by_role=cancelled_by_role)
        
        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="orders.csv"'
        
        writer = csv.writer(response)
        
        # Write header row
        writer.writerow([
            'Order ID', 'Customer', 'Status', 'Payment Status', 'Created At', 'Total Price',
            'Cancelled At', 'Cancelled By', 'Cancelled By Role', 'Cancellation Reason',
            'Shipping Address', 'Tracking Number'
        ])
        
        # Write data rows
        for order in orders:
            # Get customer username
            try:
                customer_username = order.user.username
            except:
                customer_username = f"User {order.user_id}"
            
            # Get cancelled by username
            cancelled_by_username = ""
            if order.cancelled_by:
                try:
                    User = request.user.__class__
                    cancelled_user = User.objects.get(id=order.cancelled_by)
                    cancelled_by_username = cancelled_user.username
                except:
                    cancelled_by_username = f"User {order.cancelled_by}"
            
            # Get cancellation reason if it exists
            cancellation_reason = getattr(order, 'cancellation_reason', '')
            
            writer.writerow([
                order.id,
                customer_username,
                order.status,
                order.payment_status,
                order.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                order.total_price,
                order.cancelled_at.strftime('%Y-%m-%d %H:%M:%S') if order.cancelled_at else '',
                cancelled_by_username,
                order.cancelled_by_role or '',
                cancellation_reason,
                order.shipping_address,
                order.tracking_number or ''
            ])
        
        return response


class OrderItemViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing order items
    """
    queryset = OrderItem.objects.all()
    serializer_class = OrderItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        # Admin can see all order items
        if user.is_staff or user.role == 'admin':
            return OrderItem.objects.all()
        # Seller can see order items for their products
        elif user.role == 'seller':
            return OrderItem.objects.filter(product__seller=user)
        # Customer can see their own order items
        else:
            return OrderItem.objects.filter(order__user=user)
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsOrderOwner()]
        return [IsAuthenticated()]