from django.contrib import admin
from .models import UserActivity

@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ['user', 'activity_type', 'product', 'timestamp']
    list_filter = ['activity_type', 'timestamp']
    search_fields = ['user__email', 'search_query']

