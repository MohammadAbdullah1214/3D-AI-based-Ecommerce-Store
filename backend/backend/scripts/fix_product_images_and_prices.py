import os
from decimal import Decimal
from django.core.files.base import ContentFile
from products.models import Product, ProductImage

MEDIA_ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'media', 'product_images')
DUMMY_IMAGE_CONTENT = b'\x89PNG\r\n\x1a\n'  # Minimal PNG header

os.makedirs(MEDIA_ROOT, exist_ok=True)

def fix_products():
    for product in Product.objects.all():
        # Ensure price is valid
        if not product.price or product.price <= 0:
            product.price = Decimal('1.00')
            product.save()
            print(f'Fixed price for product {product.id}')
        # Ensure at least one image
        if not product.images.filter(file_type='image').exists():
            file_name = f'dummy_{product.id}.png'
            file_path = os.path.join(MEDIA_ROOT, file_name)
            with open(file_path, 'wb') as f:
                f.write(DUMMY_IMAGE_CONTENT)
            with open(file_path, 'rb') as f:
                django_file = ContentFile(f.read(), name=file_name)
                ProductImage.objects.create(product=product, file=django_file, file_type='image')
            print(f'Added dummy image for product {product.id}')

if __name__ == '__main__':
    fix_products()
    print('Done!') 