from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['username', 'email', 'role', 'is_active', 'last_login', 'created_at', 'is_staff']
    list_filter = ['is_active', 'role', 'created_at', 'last_login']
    fieldsets = UserAdmin.fieldsets + (
        (None, {'fields': ('role', 'address')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        (None, {'fields': ('role', 'address')}),
    )

admin.site.register(CustomUser, CustomUserAdmin)
