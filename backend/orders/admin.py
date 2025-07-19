from django.contrib import admin
from .models import Order, OrderItem, OrderStatusHistory

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product', 'variant', 'quantity', 'price']

class OrderStatusHistoryInline(admin.TabularInline):
    model = OrderStatusHistory
    extra = 0
    readonly_fields = ['status', 'timestamp', 'updated_by', 'notes']

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'status', 'total_price', 'created_at', 'cancelled_by_role', 'payment_status']
    list_filter = ['status', 'payment_status', 'cancelled_by_role']
    search_fields = ['id', 'user__username', 'tracking_number']
    readonly_fields = ['cancelled_at', 'cancelled_by', 'cancelled_by_role']
    inlines = [OrderItemInline, OrderStatusHistoryInline]
    fieldsets = (
        ('Order Information', {
            'fields': ('user', 'status', 'total_price', 'created_at', 'updated_at')
        }),
        ('Payment Information', {
            'fields': ('payment_method', 'payment_status')
        }),
        ('Shipping Information', {
            'fields': ('shipping_address', 'tracking_number')
        }),
        ('Additional Information', {
            'fields': ('billing_address', 'notes')
        }),
        ('Cancellation Information', {
            'fields': ('cancelled_at', 'cancelled_by', 'cancelled_by_role', 'cancellation_reason')
        }),
    )

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'product', 'variant', 'quantity', 'price']
    list_filter = ['order__status']
    search_fields = ['order__id', 'product__name']

@admin.register(OrderStatusHistory)
class OrderStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'order', 'status', 'timestamp', 'updated_by']
    list_filter = ['status']
    search_fields = ['order__id']
    readonly_fields = ['order', 'status', 'timestamp', 'updated_by']