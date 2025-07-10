from django.db import models
from django.utils import timezone
from django.conf import settings
from orders.models import Order
import uuid

class Payment(models.Model):
    PAYMENT_STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    )
    PAYMENT_METHOD_CHOICES = (
        ('credit_card', 'Credit Card'),
        ('paypal', 'PayPal'),
        ('bank_transfer', 'Bank Transfer'),
    )

    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='payment')
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='credit_card')
    status = models.CharField(max_length=10, choices=PAYMENT_STATUS_CHOICES, default='pending')
    transaction_id = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment {self.transaction_id} for Order {self.order.id}"


class Refund(models.Model):
    """
    Model to track refunds for payments
    """
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='refunds')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField()
    processed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    transaction_id = models.CharField(max_length=100, unique=True, default=uuid.uuid4)
    
    def __str__(self):
        return f"Refund {self.transaction_id} for Payment {self.payment.transaction_id}"