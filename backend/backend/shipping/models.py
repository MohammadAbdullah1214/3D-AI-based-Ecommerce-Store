from django.db import models
from django.conf import settings

class ShippingMethod(models.Model):
    SHIPPING_TYPE_CHOICES = (
        ('free', 'Free Shipping'),
        ('flat_rate', 'Flat Rate'),
    )
    
    seller = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='shipping_method')
    shipping_type = models.CharField(max_length=10, choices=SHIPPING_TYPE_CHOICES, default='flat_rate')
    flat_rate_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    free_shipping_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=0.00, 
                                                help_text="Minimum order amount for free shipping")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Shipping method for {self.seller.username}"
    
    def calculate_shipping_cost(self, cart_total):
        """Calculate shipping cost based on shipping type and cart total"""
        if not self.is_active:
            return 0.00
            
        if self.shipping_type == 'free':
            return 0.00
            
        if self.shipping_type == 'flat_rate':
            # Check if order qualifies for free shipping
            if self.free_shipping_threshold > 0 and cart_total >= self.free_shipping_threshold:
                return 0.00
            return self.flat_rate_amount
            
        return 0.00

# Product-specific shipping overrides (optional)
class ProductShippingOverride(models.Model):
    product = models.OneToOneField('products.Product', on_delete=models.CASCADE, related_name='shipping_override')
    override_seller_settings = models.BooleanField(default=False)
    shipping_type = models.CharField(max_length=10, choices=ShippingMethod.SHIPPING_TYPE_CHOICES, default='flat_rate')
    flat_rate_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return f"Shipping override for {self.product.name}"