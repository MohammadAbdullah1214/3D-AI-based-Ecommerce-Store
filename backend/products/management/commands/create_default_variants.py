from django.core.management.base import BaseCommand
from products.models import ProductVariantType, ProductVariantOption

class Command(BaseCommand):
    help = 'Create default variant types and options for the system'

    def handle(self, *args, **options):
        self.stdout.write('Creating default variant types and options...')
        
        # Create default variant types
        variant_types_data = [
            {
                'name': 'Size',
                'options': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']
            },
            {
                'name': 'Color',
                'options': ['Red', 'Blue', 'Green', 'Yellow', 'Black', 'White', 'Gray', 'Brown', 'Pink', 'Purple', 'Orange']
            },
            {
                'name': 'Material',
                'options': ['Cotton', 'Polyester', 'Wool', 'Silk', 'Leather', 'Denim', 'Linen', 'Synthetic']
            },
            {
                'name': 'Style',
                'options': ['Casual', 'Formal', 'Sport', 'Vintage', 'Modern', 'Classic', 'Trendy']
            },
            {
                'name': 'Fit',
                'options': ['Slim', 'Regular', 'Loose', 'Oversized', 'Relaxed']
            }
        ]
        
        created_types = 0
        created_options = 0
        
        for type_data in variant_types_data:
            variant_type, created = ProductVariantType.objects.get_or_create(
                name=type_data['name']
            )
            
            if created:
                created_types += 1
                self.stdout.write(f'Created variant type: {variant_type.name}')
            
            # Create options for this type
            for option_value in type_data['options']:
                option, created = ProductVariantOption.objects.get_or_create(
                    variant_type=variant_type,
                    value=option_value
                )
                
                if created:
                    created_options += 1
                    self.stdout.write(f'  - Created option: {option.value}')
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully created {created_types} variant types and {created_options} options!'
            )
        ) 