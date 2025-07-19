import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + '/../'))
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from products.models import Product, Category, Review, ProductVariant, ProductVariantType, ProductVariantOption
from django.contrib.auth import get_user_model

User = get_user_model()

# Test data
CATEGORIES = [
    'Shoes', 'Lipstick', 'Electronics', 'T-Shirts', 'Headphones', 'Dress', 'Makeup'
]
PRODUCTS = [
    {
        'name': 'Adidas Stan Smith',
        'category': 'Shoes',
        'price': 65.00,
        'description': 'Classic Adidas shoes.',
        'variants': [
            {'color': 'White', 'size': '8'},
            {'color': 'White', 'size': '9'},
            {'color': 'Green', 'size': '8'},
        ],
        'ratings': [5, 4, 5, 4, 5]
    },
    {
        'name': 'Matte Lipstick',
        'category': 'Lipstick',
        'price': 15.00,
        'description': 'Long-lasting matte lipstick.',
        'variants': [
            {'color': 'Red'},
            {'color': 'Pink'},
            {'color': 'Nude'},
        ],
        'ratings': [5, 5, 4, 3, 4]
    },
    {
        'name': 'Wireless Headphones',
        'category': 'Headphones',
        'price': 120.00,
        'description': 'Noise-cancelling wireless headphones.',
        'variants': [
            {'color': 'Black'},
            {'color': 'Blue'},
        ],
        'ratings': [4, 4, 5, 3, 4]
    },
    {
        'name': 'Summer Dress',
        'category': 'Dress',
        'price': 45.00,
        'description': 'Light and breezy summer dress.',
        'variants': [
            {'color': 'Yellow', 'size': 'S'},
            {'color': 'Yellow', 'size': 'M'},
            {'color': 'Blue', 'size': 'M'},
        ],
        'ratings': [5, 4, 4, 5, 5]
    },
    {
        'name': 'Basic T-Shirt',
        'category': 'T-Shirts',
        'price': 10.00,
        'description': 'Comfortable cotton t-shirt.',
        'variants': [
            {'color': 'White', 'size': 'M'},
            {'color': 'Black', 'size': 'L'},
        ],
        'ratings': [4, 4, 3, 5, 4]
    },
]

def get_or_create_category(name):
    cat, _ = Category.objects.get_or_create(name=name)
    return cat

def get_or_create_user():
    user, _ = User.objects.get_or_create(username='testuser', defaults={'email': 'testuser@example.com'})
    return user

def get_or_create_variant_type(name):
    vt, _ = ProductVariantType.objects.get_or_create(name=name)
    return vt

def get_or_create_variant_option(variant_type, value):
    vo, _ = ProductVariantOption.objects.get_or_create(variant_type=variant_type, value=value)
    return vo

def main():
    user = get_or_create_user()
    for pdata in PRODUCTS:
        cat = get_or_create_category(pdata['category'])
        product, created = Product.objects.get_or_create(
            name=pdata['name'],
            defaults={
                'category': cat,
                'price': pdata['price'],
                'description': pdata['description'],
                'is_active': True,
                'seller': user  # Assign test user as seller
            }
        )
        if created:
            print(f"Created product: {product.name}")
        else:
            print(f"Product already exists: {product.name}")
        # Add variants using ProductVariant, ProductVariantType, ProductVariantOption
        for v in pdata['variants']:
            option_objs = []
            for key, value in v.items():
                vt = get_or_create_variant_type(key.capitalize())
                vo = get_or_create_variant_option(vt, value)
                option_objs.append(vo)
            # Generate a unique SKU
            sku = f"{product.id}-{''.join([str(o.id) for o in option_objs])}"
            variant, v_created = ProductVariant.objects.get_or_create(
                product=product,
                sku=sku
            )
            if v_created:
                print(f"  Added variant: {variant}")
            variant.options.set(option_objs)
        # Add ratings/reviews
        for score in pdata['ratings']:
            Review.objects.get_or_create(
                product=product,
                user=user,
                defaults={'rating': score, 'comment': f"Auto-generated review: {score} stars"}
            )
    print("Test products with ratings and variants added.")

if __name__ == "__main__":
    main() 