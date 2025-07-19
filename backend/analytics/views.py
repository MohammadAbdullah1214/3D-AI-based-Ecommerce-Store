from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from products.models import Product, Category, ProductView
from django.db.models.functions import TruncDay
from datetime import timedelta
from django.utils import timezone
from permissions import IsSellerOrAdmin
from rest_framework import serializers
from drf_spectacular.utils import extend_schema

# Create a serializer for the dashboard stats
class DayViewsSerializer(serializers.Serializer):
    day = serializers.DateTimeField()
    count = serializers.IntegerField()

class ProductStatsSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    view_count = serializers.IntegerField()

class CategoryStatsSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    product_count = serializers.IntegerField()

class DashboardStatsSerializer(serializers.Serializer):
    views_by_day = DayViewsSerializer(many=True)
    top_products = ProductStatsSerializer(many=True)
    top_categories = CategoryStatsSerializer(many=True)

@extend_schema(responses=DashboardStatsSerializer)
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSellerOrAdmin])
def dashboard_stats(request):
    """Get dashboard statistics for admin and sellers"""
    # Time range
    days = int(request.query_params.get('days', 30))
    start_date = timezone.now() - timedelta(days=days)
    
    # Filter by seller if the user is a seller
    user = request.user
    seller_filter = {}
    if user.role == 'seller' and not user.is_staff:
        seller_filter = {'product__seller': user}
    
    # Product views over time
    views_by_day = ProductView.objects.filter(
        timestamp__gte=start_date,
        **seller_filter
    ).annotate(
        day=TruncDay('timestamp')
    ).values('day').annotate(
        count=Count('id')
    ).order_by('day')
    
    # Top products
    if user.role == 'seller' and not user.is_staff:
        # Sellers can only see their own products
        top_products = Product.objects.filter(
            seller=user
        ).annotate(
            view_count=Count('views')
        ).order_by('-view_count')[:10].values('id', 'name')
    else:
        # Admins can see all products
        top_products = Product.objects.annotate(
            view_count=Count('views')
        ).order_by('-view_count')[:10].values('id', 'name')
    
    # Add view count to each product
    for product in top_products:
        product['view_count'] = ProductView.objects.filter(product_id=product['id']).count()
    
    # Top categories
    if user.role == 'seller' and not user.is_staff:
        # Sellers can only see categories of their products
        seller_product_categories = Product.objects.filter(seller=user).values_list('category', flat=True)
        top_categories = Category.objects.filter(
            id__in=seller_product_categories
        ).annotate(
            product_count=Count('products')
        ).order_by('-product_count')[:10].values('id', 'name')
    else:
        # Admins can see all categories
        top_categories = Category.objects.annotate(
            product_count=Count('products')
        ).order_by('-product_count')[:10].values('id', 'name')
    
    # Add product count to each category
    for category in top_categories:
        if user.role == 'seller' and not user.is_staff:
            # For sellers, only count their products
            category['product_count'] = Product.objects.filter(
                category_id=category['id'],
                seller=user
            ).count()
        else:
            # For admins, count all products
            category['product_count'] = Product.objects.filter(
                category_id=category['id']
            ).count()
    
    return Response({
        'views_by_day': list(views_by_day),
        'top_products': list(top_products),
        'top_categories': list(top_categories),
    })