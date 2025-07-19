import os
from django.core.files.base import ContentFile
from products.models import Product, ProductImage

MEDIA_ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'media', 'product_images')
DUMMY_CONTENT = b'glTF'  # Minimal valid header for .glb

os.makedirs(MEDIA_ROOT, exist_ok=True)

def add_dummy_3d_models():
    for product in Product.objects.all():
        if not product.images.filter(file_type='model').exists():
            file_name = f'dummy_{product.id}.glb'
            file_path = os.path.join(MEDIA_ROOT, file_name)
            with open(file_path, 'wb') as f:
                f.write(DUMMY_CONTENT)
            with open(file_path, 'rb') as f:
                django_file = ContentFile(f.read(), name=file_name)
                ProductImage.objects.create(product=product, file=django_file, file_type='model')
            print(f'Added dummy 3D model for product {product.id}')
        else:
            print(f'Product {product.id} already has a 3D model')

if __name__ == '__main__':
    add_dummy_3d_models()
    print('Done!') 