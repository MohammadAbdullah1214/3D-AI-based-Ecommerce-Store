from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.text import slugify
import uuid
from decimal import Decimal

class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    image = models.ImageField(upload_to='categories/', null=True, blank=True)
    
    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def get_full_path(self):
        """Get the full category path (including parent categories)"""
        if self.parent:
            return f"{self.parent.get_full_path()} > {self.name}"
        return self.name


class Product(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    )
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0'))])
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(Decimal('0'))])
    stock = models.PositiveIntegerField(default=0)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='products')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    weight = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(Decimal('0'))])
    length = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(Decimal('0'))])
    width = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(Decimal('0'))])
    height = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(Decimal('0'))])
    is_active = models.BooleanField(default=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    @property
    def is_in_stock(self):
        return self.stock > 0
    
    @property
    def is_on_sale(self):
        return self.discount_price is not None and self.discount_price < self.price
    
    @property
    def sale_price(self):
        if self.is_on_sale:
            return self.discount_price
        return self.price
    
    @property
    def discount_percentage(self):
        if self.is_on_sale:
            return int(((self.price - self.discount_price) / self.price) * 100)
        return 0
    
    @property
    def primary_image(self):
        """Get the primary image for the product"""
        image = self.images.filter(file_type='image').first()
        if image:
            return image
        return None
    
    @property
    def has_variants(self):
        """Check if the product has variants"""
        return self.variants.exists()
    
    @property
    def average_rating(self):
        """Calculate the average rating for the product"""
        reviews = self.reviews.all()
        if not reviews:
            return 0
        return sum(review.rating for review in reviews) / reviews.count()
    
    @property
    def review_count(self):
        """Get the number of reviews for the product"""
        return self.reviews.count()


class ProductImage(models.Model):
    FILE_TYPE_CHOICES = (
        ('image', 'Image'),
        ('model', '3D Model'),
        ('video', 'Video'),
    )
    
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    variant = models.ForeignKey('ProductVariant', on_delete=models.SET_NULL, null=True, blank=True, related_name='images')
    file = models.FileField(upload_to='product_images/')
    file_type = models.CharField(max_length=10, choices=FILE_TYPE_CHOICES, default='image')
    angle_tag = models.CharField(max_length=50, null=True, blank=True, help_text="Tag for 3D generation, e.g., 'front', 'top'.")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.file_type.capitalize()} for {self.product.name}"


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ('product', 'user')
    
    def __str__(self):
        return f"Review by {self.user.username} for {self.product.name}"


class ProductView(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='views')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    session_id = models.CharField(max_length=100, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        if self.user:
            return f"View by {self.user.username} for {self.product.name}"
        return f"Anonymous view for {self.product.name}"


class ProductVariantType(models.Model):
    """
    Represents a type of variant (e.g., Size, Color)
    """
    name = models.CharField(max_length=50)
    
    def __str__(self):
        return self.name


class ProductVariantOption(models.Model):
    """
    Represents an option for a variant type (e.g., Small, Red)
    """
    variant_type = models.ForeignKey(ProductVariantType, on_delete=models.CASCADE, related_name='options')
    value = models.CharField(max_length=50)
    
    class Meta:
        unique_together = ('variant_type', 'value')
    
    def __str__(self):
        return f"{self.variant_type.name}: {self.value}"


class ProductVariant(models.Model):
    """
    Represents a specific variant of a product (e.g., Small Red T-shirt)
    """
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    options = models.ManyToManyField(ProductVariantOption, related_name='variants')
    sku = models.CharField(max_length=100, unique=True)
    price_adjustment = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock = models.PositiveIntegerField(default=0)
    weight = models.DecimalField(max_digits=8, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        options_str = ", ".join([str(option) for option in self.options.all()])
        return f"{self.product.name} - {options_str}"
    
    @property
    def price(self):
        """Calculate the final price for this variant"""
        base_price = self.product.price
        return base_price + self.price_adjustment
    
    @property
    def discount_price(self):
        """Calculate the discounted price for this variant"""
        if not self.product.discount_price:
            return None
        return self.product.discount_price + self.price_adjustment


class Wishlist(models.Model):
    """
    Represents a user's wishlist
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlists')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user',)
    
    def __str__(self):
        return f"Wishlist for {self.user.username}"


class WishlistItem(models.Model):
    """
    Represents an item in a user's wishlist
    """
    wishlist = models.ForeignKey(Wishlist, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variant = models.ForeignKey(ProductVariant, on_delete=models.SET_NULL, null=True, blank=True)
    added_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        unique_together = ('wishlist', 'product', 'variant')
    
    def __str__(self):
        if self.variant:
            return f"{self.product.name} ({self.variant}) in {self.wishlist}"
        return f"{self.product.name} in {self.wishlist}"