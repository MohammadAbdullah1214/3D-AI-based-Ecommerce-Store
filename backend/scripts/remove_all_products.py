from products.models import Product

def remove_all_products():
    count = Product.objects.count()
    Product.objects.all().delete()
    print(f'Removed {count} products and all related images.')

if __name__ == '__main__':
    remove_all_products() 