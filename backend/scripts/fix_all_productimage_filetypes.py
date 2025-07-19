from products.models import ProductImage

def fix_filetypes():
    fixed = 0
    for img in ProductImage.objects.all():
        name = img.file.name.lower()
        if (name.endswith('.glb') or name.endswith('.gltf')) and img.file_type != 'model':
            img.file_type = 'model'
            img.save()
            fixed += 1
        elif name.endswith(('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp')) and img.file_type != 'image':
            img.file_type = 'image'
            img.save()
            fixed += 1
        elif name.endswith(('.mp4', '.mov', '.avi', '.webm', '.mkv')) and img.file_type != 'video':
            img.file_type = 'video'
            img.save()
            fixed += 1
    print(f'Fixed {fixed} ProductImage file_type mismatches.')

if __name__ == '__main__':
    fix_filetypes() 