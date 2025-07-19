from rest_framework import serializers
from .models import OrderItem

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'order', 'product', 'quantity', 'price']

