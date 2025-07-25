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
from users.models import CustomUser
from orders.models import Order, OrderItem
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from .serializers import DashboardStatsSerializer
import logging
import traceback
logger = logging.getLogger(__name__)

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
    try:
        user = request.user
        logger.info(f"[DASHBOARD DEBUG] User: {user.username}, Role: {getattr(user, 'role', None)}, ID: {user.id}")
        if getattr(user, 'role', None) == 'seller':
            product_count = Product.objects.filter(seller=user).count()
            orderitem_count = OrderItem.objects.filter(product__seller=user).count()
            order_count = Order.objects.filter(items__product__seller=user).distinct().count()
            logger.info(f"[DASHBOARD DEBUG] Seller {user.username} - Products: {product_count}, OrderItems: {orderitem_count}, Orders: {order_count}")
        # Time range
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        prev_start_date = start_date - timedelta(days=days)
        prev_end_date = start_date
        
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
        
        # --- New: Platform stats ---
        # Current period
        if user.role == 'seller' and not user.is_staff:
            # For sellers, only count their orders and revenue
            seller_orders = Order.objects.filter(
                items__product__seller=user,
                status__in=['processing', 'shipped', 'delivered']
            ).distinct()
            total_orders = seller_orders.count()
            total_revenue = seller_orders.aggregate(total=Sum('total_price'))['total'] or 0
            total_products = Product.objects.filter(seller=user).count()
            # Count unique customers who bought from this seller
            customers_count = CustomUser.objects.filter(
                orders__items__product__seller=user
            ).distinct().count()
            total_users = 0  # Not relevant for sellers
            sellers_count = 0  # Not relevant for sellers
            admins_count = 0  # Not relevant for sellers
        else:
            # For admins, count all platform stats
            total_users = CustomUser.objects.count()
            total_orders = Order.objects.count()
            total_products = Product.objects.count()
            total_revenue = Order.objects.filter(status__in=['processing', 'shipped', 'delivered']).aggregate(
                total=Sum('total_price')
            )['total'] or 0
            customers_count = CustomUser.objects.filter(role='customer').count()
            sellers_count = CustomUser.objects.filter(role='seller').count()
            admins_count = CustomUser.objects.filter(role='admin').count()
        # Previous period
        if user.role == 'seller' and not user.is_staff:
            # For sellers, only count their previous period stats
            prev_seller_orders = Order.objects.filter(
                items__product__seller=user,
                created_at__gte=prev_start_date, 
                created_at__lt=prev_end_date,
                status__in=['processing', 'shipped', 'delivered']
            ).distinct()
            prev_orders = prev_seller_orders.count()
            prev_revenue = prev_seller_orders.aggregate(total=Sum('total_price'))['total'] or 0
            prev_products = Product.objects.filter(
                seller=user,
                created_at__gte=prev_start_date, 
                created_at__lt=prev_end_date
            ).count()
            prev_users = 0  # Not relevant for sellers
        else:
            # For admins, count all previous period stats
            prev_users = CustomUser.objects.filter(created_at__gte=prev_start_date, created_at__lt=prev_end_date).count()
            prev_orders = Order.objects.filter(created_at__gte=prev_start_date, created_at__lt=prev_end_date).count()
            prev_products = Product.objects.filter(created_at__gte=prev_start_date, created_at__lt=prev_end_date).count()
            prev_revenue = Order.objects.filter(
                created_at__gte=prev_start_date, created_at__lt=prev_end_date,
                status__in=['processing', 'shipped', 'delivered']
            ).aggregate(total=Sum('total_price'))['total'] or 0
        # Calculate percentage change
        def percent_change(current, prev):
            if prev == 0:
                return 100.0 if current > 0 else 0.0
            return ((current - prev) / prev) * 100
        users_change = percent_change(total_users, prev_users)
        orders_change = percent_change(total_orders, prev_orders)
        products_change = percent_change(total_products, prev_products)
        revenue_change = percent_change(total_revenue, prev_revenue)
        
        # --- New: Sales by Month ---
        months_back = 12
        sales_by_month = []
        now = timezone.now()
        for i in range(months_back):
            month_start = (now.replace(day=1) - timedelta(days=now.day - 1)).replace(month=(now.month - i - 1) % 12 + 1, year=now.year - ((now.month - i - 1) // 12))
            month_end = (month_start + timedelta(days=32)).replace(day=1)
            
            if user.role == 'seller' and not user.is_staff:
                # For sellers, only count their orders
                month_orders = Order.objects.filter(
                    items__product__seller=user,
                    created_at__gte=month_start, 
                    created_at__lt=month_end, 
                    status__in=['processing', 'shipped', 'delivered']
                ).distinct()
            else:
                # For admins, count all orders
                month_orders = Order.objects.filter(
                    created_at__gte=month_start, 
                    created_at__lt=month_end, 
                    status__in=['processing', 'shipped', 'delivered']
                )
            
            month_sales = month_orders.aggregate(total=Sum('total_price'))['total'] or 0
            month_count = month_orders.count()
            sales_by_month.append({
                'name': month_start.strftime('%b'),
                'sales': float(month_sales),
                'orders': month_count
            })
        sales_by_month = list(reversed(sales_by_month))
        
        # Get top selling products for sellers
        if user.role == 'seller' and not user.is_staff:
            top_selling_products_qs = OrderItem.objects.filter(
                product__seller=user,
                order__status__in=['processing', 'shipped', 'delivered']
            ).values('product__id', 'product__name').annotate(
                total_quantity=Sum('quantity'),
                total_sales=Sum('price')
            ).order_by('-total_quantity')[:5]
            top_selling_products = [
                {
                    'product_id': entry['product__id'],
                    'product_name': entry['product__name'],
                    'total_quantity': entry['total_quantity'],
                    'total_sales': float(entry['total_sales'] or 0)
                }
                for entry in top_selling_products_qs
            ]
        else:
            top_selling_products = []

        # --- New: Sales by Category ---
        if user.role == 'seller' and not user.is_staff:
            sales_by_category_qs = (
                OrderItem.objects.filter(
                    product__seller=user,
                    order__status__in=['processing', 'shipped', 'delivered']
                )
                .values('product__category__name')
                .annotate(total_sales=Sum('price'))
                .order_by('-total_sales')
            )
        else:
            sales_by_category_qs = (
                OrderItem.objects.filter(
                    order__status__in=['processing', 'shipped', 'delivered']
                )
                .values('product__category__name')
                .annotate(total_sales=Sum('price'))
                .order_by('-total_sales')
            )
        sales_by_category = [
            {'name': entry['product__category__name'] or 'Uncategorized', 'value': float(entry['total_sales'] or 0)}
            for entry in sales_by_category_qs
        ]

        # --- Revenue by Seller (for admins) ---
        revenue_by_seller = []
        if user.role in ['admin'] or user.is_staff:
            from django.db.models import F
            seller_revenue_qs = (
                OrderItem.objects.filter(
                    order__status__in=['processing', 'shipped', 'delivered'],
                    product__seller__isnull=False
                )
                .values('product__seller', 'product__seller__username')
                .annotate(revenue=Sum('price'))
                .order_by('-revenue')
            )
            revenue_by_seller = [
                {
                    'seller_id': entry['product__seller'],
                    'seller_username': entry['product__seller__username'],
                    'revenue': float(entry['revenue'] or 0)
                }
                for entry in seller_revenue_qs
            ]

        return Response({
            'views_by_day': list(views_by_day),
            'top_products': list(top_products),
            'top_categories': list(top_categories),
            'total_users': total_users,
            'total_orders': total_orders,
            'total_products': total_products,
            'total_sales': float(total_revenue),  # Changed from total_revenue to total_sales
            'total_customers': customers_count,  # Changed from customers_count to total_customers
            'customers_count': customers_count,
            'sellers_count': sellers_count,
            'admins_count': admins_count,
            'users_change': users_change,
            'orders_change': orders_change,
            'products_change': products_change,
            'revenue_change': revenue_change,
            'sales_by_month': sales_by_month,
            'top_selling_products': top_selling_products,
            'sales_by_category': sales_by_category,
            'revenue_by_seller': revenue_by_seller,
        })
    except Exception as e:
        tb = traceback.format_exc()
        logger.error(f"[DASHBOARD ERROR] {str(e)}\n{tb}")
        return Response({"error": str(e), "traceback": tb}, status=500)