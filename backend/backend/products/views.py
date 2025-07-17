# pyright: reportAttributeAccessIssue=false, reportArgumentType=false
import uuid
import logging

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, parser_classes
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample, OpenApiResponse
from drf_spectacular.types import OpenApiTypes
from django.db import transaction, connection
from django.db.models import Avg, Count, Q

from .models import (
    Product, ProductView, Review, ProductImage, Category, 
    ProductVariantType, ProductVariantOption, ProductVariant,
    Wishlist, WishlistItem
)
from .serializers import (
    ProductSerializer, ProductCreateUpdateSerializer, ProductListSerializer, ProductDetailSerializer, ReviewSerializer, 
    ProductImageSerializer, CategorySerializer, ProductVariantTypeSerializer, 
    ProductVariantOptionSerializer, ProductVariantSerializer,
    WishlistSerializer, WishlistItemSerializer
)
from permissions import IsSellerOrAdmin, IsProductSeller
from .utils.general import get_generation_status, create_generation_request_from_files
from ai_3d_generation.models import GenerationRequest


class WishlistViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing user wishlists
    """
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Return the wishlist for the current user
        """
        user = self.request.user
        return Wishlist.objects.filter(user=user)
    
    def perform_create(self, serializer):
        """
        Create a new wishlist for the current user
        """
        serializer.save(user=self.request.user)
    
    @extend_schema(
        description="Get or create the current user's wishlist",
        responses={200: WishlistSerializer}
    )
    @action(detail=False, methods=['get'])
    def my_wishlist(self, request):
        """
        Get or create the current user's wishlist
        """
        wishlist, created = Wishlist.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(wishlist)
        return Response(serializer.data)
    
    @extend_schema(
        description="Add a product to the wishlist",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'product_id': {'type': 'integer'},
                    'variant_id': {'type': 'integer', 'nullable': True},
                    'notes': {'type': 'string', 'nullable': True}
                },
                'required': ['product_id']
            }
        }
    )
    @action(detail=False, methods=['post'])
    def add_item(self, request):
        """
        Add a product to the wishlist
        """
        # Prevent all sellers from adding any products to the wishlist
        if hasattr(request.user, 'role') and request.user.role == 'seller':
            return Response({'error': 'Sellers cannot add products to the wishlist.'}, status=status.HTTP_403_FORBIDDEN)
        
        wishlist, created = Wishlist.objects.get_or_create(user=request.user)
        
        product_id = request.data.get('product_id')
        variant_id = request.data.get('variant_id', None)
        notes = request.data.get('notes', None)
        
        try:
            product = Product.objects.get(id=product_id)
            # Prevent sellers from adding their own products to wishlist
            if product.seller == request.user:
                return Response({'error': 'You cannot add your own product to your wishlist.'}, status=status.HTTP_403_FORBIDDEN)
            
            # Create or update the wishlist item
            wishlist_item, created = WishlistItem.objects.get_or_create(
                wishlist=wishlist,
                product=product,
                variant_id=variant_id,
                defaults={'notes': notes}
            )
            
            if not created and notes is not None:
                wishlist_item.notes = notes
                wishlist_item.save()
            
            return Response({'status': 'Product added to wishlist'}, status=status.HTTP_200_OK)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @extend_schema(
        description="Remove a product from the wishlist",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'product_id': {'type': 'integer'},
                    'variant_id': {'type': 'integer', 'nullable': True}
                },
                'required': ['product_id']
            }
        }
    )
    @action(detail=False, methods=['post'])
    def remove_item(self, request):
        """
        Remove a product from the wishlist
        """
        wishlist, created = Wishlist.objects.get_or_create(user=request.user)
        
        product_id = request.data.get('product_id')
        variant_id = request.data.get('variant_id', None)
        
        try:
            product = Product.objects.get(id=product_id)
            
            # Delete the wishlist item
            if variant_id:
                WishlistItem.objects.filter(
                    wishlist=wishlist, 
                    product=product,
                    variant_id=variant_id
                ).delete()
            else:
                WishlistItem.objects.filter(
                    wishlist=wishlist, 
                    product=product
                ).delete()
            
            return Response({'status': 'Product removed from wishlist'}, status=status.HTTP_200_OK)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @extend_schema(
        description="Check if a product is in the wishlist",
        parameters=[
            OpenApiParameter(
                name='product_id',
                description='Product ID',
                required=True,
                type=int,
                location=OpenApiParameter.QUERY
            ),
        ],
    )
    @action(detail=False, methods=['get'])
    def check_product(self, request):
        """
        Check if a product is in the wishlist
        """
        wishlist, created = Wishlist.objects.get_or_create(user=request.user)
        
        product_id = request.query_params.get('product_id')
        
        try:
            product = Product.objects.get(id=product_id)
            is_in_wishlist = WishlistItem.objects.filter(
                wishlist=wishlist, 
                product=product
            ).exists()
            
            return Response({'in_wishlist': is_in_wishlist}, status=status.HTTP_200_OK)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    @extend_schema(
        description="Clear all items from the current user's wishlist",
        responses={200: dict}
    )
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def clear(self, request):
        """
        Remove all items from the current user's wishlist
        """
        wishlist, created = Wishlist.objects.get_or_create(user=request.user)
        wishlist.items.all().delete()
        return Response({'status': 'Wishlist cleared'}, status=status.HTTP_200_OK)


