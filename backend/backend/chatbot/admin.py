from django.contrib import admin
from .models import (
    ChatSession, ChatMessage, ProductRecommendation, 
    CustomerBehaviorProfile, SessionProductView, SessionProductClick,
    SearchQuery, BehaviorAnalytics
)

@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ['session_id', 'user', 'started_at', 'ended_at', 'is_active', 'get_behavior_score']
    list_filter = ['is_active', 'started_at']
    search_fields = ['session_id', 'user__username']
    readonly_fields = ['session_id', 'started_at']
    
    def get_behavior_score(self, obj):
        return obj.behavioral_score
    get_behavior_score.short_description = 'Behavior Score'

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['session', 'message_type', 'content_preview', 'timestamp', 'intent_detected']
    list_filter = ['message_type', 'intent_detected', 'timestamp']
    search_fields = ['content', 'session__session_id']
    readonly_fields = ['timestamp']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'

@admin.register(ProductRecommendation)
class ProductRecommendationAdmin(admin.ModelAdmin):
    list_display = ['session', 'product', 'recommendation_score', 'recommendation_type', 'was_clicked', 'was_added_to_cart', 'was_purchased']
    list_filter = ['recommendation_type', 'was_clicked', 'was_added_to_cart', 'was_purchased', 'shown_at']
    search_fields = ['product__name', 'session__session_id']
    readonly_fields = ['shown_at']

@admin.register(CustomerBehaviorProfile)
class CustomerBehaviorProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'engagement_score', 'total_searches', 'total_product_clicks', 'confidence_level', 'last_updated']
    list_filter = ['engagement_score', 'confidence_level', 'last_updated']
    search_fields = ['user__username']
    readonly_fields = ['last_updated', 'data_points_count']

@admin.register(SessionProductView)
class SessionProductViewAdmin(admin.ModelAdmin):
    list_display = ['session', 'product', 'viewed_at', 'interest_level', 'came_from_search', 'came_from_recommendation']
    list_filter = ['interest_level', 'came_from_search', 'came_from_recommendation', 'viewed_at']
    search_fields = ['product__name', 'session__session_id']

@admin.register(SessionProductClick)
class SessionProductClickAdmin(admin.ModelAdmin):
    list_display = ['session', 'product', 'clicked_at', 'click_source', 'click_position', 'added_to_cart']
    list_filter = ['click_source', 'added_to_cart', 'clicked_at']
    search_fields = ['product__name', 'session__session_id']

@admin.register(SearchQuery)
class SearchQueryAdmin(admin.ModelAdmin):
    list_display = ['session', 'query_text_preview', 'query_type', 'results_count', 'results_clicked', 'query_timestamp']
    list_filter = ['query_type', 'query_timestamp']
    search_fields = ['query_text', 'session__session_id']
    
    def query_text_preview(self, obj):
        return obj.query_text[:50] + '...' if len(obj.query_text) > 50 else obj.query_text
    query_text_preview.short_description = 'Query'

@admin.register(BehaviorAnalytics)
class BehaviorAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['date', 'total_sessions', 'total_searches', 'total_clicks', 'search_to_click_ratio']
    list_filter = ['date']
    readonly_fields = ['date']
