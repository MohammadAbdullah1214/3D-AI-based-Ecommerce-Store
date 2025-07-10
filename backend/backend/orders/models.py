from django.db import models
from django.conf import settings
from django.utils import timezone

from products.models import Product, ProductVariant


class Order(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    shipping_address = models.TextField()
    billing_address = models.TextField()
    payment_method = models.CharField(max_length=50)
    payment_status = models.CharField(max_length=20, default='pending')
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    tracking_number = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    # Fields for cancellation tracking
    cancelled_at = models.DateTimeField(blank=True, null=True)
    cancelled_by = models.IntegerField(blank=True, null=True)  # User ID who cancelled
    cancelled_by_role = models.CharField(max_length=20, blank=True, null=True)  # Role of user who cancelled
    cancellation_reason = models.TextField(blank=True, null=True)  # Reason for cancellation
    
    def __str__(self):
        return f"Order {self.id} - {self.user.username}"
    
    def save(self, *args, **kwargs):
        # If status is changed to cancelled and cancelled_at is not set, set it now
        if self.status == 'cancelled' and not self.cancelled_at:
            self.cancelled_at = timezone.now()
        
        super().save(*args, **kwargs)


class OrderStatusHistory(models.Model):
    """
    Model to track order status changes
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=20, choices=Order.STATUS_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"Order {self.order.id} - {self.status} at {self.timestamp}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Price at time of purchase
    
    def __str__(self):
        variant_info = f" - {self.variant.sku}" if self.variant else ""
        return f"{self.product.name}{variant_info} x {self.quantity}"