# cart/admin.py
from django.contrib import admin
from .models import Cart, CartItem

class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'get_customer', 'get_item_count', 'get_total_amount', 'created_at')
    inlines = [CartItemInline]
    
    def get_customer(self, obj):
        return obj.customer.username
    get_customer.short_description = 'Customer'
    
    def get_item_count(self, obj):
        return obj.item_count
    get_item_count.short_description = 'Item Count'
    
    def get_total_amount(self, obj):
        return obj.total_amount
    get_total_amount.short_description = 'Total Amount'

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'cart', 'product', 'quantity', 'get_subtotal', 'added_at')
    list_filter = ('cart__customer',)
    
    def get_subtotal(self, obj):
        return obj.subtotal
    get_subtotal.short_description = 'Subtotal'