class CategoryViewSet(viewsets.ModelViewSet):
    """
    A viewset for viewing and editing category instances.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [JSONParser, MultiPartParser, FormParser]  # Add parsers to handle file uploads
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSellerOrAdmin()]
        elif self.action in ['my_categories']:
            return [IsAuthenticated()]
        return super().get_permissions()
    
    def get_queryset(self):
        # Optimize queries with select_related
        return Category.objects.select_related('parent', 'creator')
    
    @extend_schema(
        description="List all categories",
        responses={200: CategorySerializer(many=True)}
    )
    def list(self, request, *args, **kwargs):
        """
        Get all categories in the store
        """
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            # Simplified error handling
            categories = self.get_queryset()
            simplified_categories = []
            
            for category in categories:
                try:
                    simplified_categories.append({
                        'id': category.id,
                        'name': category.name,
                        'description': category.description,
                        'parent': category.parent.id if category.parent else None,
                        'creator': category.creator.id if category.creator else None,
                        'creator_username': category.creator.username if category.creator else None,
                        'created_at': getattr(category, 'created_at', None),
                        'updated_at': getattr(category, 'updated_at', None),
                        'image': None
                    })
                except Exception:
                    continue
            
            return Response(simplified_categories)
    
    @extend_schema(
        description="Create a new category",
        request=CategorySerializer,
        responses={201: CategorySerializer}
    )
    def create(self, request, *args, **kwargs):
        """
        Creates a new category. Handles multipart/form-data for the category image.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # The serializer will handle saving the instance and the creator
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        # Set the creator to the current user
        serializer.save(creator=self.request.user)
    
    @extend_schema(
        description="Retrieve a specific category by ID",
        responses={200: CategorySerializer}
    )
    def retrieve(self, request, *args, **kwargs):
        try:
            return super().retrieve(request, *args, **kwargs)
        except Exception as e:
            # Simplified error handling
            category = self.get_object()
            simplified_category = {
                'id': category.id,
                'name': category.name,
                'description': category.description,
                'parent': category.parent.id if category.parent else None,
                'creator': category.creator.id if category.creator else None,
                'creator_username': category.creator.username if category.creator else None,
                'created_at': getattr(category, 'created_at', None),
                'updated_at': getattr(category, 'updated_at', None),
                'image': None
            }
            return Response(simplified_category)
    
    @extend_schema(
        description="Update a category (full update)",
        request=CategorySerializer,
        responses={200: CategorySerializer}
    )
    def update(self, request, *args, **kwargs):
        """
        Updates a category. Handles multipart/form-data for the category image.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)
    
    @extend_schema(
        description="Update a category (partial update)",
        request=CategorySerializer,
        responses={200: CategorySerializer}
    )
    def partial_update(self, request, *args, **kwargs):
        """
        Partially updates a category. Handles multipart/form-data for the category image.
        """
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check if user is the creator or admin
        if instance.creator and instance.creator != request.user and not request.user.is_staff and request.user.role != 'admin':
            return Response(
                {'error': 'Only the creator or admin can delete this category'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if category has products
        if instance.products.exists():
            return Response(
                {'error': 'Cannot delete category that has products. Reassign products to another category first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Use Django ORM to delete the category
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(
                {'error': f'Failed to delete category: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @extend_schema(
        description="Get categories created by the authenticated seller",
        responses={200: CategorySerializer(many=True)}
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_categories(self, request):
        """
        Get categories created by the authenticated seller
        """
        user = request.user
        # Check if user is a seller or admin
        if not (user.role == 'seller' or user.role == 'admin' or user.is_staff):
            return Response(
                {'error': 'Only sellers and admins can access this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get categories created by the current user
        categories = Category.objects.filter(creator=user)
        
        try:
            # Paginate results
            page = self.paginate_queryset(categories)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(categories, many=True)
            return Response(serializer.data)
        except Exception as e:
            # Simplified error handling
            simplified_categories = []
            
            for category in categories:
                try:
                    simplified_categories.append({
                        'id': category.id,
                        'name': category.name,
                        'description': category.description,
                        'parent': category.parent.id if category.parent else None,
                        'creator': category.creator.id if category.creator else None,
                        'creator_username': category.creator.username if category.creator else None,
                        'created_at': getattr(category, 'created_at', None),
                        'updated_at': getattr(category, 'updated_at', None),
                        'image': None
                    })
                except Exception:
                    continue
            
            return Response(simplified_categories)
    
    @extend_schema(
        description="Get all subcategories for a specific category",
        responses={200: CategorySerializer(many=True)}
    )
    @action(detail=True, methods=['get'])
    def subcategories(self, request, pk=None):
        """
        Get all subcategories for a specific category
        """
        category = self.get_object()
        subcategories = Category.objects.filter(parent=category)
        
        try:
            serializer = self.get_serializer(subcategories, many=True)
            return Response(serializer.data)
        except Exception as e:
            # Simplified error handling
            simplified_subcategories = []
            
            for subcategory in subcategories:
                try:
                    simplified_subcategories.append({
                        'id': subcategory.id,
                        'name': subcategory.name,
                        'description': subcategory.description,
                        'parent': subcategory.parent.id if subcategory.parent else None,
                        'creator': subcategory.creator.id if subcategory.creator else None,
                        'creator_username': subcategory.creator.username if subcategory.creator else None,
                        'created_at': getattr(subcategory, 'created_at', None),
                        'updated_at': getattr(subcategory, 'updated_at', None),
                        'image': None
                    })
                except Exception:
                    continue
            
            return Response(simplified_subcategories)
    
    @extend_schema(
        description="Get all products in a specific category",
        responses={200: ProductSerializer(many=True)}
    )
    @action(detail=True, methods=['get'])
    def products(self, request, pk=None):
        """
        Get all products in a specific category
        """
        category = self.get_object()
        products = category.products.all().select_related('category', 'seller')
        
        try:
            serializer = ProductSerializer(products, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            # Simplified error handling
            simplified_products = []
            
            for product in products:
                try:
                    simplified_products.append({
                        'id': product.id,
                        'name': product.name,
                        'description': product.description,
                        'price': str(product.price),
                        'discount_price': str(product.discount_price) if product.discount_price else None,
                        'stock': product.stock,
                        'category': product.category.id if product.category else None,
                        'category_name': product.category.name if product.category else None,
                        'seller': product.seller.id if product.seller else None,
                        'seller_username': product.seller.username if product.seller else None,
                        'created_at': product.created_at,
                        'updated_at': product.updated_at,
                        'weight': product.weight,
                        'length': product.length,
                        'width': product.width,
                        'height': product.height,
                        'is_active': product.is_active,
                        'status': product.status
                    })
                except Exception:
                    continue
            
            return Response(simplified_products)


class ProductVariantTypeViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing product variant types (e.g., Size, Color)
    """
    queryset = ProductVariantType.objects.all()
    serializer_class = ProductVariantTypeSerializer
    permission_classes = [IsAuthenticated, IsSellerOrAdmin]
    
    def get_queryset(self):
        return ProductVariantType.objects.all()


class ProductVariantOptionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing product variant options (e.g., Small, Red)
    """
    queryset = ProductVariantOption.objects.all()
    serializer_class = ProductVariantOptionSerializer
    permission_classes = [IsAuthenticated, IsSellerOrAdmin]
    
    def get_queryset(self):
        return ProductVariantOption.objects.all()
    
    @extend_schema(
        description="Get options for a specific variant type",
        parameters=[
            OpenApiParameter(
                name='variant_type_id',
                description='Variant Type ID',
                required=True,
                type=int,
                location=OpenApiParameter.QUERY
            ),
        ],
    )
    @action(detail=False, methods=['get'])
    def by_variant_type(self, request):
        """Get options for a specific variant type"""
        variant_type_id = request.query_params.get('variant_type_id')
        if not variant_type_id:
            return Response(
                {"error": "variant_type_id parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        options = ProductVariantOption.objects.filter(variant_type_id=variant_type_id)
        serializer = self.get_serializer(options, many=True)
        return Response(serializer.data)


class ProductVariantViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing product variants
    """
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantSerializer
    permission_classes = [IsAuthenticated, IsSellerOrAdmin]
    
    def get_queryset(self):
        if self.request.user.is_staff or self.request.user.role == 'admin':
            return ProductVariant.objects.all()
        return ProductVariant.objects.filter(product__seller=self.request.user)
    
    @extend_schema(
        description="Get variants for a specific product",
        parameters=[
            OpenApiParameter(
                name='product_id',
                description='Product ID',
                required=True,
                type=int,
                location=OpenApiParameter.QUERY
            ),
        ],
    )
    @action(detail=False, methods=['get'])
    def by_product(self, request):
        """Get variants for a specific product"""
        product_id = request.query_params.get('product_id')
        if not product_id:
            return Response(
                {"error": "product_id parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        variants = ProductVariant.objects.filter(product_id=product_id)
        serializer = self.get_serializer(variants, many=True)
        return Response(serializer.data)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    # parser_classes = [JSONParser, MultiPartParser, FormParser] # REMOVED: To be set per-action
      
    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        elif self.action == 'retrieve':
            return ProductDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ProductCreateUpdateSerializer
        return ProductSerializer
    
    def get_queryset(self):
        # Optimize queries with select_related
        queryset = Product.objects.select_related('category', 'seller')
        
        # Filter by status if provided
        status_param = self.request.query_params.get('status', None)
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by is_active if provided
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            is_active_bool = is_active.lower() == 'true'
            queryset = queryset.filter(is_active=is_active_bool)
            
        return queryset
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            # Allow anyone to view products
            return []
        elif self.action == 'create':
            return [IsAuthenticated(), IsSellerOrAdmin()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsProductSeller()]
        elif self.action in ['my_products', 'my_images']:
            return [IsAuthenticated()]
        return [IsAuthenticatedOrReadOnly()]
    
    @parser_classes([MultiPartParser, FormParser])
    def create(self, request, *args, **kwargs):
        """
        Handles product creation from a multipart/form-data request.
        This includes product details, angled images for 3D generation,
        additional gallery images, and 3D models.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()

        # --- 3D Generation & Image Handling ---
        angle_keys = ['front', 'back', 'left', 'right', 'top', 'bottom']
        generation_images_map = {}
        
        for key in angle_keys:
            form_key = f"{key}_view_image"
            if form_key in request.FILES:
                file = request.FILES[form_key]
                generation_images_map[key] = file
                ProductImage.objects.create(product=product, file=file, file_type='image', angle_tag=key)

        # Process any other generic 'images' for the main gallery
        other_files = request.FILES.getlist('images')
        for file in other_files:
            if product.images.count() >= 10: # Limit total images
                break
            ProductImage.objects.create(product=product, file=file, file_type='image')

        # --- NEW: Process 3D models ---
        model_files = request.FILES.getlist('models')
        for file in model_files:
            ProductImage.objects.create(product=product, file=file, file_type='model')

        # Trigger 3D generation if angled images were provided
        generation_request = None
        if len(generation_images_map) >= 2:
            generation_request = create_generation_request_from_files(
                product=product,
                image_angle_map=generation_images_map,
                detail_level=request.data.get('detail_level', 'medium')
            )
        
        # --- Response ---
        response_data = ProductSerializer(product, context={'request': request}).data
        if generation_request:
            response_data['3d_generation_status'] = {
                'request_id': str(generation_request.id),
                'status': generation_request.status,
                'message': '3D model generation process has been started.'
            }
        else:
            response_data['3d_generation_status'] = get_generation_status(product)

        return Response(response_data, status=status.HTTP_201_CREATED)

    @parser_classes([MultiPartParser, FormParser])
    def update(self, request, *args, **kwargs):
        """
        Handles product updates, including file uploads via multipart/form-data.
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Handle new image uploads during update
        if 'images' in request.FILES:
            images = request.FILES.getlist('images')
            for image_file in images:
                ProductImage.objects.create(product=instance, file=image_file, file_type='image')

        return Response(serializer.data)

    @parser_classes([MultiPartParser, FormParser])
    def partial_update(self, request, *args, **kwargs):
        """
        Handles partial product updates, including file uploads via multipart/form-data.
        """
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    @extend_schema(
        description="List all products in the store - accessible to anyone",
        responses={200: ProductSerializer(many=True)}
    )
    def list(self, request, *args, **kwargs):
        """
        Get all products in the store. This endpoint is accessible to anyone.
        """
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            # Simplified error handling
            products = self.get_queryset()
            simplified_products = []
            
            for product in products:
                try:
                    simplified_products.append({
                        'id': product.id,
                        'name': product.name,
                        'description': product.description,
                        'price': str(product.price),
                        'discount_price': str(product.discount_price) if product.discount_price else None,
                        'stock': product.stock,
                        'category': product.category.id if product.category else None,
                        'category_name': product.category.name if product.category else None,
                        'seller': product.seller.id if product.seller else None,
                        'seller_username': product.seller.username if product.seller else None,
                        'created_at': product.created_at,
                        'updated_at': product.updated_at,
                        'weight': product.weight,
                        'length': product.length,
                        'width': product.width,
                        'height': product.height,
                        'is_active': product.is_active,
                        'status': product.status
                    })
                except Exception:
                    continue
            
            return Response(simplified_products)
    
    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            # Track view - simplified
            try:
                # Check if ProductView model exists in the database
                with connection.cursor() as cursor:
                    cursor.execute("""
                        SELECT EXISTS (
                            SELECT FROM information_schema.tables 
                            WHERE table_name = 'products_productview'
                        );
                    """)
                    table_exists = cursor.fetchone()[0]
                
                if table_exists:
                    if request.user.is_authenticated:
                        ProductView.objects.create(product=instance, user=request.user)
                    else:
                        session_id = request.session.get('session_id')
                        if not session_id:
                            session_id = str(uuid.uuid4())
                            request.session['session_id'] = session_id
                        ProductView.objects.create(product=instance, session_id=session_id)
            except Exception:
                # Don't let view tracking failure affect the API response
                pass
            
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception as e:
            # Simplified error handling
            instance = self.get_object()
            simplified_product = {
                'id': instance.id,
                'name': instance.name,
                'description': instance.description,
                'price': str(instance.price),
                'discount_price': str(instance.discount_price) if instance.discount_price else None,
                'stock': instance.stock,
                'category': instance.category.id if instance.category else None,
                'category_name': instance.category.name if instance.category else None,
                'seller': instance.seller.id if instance.seller else None,
                'seller_username': instance.seller.username if instance.seller else None,
                'created_at': instance.created_at,
                'updated_at': instance.updated_at,
                'weight': instance.weight,
                'length': instance.length,
                'width': instance.width,
                'height': instance.height,
                'is_active': instance.is_active,
                'status': instance.status
            }
            return Response(simplified_product)
    
    @extend_schema(
        description="Get products for the authenticated seller",
        responses={200: ProductSerializer(many=True)}
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_products(self, request):
        """
        Get products for the authenticated seller
        """
        user = request.user
        
        # Check if user is a seller or admin
        if not (user.role == 'seller' or user.role == 'admin' or user.is_staff):
            return Response(
                {'error': 'Only sellers and admins can access this endpoint'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get products for the current user
        products = Product.objects.filter(seller=user).select_related('category')
        
        try:
            # Paginate results
            page = self.paginate_queryset(products)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(products, many=True)
            return Response(serializer.data)
        except Exception as e:
            # Simplified error handling
            simplified_products = []
            
            for product in products:
                try:
                    simplified_products.append({
                        'id': product.id,
                        'name': product.name,
                        'description': product.description,
                        'price': str(product.price),
                        'discount_price': str(product.discount_price) if product.discount_price else None,
                        'stock': product.stock,
                        'category': product.category.id if product.category else None,
                        'category_name': product.category.name if product.category else None,
                        'seller': product.seller.id if product.seller else None,
                        'seller_username': product.seller.username if product.seller else None,
                        'created_at': product.created_at,
                        'updated_at': product.updated_at,
                        'weight': product.weight,
                        'length': product.length,
                        'width': product.width,
                        'height': product.height,
                        'is_active': product.is_active,
                        'status': product.status
                    })
                except Exception:
                    continue
            
            return Response(simplified_products)
    
    @extend_schema(
        description="Get all images uploaded by the authenticated user (seller, admin, or customer)",
        responses={200: ProductImageSerializer(many=True)}
    )
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_images(self, request):
        """
        Get all images uploaded by the authenticated user (seller, admin, or customer)
        """
        user = request.user
        
        # Get products for the current user
        products = Product.objects.filter(seller=user)
        
        # Get all images for these products
        images = ProductImage.objects.filter(product__in=products)
         
        try:
            # Paginate results
            page = self.paginate_queryset(images)
            if page is not None:
                serializer = ProductImageSerializer(page, many=True, context={'request': request})
                return self.get_paginated_response(serializer.data)
            
            serializer = ProductImageSerializer(images, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            # Simplified error handling
            simplified_images = []
            
            for image in images:
                try:
                    simplified_images.append({
                        'id': image.id,
                        'product': image.product.id,
                        'variant': image.variant.id if image.variant else None,
                        'file': request.build_absolute_uri(image.file.url) if image.file else None,
                        'file_type': image.file_type,
                        'created_at': image.created_at,
                    })
                except Exception:
                    continue
            
            return Response(simplified_images)
    
    @extend_schema(
        description="Get all images in the store",
        responses={200: ProductImageSerializer(many=True)}
    )
    @action(detail=False, methods=['get'])
    def all_images(self, request):
        """
        Get all images in the store
        """
        # Get all images
        images = ProductImage.objects.all().select_related('product')
        
        try:
            # Paginate results
            page = self.paginate_queryset(images)
            if page is not None:
                serializer = ProductImageSerializer(page, many=True, context={'request': request})
                return self.get_paginated_response(serializer.data)
            
            serializer = ProductImageSerializer(images, many=True, context={'request': request})
            return Response(serializer.data)
        except Exception as e:
            # Simplified error handling
            simplified_images = []
            
            for image in images:
                try:
                    simplified_images.append({
                        'id': image.id,
                        'product': image.product.id,
                        'variant': image.variant.id if image.variant else None,
                        'file': request.build_absolute_uri(image.file.url) if image.file else None,
                        'file_type': image.file_type,
                        'created_at': image.created_at,
                    })
                except Exception:
                    continue
            
            return Response(simplified_images)
    
    @extend_schema(
        description="Get 3D generation status for a product.",
        responses={200: OpenApiTypes.OBJECT}
    )
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def generation_status(self, request, pk=None):
        """
        Get the current 3D generation status for a product.
        """
        product = self.get_object()
        status_info = get_generation_status(product)
        return Response(status_info)

    @extend_schema(
        description="Manually trigger 3D model generation for a product from existing images.",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'detail_level': {
                        'type': 'string',
                        'enum': ['low', 'medium', 'high'],
                        'default': 'medium'
                    },
                    'clothing_type': {
                        'type': 'string',
                        'enum': ['tshirt', 'pants', 'shirts', 'shoes'],
                        'default': 'tshirt',
                        'description': 'Type of clothing to generate'
                    },
                    'angle_mapping': {
                        'type': 'object',
                        'description': 'Mapping of angle names to ProductImage IDs.',
                        'example': { 'front_view': 1, 'back_view': 2 }
                    }
                },
                'required': ['angle_mapping']
            }
        },
        responses={
            202: OpenApiResponse(description="Generation process started successfully."),
            400: OpenApiResponse(description="Bad Request - Invalid input or conditions not met."),
        }
    )
    @action(
        detail=True,
        methods=['post'],
        permission_classes=[IsAuthenticated],
    )
    def generate_3d_model(self, request, pk=None):
        """
        Manually trigger 3D model generation for a product from existing images.
        """
        product = self.get_object()
        
        # Check if user is the seller or admin
        if not (request.user == product.seller or request.user.role == 'admin' or request.user.is_staff):
            return Response({'error': 'Only the product seller or admin can generate 3D models'}, status=status.HTTP_403_FORBIDDEN)

        if ProductImage.objects.filter(product=product, file_type='model').exists():
            return Response({'error': 'Product already has a 3D model. Remove the existing model first.'}, status=status.HTTP_400_BAD_REQUEST)

        if GenerationRequest.objects.filter(product=product, status__in=['pending', 'processing']).exists():
            return Response({'error': 'A 3D generation is already in progress for this product.'}, status=status.HTTP_400_BAD_REQUEST)

        # --- Payload Parsing & Validation ---
        angle_mapping_ids = request.data.get('angle_mapping')
        detail_level = request.data.get('detail_level', 'medium')
        clothing_type = request.data.get('clothing_type', 'tshirt')

        if not isinstance(angle_mapping_ids, dict) or len(angle_mapping_ids) < 2:
            return Response({'error': 'A mapping of at least two angles to image IDs is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate clothing type
        valid_clothing_types = ['tshirt', 'pants', 'shirts', 'shoes']
        if clothing_type not in valid_clothing_types:
            return Response({'error': f'Invalid clothing type. Must be one of: {valid_clothing_types}'}, status=status.HTTP_400_BAD_REQUEST)

        image_angle_map_files = {}
        invalid_ids = []
        
        # Fetch and validate all images in one query
        product_images = ProductImage.objects.filter(
            product=product, 
            id__in=angle_mapping_ids.values(),
            file_type='image'
        ).in_bulk() # .in_bulk() returns a dict of {id: object}

        for angle, image_id in angle_mapping_ids.items():
            image_obj = product_images.get(image_id)
            if image_obj:
                image_angle_map_files[angle] = image_obj.file
            else:
                invalid_ids.append(image_id)

        if invalid_ids:
            return Response({'error': f'Invalid or mismatched ProductImage IDs: {invalid_ids}'}, status=status.HTTP_400_BAD_REQUEST)
        
        if len(image_angle_map_files) < 2:
             return Response({'error': 'Could not resolve at least two valid images from the provided mapping.'}, status=status.HTTP_400_BAD_REQUEST)

        # --- Generation Trigger ---
        try:
            generation_request = create_generation_request_from_files(
                product=product,
                image_angle_map=image_angle_map_files,
                detail_level=detail_level,
                clothing_type=clothing_type
            )
            
            if generation_request:
                return Response({
                    'message': f'3D model generation started successfully for {clothing_type}',
                    'request_id': str(generation_request.id),
                    'clothing_type': clothing_type
                }, status=status.HTTP_202_ACCEPTED)
            else:
                return Response({'error': 'Failed to start 3D generation process due to an internal condition.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"Error triggering 3D generation for product {pk}: {e}")
            return Response({'error': f'An unexpected error occurred: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @extend_schema(
        description="Cancel ongoing 3D model generation for a product",
        responses={200: OpenApiTypes.OBJECT}
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def cancel_3d_generation(self, request, pk=None):
        """
        Cancel ongoing 3D model generation for a product
        """
        product = self.get_object()
        
        # Check if user is the seller or admin
        if not (request.user == product.seller or request.user.role == 'admin' or request.user.is_staff):
            return Response(
                {'error': 'Only the product seller or admin can cancel 3D generation'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Find ongoing generation requests
            ongoing_requests = GenerationRequest.objects.filter(
                product=product,
                status__in=['pending', 'processing']
            )
            
            if not ongoing_requests.exists():
                return Response(
                    {'error': 'No ongoing 3D generation found for this product'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Cancel all ongoing requests
            cancelled_count = 0
            for req in ongoing_requests:
                req.status = 'cancelled'
                req.message = 'Cancelled by user'
                req.save()
                cancelled_count += 1
            
            return Response({
                'message': f'Successfully cancelled {cancelled_count} generation request(s)',
                'cancelled_count': cancelled_count
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to cancel 3D generation: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def toggle_wishlist(self, request, pk=None):
        """
        Toggle a product in the user's wishlist
        """
        # Prevent all sellers from toggling wishlist
        if hasattr(request.user, 'role') and request.user.role == 'seller':
            return Response({'error': 'Sellers cannot add products to the wishlist.'}, status=status.HTTP_403_FORBIDDEN)
        
        product = self.get_object()
        wishlist, created = Wishlist.objects.get_or_create(user=request.user)
        
        # Check if the product is already in the wishlist
        wishlist_item = WishlistItem.objects.filter(
            wishlist=wishlist,
            product=product
        ).first()
        
        if wishlist_item:
            # Remove from wishlist
            wishlist_item.delete()
            return Response({'status': 'removed', 'message': 'Product removed from wishlist'})
        else:
            # Add to wishlist
            WishlistItem.objects.create(wishlist=wishlist, product=product)
            return Response({'status': 'added', 'message': 'Product added to wishlist'})

    @extend_schema(
        description="Add a review to a product",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'rating': {'type': 'integer', 'minimum': 1, 'maximum': 5},
                    'comment': {'type': 'string', 'nullable': True}
                },
                'required': ['rating']
            }
        },
        responses={201: ReviewSerializer}
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_review(self, request, pk=None):
        """
        Add a review to a product
        """
        product = self.get_object()
        user = request.user
        
        # Check if user has already reviewed this product
        existing_review = Review.objects.filter(product=product, user=user).first()
        if existing_review:
            return Response(
                {'error': 'You have already reviewed this product'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate rating
        rating = request.data.get('rating')
        if not rating or not (1 <= rating <= 5):
            return Response(
                {'error': 'Rating must be between 1 and 5'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the review
        review_data = {
            'product': product,
            'user': user,
            'rating': rating,
            'comment': request.data.get('comment', '')
        }
        
        review = Review.objects.create(**review_data)
        serializer = ReviewSerializer(review)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @extend_schema(
        description="Upload files for a product (multipart/form-data)",
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'images': {'type': 'array', 'items': {'type': 'string', 'format': 'binary'}},
                    'product': {'type': 'integer'},
                    'detail_level': {'type': 'string'},
                }
            }
        },
        responses={200: ProductImageSerializer(many=True)}
    )
    @action(
        detail=True,
        methods=['post'],
        parser_classes=[MultiPartParser],
        permission_classes=[IsAuthenticated],
    )
    def upload_files(self, request, pk=None):
        """
        Handles file uploads for a specific product.
        Expects a multipart/form-data request with 'images'.
        """
        product = self.get_object()
        files = request.FILES.getlist('images')

        if not files:
            return Response(
                {'error': "No files were provided in the 'images' field."},
                status=status.HTTP_400_BAD_REQUEST
            )

        uploaded_images = []
        for file in files:
            img = ProductImage.objects.create(product=product, file=file, file_type='image')
            uploaded_images.append(img)
            
        serializer = ProductImageSerializer(uploaded_images, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @extend_schema(
        description="Add a variant to a product",
        request={
            'application/json': {
                'type': 'object',
                'properties': {
                    'options': {'type': 'array', 'items': {'type': 'integer'}},
                    'sku': {'type': 'string'},
                    'price_adjustment': {'type': 'number'},
                    'stock': {'type': 'integer'},
                    'weight': {'type': 'number', 'nullable': True},
                    'is_active': {'type': 'boolean'}
                },
                'required': ['options', 'sku']
            }
        },
        responses={201: ProductVariantSerializer}
    )
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_variant(self, request, pk=None):
        """
        Add a variant to a product
        """
        product = self.get_object()
        
        # Check if user is the seller or admin
        if not (request.user == product.seller or request.user.role == 'admin' or request.user.is_staff):
            return Response(
                {'error': 'Only the product seller or admin can add variants'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Validate required fields
        options = request.data.get('options', [])
        sku = request.data.get('sku')
        
        if not options or not sku:
            return Response(
                {'error': 'Options and SKU are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if SKU already exists
        if ProductVariant.objects.filter(sku=sku).exists():
            return Response(
                {'error': 'SKU already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Create the variant
            variant = ProductVariant.objects.create(
                product=product,
                sku=sku,
                price_adjustment=request.data.get('price_adjustment', 0),
                stock=request.data.get('stock', 0),
                weight=request.data.get('weight'),
                is_active=request.data.get('is_active', True)
            )
            
            # Add options to the variant
            variant_options = ProductVariantOption.objects.filter(id__in=options)
            variant.options.set(variant_options)
            
            serializer = ProductVariantSerializer(variant)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to create variant: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )