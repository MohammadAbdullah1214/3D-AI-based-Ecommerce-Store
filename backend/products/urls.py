from django.urls import path
from .views import (
    ProductViewSet, CategoryViewSet, ProductVariantTypeViewSet, 
    ProductVariantOptionViewSet, ProductVariantViewSet
)
from rest_framework.decorators import api_view
from rest_framework.response import Response


# Define URL patterns explicitly
urlpatterns = [
    # Product routes
    path('', ProductViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='product-list'),
    
    path('<int:pk>/', ProductViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='product-detail'),
    
    # Seller-specific product routes
    path('my-products/', ProductViewSet.as_view({
        'get': 'my_products'
    }), name='my-products'),
    
    path('my-images/', ProductViewSet.as_view({
        'get': 'my_images'
    }), name='my-images'),
    
    path('all-images/', ProductViewSet.as_view({
        'get': 'all_images'
    }), name='all-images'),
    
    # Category routes
    path('categories/', CategoryViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='category-list'),
    
    path('categories/<int:pk>/', CategoryViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='category-detail'),
    
    # Seller-specific category routes
    path('categories/my-categories/', CategoryViewSet.as_view({
        'get': 'my_categories'
    }), name='my-categories'),
    
    # Category custom actions
    path('categories/<int:pk>/subcategories/', CategoryViewSet.as_view({
        'get': 'subcategories'
    }), name='category-subcategories'),
    
    path('categories/<int:pk>/products/', CategoryViewSet.as_view({
        'get': 'products'
    }), name='category-products'),
    
    # Product custom actions
    path('<int:pk>/add-review/', ProductViewSet.as_view({
        'post': 'add_review'
    }), name='product-add-review'),
    
    path('<int:pk>/upload-files/', ProductViewSet.as_view({
        'post': 'upload_files'
    }), name='product-upload-files'),
    
    path('<int:pk>/add-variant/', ProductViewSet.as_view({
        'post': 'add_variant'
    }), name='product-add-variant'),
    
    # 3D Generation routes
    path('<int:pk>/generation-status/', ProductViewSet.as_view({
        'get': 'generation_status'
    }), name='product-generation-status'),
    
    path('<int:pk>/generate-3d-model/', ProductViewSet.as_view({
        'post': 'generate_3d_model'
    }), name='product-generate-3d-model'),
    
    path('<int:pk>/cancel-3d-generation/', ProductViewSet.as_view({
        'post': 'cancel_3d_generation'
    }), name='product-cancel-3d-generation'),
    
    # Variant type routes
    path('variant-types/', ProductVariantTypeViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='variant-type-list'),
    
    path('variant-types/<int:pk>/', ProductVariantTypeViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='variant-type-detail'),
    
    # Variant option routes
    path('variant-options/', ProductVariantOptionViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='variant-option-list'),
    
    path('variant-options/<int:pk>/', ProductVariantOptionViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='variant-option-detail'),
    
    path('variant-options/by-variant-type/', ProductVariantOptionViewSet.as_view({
        'get': 'by_variant_type'
    }), name='variant-options-by-type'),
    
    # Product variant routes
    path('variants/', ProductVariantViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='variant-list'),
    
    path('variants/<int:pk>/', ProductVariantViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='variant-detail'),
    
    path('variants/by-product/', ProductVariantViewSet.as_view({
        'get': 'by_product'
    }), name='variants-by-product'),
]