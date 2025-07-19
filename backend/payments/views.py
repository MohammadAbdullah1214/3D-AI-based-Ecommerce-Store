from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import Payment
from .serializers import PaymentSerializer
from orders.models import Order


# Define permission class directly in the views file
class IsSellerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow sellers or admins to access the view.
    """
    def has_permission(self, request, view):
        # Check if user is authenticated
        if not request.user.is_authenticated:
            return False
        
        # Allow if user is admin or staff
        if request.user.is_staff or request.user.role == 'admin':
            return True
        
        # Allow if user is a seller
        return request.user.role == 'seller'


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.role == 'admin':
            return Payment.objects.all()
        elif user.role == 'seller':
            # Sellers can see payments for orders containing their products
            return Payment.objects.filter(order__items__product__seller=user).distinct()
        else:
            # Regular users can only see their own payments
            return Payment.objects.filter(order__user=user)

    def perform_create(self, serializer):
        # Ensure the user can only create payments for their own orders
        order_id = self.request.data.get('order')
        try:
            order = Order.objects.get(id=order_id)
            
            # Check if user is authorized to create payment for this order
            if not (self.request.user.is_staff or self.request.user.role == 'admin'):
                if order.user != self.request.user:
                    raise permissions.exceptions.PermissionDenied("You can only create payments for your own orders")
            
            # Set the amount to match the order total if not specified
            amount = self.request.data.get('amount')
            if not amount:
                amount = order.total_price
            
            serializer.save(amount=amount)
        except Order.DoesNotExist:
            from rest_framework import serializers
            raise serializers.ValidationError("Order does not exist")

    @extend_schema(
        description="Process a refund for a payment",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'reason': {'type': 'string'},
                    'amount': {'type': 'number'},
                },
                'required': ['reason']
            }
        }
    )
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsSellerOrAdmin])
    def refund(self, request, pk=None):
        """Process a refund for a payment"""
        payment = self.get_object()
        
        # Check if payment can be refunded
        if payment.status != 'completed':
            return Response(
                {'error': 'Only completed payments can be refunded'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get refund reason and amount
        reason = request.data.get('reason')
        if not reason:
            return Response(
                {'error': 'Refund reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        refund_amount = request.data.get('amount')
        if not refund_amount:
            refund_amount = payment.amount
        
        # Update payment status
        payment.status = 'refunded'
        payment.save()
        
        # Update order status if it's not already cancelled
        order = payment.order
        if order.status != 'cancelled':
            order.status = 'cancelled'
            order.cancelled_at = timezone.now()
            order.cancelled_by = request.user.id
            
            # Set cancelled_by_role based on user role
            if request.user.is_staff:
                order.cancelled_by_role = 'admin'
            elif request.user.role == 'seller':
                order.cancelled_by_role = 'seller'
            else:
                order.cancelled_by_role = 'customer'
            
            order.cancellation_reason = f"Refund processed: {reason}"
            order.save()
            
            # Create order status history entry
            try:
                from orders.models import OrderStatusHistory
                OrderStatusHistory.objects.create(
                    order=order,
                    status='cancelled',
                    updated_by=request.user,
                    notes=f"Order cancelled due to refund. Reason: {reason}"
                )
            except:
                pass
        
        # Create refund record
        try:
            from .models import Refund
            Refund.objects.create(
                payment=payment,
                amount=refund_amount,
                reason=reason,
                processed_by=request.user
            )
        except ImportError:
            # Refund model might not exist yet
            pass
        
        return Response({
            'success': True,
            'message': 'Payment refunded successfully',
            'payment': PaymentSerializer(payment).data
        })