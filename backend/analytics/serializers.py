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

class DashboardStatsSerializer(serializers.Serializer):
    views_by_day = DayViewsSerializer(many=True)
    top_products = ProductStatsSerializer(many=True)
    top_categories = CategoryStatsSerializer(many=True)
    sales_by_category = SalesByCategorySerializer(many=True)