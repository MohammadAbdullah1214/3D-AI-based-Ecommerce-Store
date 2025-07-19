from django.contrib import admin
from .models import (
    Category, Product, ProductImage, Review, ProductView, 
    ProductVariantType, ProductVariantOption, ProductVariant,
    Wishlist, WishlistItem
)

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ['file', 'file_type', 'variant']

class ReviewInline(admin.TabularInline):
    model = Review
    extra = 0
    readonly_fields = ['user', 'rating', 'comment', 'created_at']

class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1
    fields = ['sku', 'price_adjustment', 'stock', 'weight', 'is_active']

class ProductVariantOptionInline(admin.TabularInline):
    model = ProductVariantOption
    extra = 1

class WishlistItemInline(admin.TabularInline):
    model = WishlistItem
    extra = 1
    fields = ['product', 'variant', 'added_at', 'notes']
    readonly_fields = ['added_at']

class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'discount_price', 'stock', 'category', 'seller', 'weight', 'is_active', 'status', 'created_at']
    list_filter = ['category', 'seller', 'is_active', 'status', 'created_at']
    search_fields = ['name', 'description']
    inlines = [ProductImageInline, ProductVariantInline, ReviewInline]
    fieldsets = (
        (None, {
            'fields': ('name', 'description', 'category', 'seller', 'price', 'discount_price', 'stock')
        }),
        ('Status', {
            'fields': ('is_active', 'status')
        }),
        ('Dimensions & Weight', {
            'fields': ('weight', 'length', 'width', 'height')
        }),
    )

    def get_queryset(self, request):
        # Optimize queries with select_related
        return super().get_queryset(request).select_related('category', 'seller')

class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'creator', 'created_at']
    list_filter = ['parent', 'creator', 'created_at']
    search_fields = ['name', 'description']

    def get_queryset(self, request):
        # Optimize queries with select_related
        return super().get_queryset(request).select_related('parent', 'creator')

class ProductViewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'session_id', 'timestamp']
    list_filter = ['product', 'timestamp']
    readonly_fields = ['product', 'user', 'session_id', 'timestamp']

    def get_queryset(self, request):
        # Optimize queries with select_related
        return super().get_queryset(request).select_related('product', 'user')

class ReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'rating', 'created_at']
    list_filter = ['product', 'rating', 'created_at']
    readonly_fields = ['created_at']

    def get_queryset(self, request):
        # Optimize queries with select_related
        return super().get_queryset(request).select_related('product', 'user')

class ProductVariantTypeAdmin(admin.ModelAdmin):
    list_display = ['name']
    inlines = [ProductVariantOptionInline]

class ProductVariantOptionAdmin(admin.ModelAdmin):
    list_display = ['variant_type', 'value']
    list_filter = ['variant_type']

class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ['product', 'sku', 'price_adjustment', 'stock', 'weight', 'is_active']
    list_filter = ['product', 'is_active']
    search_fields = ['sku', 'product__name']
    filter_horizontal = ('options',)

class WishlistAdmin(admin.ModelAdmin):
    list_display = ['user', 'created_at', 'updated_at', 'item_count']
    search_fields = ['user__username']
    inlines = [WishlistItemInline]

    def item_count(self, obj):
        return obj.items.count()
    item_count.short_description = 'Number of Items'

class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ['wishlist', 'product', 'variant', 'added_at']
    list_filter = ['added_at']
    search_fields = ['wishlist__user__username', 'product__name']
    readonly_fields = ['added_at']

admin.site.register(Category, CategoryAdmin)
admin.site.register(Product, ProductAdmin)
admin.site.register(ProductImage)
admin.site.register(Review, ReviewAdmin)
admin.site.register(ProductView, ProductViewAdmin)
admin.site.register(ProductVariantType, ProductVariantTypeAdmin)
admin.site.register(ProductVariantOption, ProductVariantOptionAdmin)
admin.site.register(ProductVariant, ProductVariantAdmin)
admin.site.register(Wishlist, WishlistAdmin)
admin.site.register(WishlistItem, WishlistItemAdmin)