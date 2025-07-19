from django.db import models
from django.conf import settings
from products.models import Product, ProductVariant
from django.db.models import Sum, F

class Cart(models.Model):
    customer = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Cart for {self.customer.username}"
    
    @property
    def total_amount(self):
        """Calculate the total amount of the cart"""
        return sum(item.subtotal for item in self.items.all())
    
    @property
    def item_count(self):
        """Calculate the total number of items in the cart"""
        return self.items.aggregate(total=Sum('quantity'))['total'] or 0

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('cart', 'product', 'variant')
    
    def __str__(self):
        variant_info = f" ({self.variant.sku})" if self.variant else ""
        return f"{self.quantity} x {self.product.name}{variant_info} in cart for {self.cart.customer.username}"
    
    @property
    def subtotal(self):
        """Calculate the subtotal for this item"""
        # Use discount_price if available, otherwise use regular price
        price = self.product.discount_price if self.product.discount_price and self.product.discount_price > 0 else self.product.price
        
        # Add variant price adjustment if applicable
        if self.variant:
            price += self.variant.price_adjustment
            
        return price * self.quantity