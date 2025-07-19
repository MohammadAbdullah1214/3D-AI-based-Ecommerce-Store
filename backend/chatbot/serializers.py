from rest_framework import serializers
from .models import (
    ChatSession, ChatMessage, ProductRecommendation, 
    CustomerBehaviorProfile, SessionProductView, SessionProductClick,
    SearchQuery
)
from products.serializers import ProductSerializer
from products.models import Product


class ChatSessionSerializer(serializers.ModelSerializer):
    behavior_score = serializers.SerializerMethodField()
    message_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatSession
        fields = ['id', 'session_id', 'started_at', 'ended_at', 'is_active', 
                 'preferences', 'behavior_score', 'message_count']
        read_only_fields = ['started_at', 'behavior_score', 'message_count']
    
    def get_behavior_score(self, obj):
        return obj.behavioral_score
    
    def get_message_count(self, obj):
        return obj.messages.count()


class ChatMessageSerializer(serializers.ModelSerializer):
    products_recommended = ProductSerializer(many=True, read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = ['id', 'message_type', 'content', 'timestamp', 'intent_detected', 
                 'confidence_score', 'products_recommended', 'metadata']
        read_only_fields = ['timestamp', 'intent_detected', 'confidence_score']


class ChatMessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ['content']


class ProductRecommendationSerializer(serializers.ModelSerializer):
    product_details = ProductSerializer(source='product', read_only=True)
    
    class Meta:
        model = ProductRecommendation
        fields = ['id', 'product', 'product_details', 'recommendation_score', 
                 'recommendation_type', 'reason', 'was_clicked', 'was_added_to_cart', 
                 'was_purchased', 'shown_at']
        read_only_fields = ['shown_at']


class CustomerBehaviorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerBehaviorProfile
        fields = ['total_searches', 'total_product_clicks', 'engagement_score',
                 'preferred_categories', 'price_sensitivity_score', 'last_updated']
        read_only_fields = ['last_updated']


class ChatInitSerializer(serializers.Serializer):
    session_id = serializers.CharField(required=False)
    user_message = serializers.CharField(required=False, allow_blank=True)
    
    def validate_user_message(self, value):
        """Validate user message - allow empty/whitespace but provide default"""
        if value is None or value.strip() == "":
            return ""  # Return empty string instead of None
        return value.strip()  # Trim whitespace


class ChatResponseSerializer(serializers.Serializer):
    session_id = serializers.CharField()
    bot_response = serializers.CharField()
    recommendations = ProductRecommendationSerializer(many=True)
    intent_detected = serializers.CharField()
    confidence_score = serializers.FloatField()
    behavioral_insights = serializers.DictField()


# New serializers for personalized recommendations
class RecommendationProductSerializer(serializers.ModelSerializer):
    """Serializer for products in recommendations"""
    effective_price = serializers.SerializerMethodField()
    savings = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'price', 'discount_price', 'effective_price', 
            'savings', 'category', 'image', 'description'
        ]
    
    def get_effective_price(self, obj):
        return float(obj.discount_price) if obj.discount_price else float(obj.price)
    
    def get_savings(self, obj):
        if obj.discount_price:
            return float(obj.price) - float(obj.discount_price)
        return 0.0


class PersonalizedRecommendationSerializer(serializers.Serializer):
    """Serializer for personalized recommendations"""
    product = RecommendationProductSerializer(read_only=True)
    score = serializers.FloatField()
    reason = serializers.CharField()
    type = serializers.CharField()
    trigger = serializers.CharField()
    timestamp = serializers.DateTimeField(read_only=True)


class UserBehaviorProfileSerializer(serializers.Serializer):
    """Serializer for user behavior profile"""
    engagement_score = serializers.FloatField()
    confidence_level = serializers.FloatField()
    session_frequency = serializers.CharField()
    preferred_categories = serializers.DictField()
    average_price_viewed = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    price_sensitivity_score = serializers.FloatField()
    total_searches = serializers.IntegerField()
    total_product_clicks = serializers.IntegerField()
    recommendation_acceptance_rate = serializers.FloatField()
    last_updated = serializers.DateTimeField()


class RecommendationMetricsSerializer(serializers.Serializer):
    """Serializer for recommendation performance metrics"""
    total_recommendations_shown = serializers.IntegerField()
    click_rate = serializers.FloatField()
    cart_rate = serializers.FloatField()
    purchase_rate = serializers.FloatField()
    effectiveness_score = serializers.FloatField()


class AIChatbotRecommendationSerializer(serializers.Serializer):
    """Serializer for AI chatbot recommendations (dict-based, not Product object)"""
    id = serializers.IntegerField()
    name = serializers.CharField()
    price = serializers.FloatField(required=False, allow_null=True)
    discount_price = serializers.FloatField(required=False, allow_null=True)
    category = serializers.CharField(required=False, allow_null=True)
    brand = serializers.CharField(required=False, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    score = serializers.FloatField(required=False, allow_null=True)
    effective_price = serializers.FloatField(required=False, allow_null=True)
    image = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    reason = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    type = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class AIChatbotResponseSerializer(serializers.Serializer):
    """Serializer for AI chatbot response"""
    session_id = serializers.CharField()
    bot_response = serializers.CharField()
    recommendations = AIChatbotRecommendationSerializer(many=True)
    intent_detected = serializers.CharField()
    confidence_score = serializers.FloatField()
    behavioral_insights = serializers.DictField()
