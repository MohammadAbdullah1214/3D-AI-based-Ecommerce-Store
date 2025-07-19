from django.db import models
from django.contrib.auth import get_user_model
from products.models import Product
import uuid

User = get_user_model()

class GenerationRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled'),
    ]
    
    DETAIL_CHOICES = [
        ('low', 'Low Detail'),
        ('medium', 'Medium Detail'),
        ('high', 'High Detail'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='generation_requests')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='generation_requests')
    
    # Request details
    detail_level = models.CharField(max_length=10, choices=DETAIL_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Progress tracking
    stage = models.CharField(max_length=50, blank=True)
    progress = models.FloatField(default=0.0)  # 0-100
    message = models.TextField(blank=True)
    estimated_time_remaining = models.CharField(max_length=50, blank=True)
    
    # Results
    generated_model_file = models.FileField(upload_to='generated_models/', null=True, blank=True)
    polygon_count = models.IntegerField(null=True, blank=True)
    file_size = models.IntegerField(null=True, blank=True)  # in bytes
    generation_time = models.FloatField(null=True, blank=True)  # in seconds
    
    # Error handling
    error_message = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"3D Generation Request {self.id} - {self.status}"

class GenerationImage(models.Model):
    ANGLE_CHOICES = [
        ('front', 'Front View'),
        ('back', 'Back View'),
        ('left', 'Left Side'),
        ('right', 'Right Side'),
        ('top', 'Top View'),
        ('bottom', 'Bottom View'),
        ('angle_1', 'Angle 1'),
        ('angle_2', 'Angle 2'),
    ]
    
    request = models.ForeignKey(GenerationRequest, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='generation_images/')
    angle = models.CharField(max_length=20, choices=ANGLE_CHOICES)
    detected_angle = models.CharField(max_length=20, choices=ANGLE_CHOICES, null=True, blank=True)
    order = models.IntegerField(default=0)
    
    # Image metadata
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)
    file_size = models.IntegerField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['order', 'created_at']
    
    def save(self, *args, **kwargs):
        if self.image and not self.width:
            from PIL import Image
            img = Image.open(self.image)
            self.width, self.height = img.size
            self.file_size = self.image.size
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Image {self.order} - {self.angle} for {self.request.id}"

class GenerationProgress(models.Model):
    request = models.ForeignKey(GenerationRequest, on_delete=models.CASCADE, related_name='progress_logs')
    stage = models.CharField(max_length=50)
    progress = models.FloatField()  # 0-100
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['timestamp']
    
    def __str__(self):
        return f"{self.request.id} - {self.stage} ({self.progress}%)"
