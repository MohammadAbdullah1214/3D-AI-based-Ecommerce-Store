from django.db import models
from django.conf import settings
from django.utils import timezone
from products.models import Product

class Question(models.Model):
    """
    Model for customer questions about products
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='questions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='product_questions')
    content = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_approved = models.BooleanField(default=False)  # For moderation if needed
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Question about {self.product.name} by {self.user.username}"


class Answer(models.Model):
    """
    Model for seller answers to customer questions
    """
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='product_answers')
    content = models.TextField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    is_approved = models.BooleanField(default=False)  # For moderation if needed
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Answer to question {self.question.id} by {self.user.username}"