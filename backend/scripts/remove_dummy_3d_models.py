import os
from products.models import ProductImage
from django.conf import settings

def remove_dummy_3d_models():
    dummy_models = ProductImage.objects.filter(file_type='model', file__icontains='dummy_')
    for img in dummy_models:
        file_path = img.file.path
        print(f'Removing dummy 3D model: {file_path}')
        img.delete()
        if os.path.exists(file_path):
            os.remove(file_path)
            print(f'File deleted: {file_path}')
        else:
            print(f'File not found: {file_path}')
    print('Done!')

if __name__ == '__main__':
    remove_dummy_3d_models() 