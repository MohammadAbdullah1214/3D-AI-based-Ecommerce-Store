from django.db import models
from django.conf import settings
from products.models import Product, Category

class UserActivity(models.Model):
    """Track user activity for analytics and recommendations"""
    ACTIVITY_TYPES = (
        ('view', 'View'),
        ('search', 'Search'),
        ('add_to_cart', 'Add to Cart'),
        ('purchase', 'Purchase'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    session_id = models.CharField(max_length=255, null=True, blank=True)
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPES)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, null=True, blank=True)
    search_query = models.CharField(max_length=255, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['user'], name='user_activity_user_idx'),
            models.Index(fields=['session_id'], name='user_activity_session_idx'),
            models.Index(fields=['activity_type'], name='user_activity_type_idx'),
            models.Index(fields=['timestamp'], name='user_activity_time_idx'),
        ]
        verbose_name_plural = "User Activities"
    
    def __str__(self):
        user_identifier = self.user.username if self.user else self.session_id
        return f"{self.activity_type} by {user_identifier} at {self.timestamp}"
    