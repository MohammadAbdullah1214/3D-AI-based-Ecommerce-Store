from django.contrib import admin
from .models import GenerationRequest, GenerationImage, GenerationProgress

@admin.register(GenerationRequest)
class GenerationRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'product', 'status', 'detail_level', 'progress', 'created_at']
    list_filter = ['status', 'detail_level', 'created_at']
    search_fields = ['user__username', 'product__name']
    readonly_fields = ['id', 'created_at', 'started_at', 'completed_at']

@admin.register(GenerationImage)
class GenerationImageAdmin(admin.ModelAdmin):
    list_display = ['request', 'angle', 'order', 'width', 'height', 'created_at']
    list_filter = ['angle', 'created_at']

@admin.register(GenerationProgress)
class GenerationProgressAdmin(admin.ModelAdmin):
    list_display = ['request', 'stage', 'progress', 'timestamp']
    list_filter = ['stage', 'timestamp']
    readonly_fields = ['timestamp']
