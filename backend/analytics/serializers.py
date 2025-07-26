from rest_framework import serializers

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

class SalesByCategorySerializer(serializers.Serializer):
    name = serializers.CharField()
    value = serializers.FloatField()

class TopSellingProductSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    product_name = serializers.CharField()
    total_quantity = serializers.IntegerField()
    total_sales = serializers.FloatField()

class RevenueBySellerSerializer(serializers.Serializer):
    seller_id = serializers.IntegerField()
    seller_username = serializers.CharField()
    revenue = serializers.FloatField()

class DashboardStatsSerializer(serializers.Serializer):
    views_by_day = DayViewsSerializer(many=True)
    top_products = ProductStatsSerializer(many=True)
    top_categories = CategoryStatsSerializer(many=True)
    sales_by_category = SalesByCategorySerializer(many=True)
    top_selling_products = TopSellingProductSerializer(many=True, required=False)
    revenue_by_seller = RevenueBySellerSerializer(many=True, required=False)
    total_users = serializers.IntegerField()
    total_orders = serializers.IntegerField()
    total_products = serializers.IntegerField()
    total_sales = serializers.FloatField()
    total_customers = serializers.IntegerField()
    customers_count = serializers.IntegerField()
    sellers_count = serializers.IntegerField()
    admins_count = serializers.IntegerField()
    users_change = serializers.FloatField()
    orders_change = serializers.FloatField()
    products_change = serializers.FloatField()
    revenue_change = serializers.FloatField()
    sales_by_month = serializers.ListField(
        child=serializers.DictField()
    )