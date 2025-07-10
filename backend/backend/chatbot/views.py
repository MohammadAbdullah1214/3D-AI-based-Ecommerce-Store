from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, Case, When, F, Avg, Count
import uuid
from typing import List, Dict
import re
from datetime import timedelta

from .models import (
    ChatSession, ChatMessage, ProductRecommendation,
    CustomerBehaviorProfile, SearchQuery
)
from .serializers import (
    ChatSessionSerializer, ChatMessageSerializer, ChatMessageCreateSerializer,
    ProductRecommendationSerializer, CustomerBehaviorProfileSerializer,
    ChatInitSerializer, ChatResponseSerializer, UserBehaviorProfileSerializer,
    AIChatbotRecommendationSerializer, AIChatbotResponseSerializer
)

# Import AI engine components
try:
    from .enhanced_ai_engine import AIRecommendationEngine, NLPProcessor
except ImportError:
    AIRecommendationEngine = None
    NLPProcessor = None

try:
    from .behavior_tracker import BehaviorTracker, PersonalizedRecommendationEngine
except ImportError:
    BehaviorTracker = None
    PersonalizedRecommendationEngine = None

try:
    from products.models import Product
except ImportError:
    Product = None

from drf_spectacular.utils import extend_schema, OpenApiParameter
from chatbot.ai_chatbot import AIChatbot
from .ai_recommendation_engine import AIRecommendationEngine as AIEngine


class ChatbotViewSet(viewsets.GenericViewSet):
    """Enhanced chatbot with context awareness, conversation continuity, and personalized recommendations"""
    permission_classes = [permissions.AllowAny]
    serializer_class = ChatInitSerializer
    
    # Class-level variable to ensure AI chatbot is only initialized once
    _ai_chatbot = None

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Only initialize AI chatbot once
        if ChatbotViewSet._ai_chatbot is None:
            ChatbotViewSet._ai_chatbot = AIChatbot()
        self.ai_chatbot = ChatbotViewSet._ai_chatbot

    @extend_schema(
        request=ChatInitSerializer,
        responses={200: AIChatbotResponseSerializer},
        description="Chat with context-aware AI salesperson"
    )
    @action(detail=False, methods=['post'])
    def chat(self, request):
        """Enhanced chat endpoint with conversation context"""
        serializer = ChatInitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        session_id = serializer.validated_data.get('session_id')
        user_message = serializer.validated_data.get('user_message', '')

        # Get or create session
        if session_id:
            try:
                session = ChatSession.objects.get(session_id=session_id, is_active=True)
            except ChatSession.DoesNotExist:
                session = self.create_new_session(request.user if request.user.is_authenticated else None)
        else:
            session = self.create_new_session(request.user if request.user.is_authenticated else None)

        # Get session context BEFORE processing
        session_context = self._get_session_context(session)

        # Process user message if provided
        if user_message and user_message.strip():
            print(f"🤖 PROCESSING MESSAGE: '{user_message}'")
            # Save user message
            user_msg = ChatMessage.objects.create(
                session=session,
                message_type='user',
                content=user_message
            )
            if hasattr(user_msg, 'analyze_user_message'):
                user_msg.analyze_user_message()
            session.total_messages += 1
            session.save(update_fields=['total_messages'])

            # Use the new AIChatbot for response generation
            ai_result = self.ai_chatbot.process_message(user_message, session, getattr(request.user, 'id', None))
            bot_response = ai_result['response']
            intent = ai_result['intent']
            confidence = ai_result['confidence']
            entities = ai_result['entities']
            # Extract recommendations from ai_result
            recommendations = ai_result.get('recommendations', [])

            print(f"💬 BOT RESPONSE: '{bot_response}'")
            print(f"📦 RECOMMENDATIONS: {len(recommendations)} products")

            # Save bot message
            bot_msg = ChatMessage.objects.create(
                session=session,
                message_type='bot',
                content=bot_response,
                intent_detected=intent,
                confidence_score=confidence,
                metadata={'entities': entities}
            )

            self._update_session_context(session, intent, entities, recommendations, user_message)
            recommendation_objects = recommendations
        else:
            # Enhanced initial greeting for empty messages
            greeting = self._generate_enhanced_greeting(session)
            bot_response = greeting
            intent = 'greeting'
            confidence = 1.0
            entities = {}
            recommendation_objects = []
            recommendations = []

        # Update session behavioral score if method exists
        if hasattr(session, 'update_behavioral_score'):
            session.update_behavioral_score()

        # Prepare enhanced response
        response_data = {
            'session_id': session.session_id,
            'bot_response': bot_response,
            'recommendations': AIChatbotRecommendationSerializer(recommendation_objects, many=True).data,
            'intent_detected': intent,
            'confidence_score': confidence,
            'behavioral_insights': self._get_session_insights(session)
        }
        return Response(response_data)

    @extend_schema(
        description="Get personalized recommendations when user logs in",
        responses={200: {
            'type': 'object',
            'properties': {
                'recommendations': {'type': 'array'},
                'user_type': {'type': 'string'},
                'confidence_level': {'type': 'number'},
                'personalization_score': {'type': 'number'}
            }
        }}
    )
    @action(detail=False, methods=['get'])
    def login_recommendations(self, request):
        """Get personalized recommendations when user logs in"""
        
        if not self.recommendation_engine:
            return Response({'error': 'Recommendation engine not available'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        if not request.user.is_authenticated:
            # For anonymous users, show trending products
            recommendations = self.recommendation_engine._get_trending_recommendations(6)
        else:
            # For authenticated users, get personalized recommendations
            recommendations = self.recommendation_engine.get_login_recommendations(request.user, limit=6)
        
        # Convert to serializable format
        recommendation_data = []
        for rec in recommendations:
            product_data = {
                'id': rec['product'].id,
                'name': rec['product'].name,
                'price': float(rec['product'].price),
                'discount_price': float(rec['product'].discount_price) if rec['product'].discount_price else None,
                'category': rec['product'].category.name if rec['product'].category else None,
                'image': rec['product'].primary_image.file.url if hasattr(rec['product'], 'primary_image') and rec['product'].primary_image else '/placeholder.svg',
                'description': rec['product'].description,
                'brand': 'Unknown',
                'score': rec.get('score', 0.0),
                'reason': rec.get('reason', ''),
                'type': rec.get('type', ''),
                'trigger': rec.get('trigger', ''),
            }
            recommendation_data.append(product_data)
        
        # Get user profile info if available
        user_info = {'user_type': 'anonymous', 'confidence_level': 0.0}
        if request.user.is_authenticated:
            try:
                profile = request.user.behavior_profile
                user_info = {
                    'user_type': 'returning_user' if profile.confidence_level > 0.3 else 'new_user',
                    'confidence_level': profile.confidence_level,
                    'engagement_score': profile.engagement_score,
                    'session_frequency': profile.session_frequency
                }
            except:
                user_info = {'user_type': 'new_user', 'confidence_level': 0.0}
        
        return Response({
            'recommendations': recommendation_data,
            'user_info': user_info,
            'personalization_score': self._calculate_personalization_score(request.user) if request.user.is_authenticated else 0.0
        })

    @extend_schema(
        description="Get AI-powered recommendations based on user behavior data",
        request={
            'type': 'object',
            'properties': {
                'user_id': {'type': 'integer'},
                'behavior_data': {
                    'type': 'object',
                    'properties': {
                        'page_views': {'type': 'integer'},
                        'time_spent': {'type': 'integer'},
                        'scroll_depth': {'type': 'integer'},
                        'mouse_movements': {'type': 'integer'},
                        'clicks': {'type': 'integer'},
                        'products_viewed': {'type': 'array', 'items': {'type': 'string'}}
                    }
                },
                'limit': {'type': 'integer'}
            }
        },
        responses={200: {
            'type': 'object',
            'properties': {
                'recommendations': {'type': 'array'},
                'ai_confidence': {'type': 'number'},
                'behavior_analysis': {'type': 'object'}
            }
        }}
    )
    @action(detail=False, methods=['post'], url_path='ai-recommendations', permission_classes=[permissions.AllowAny])
    def ai_recommendations(self, request):
        """Get AI-powered recommendations based on user behavior data"""
        try:
            user_id = request.data.get('user_id')
            behavior_data = request.data.get('behavior_data', {})
            limit = min(request.data.get('limit', 6), 12)  # Cap at 12 maximum
            
            # Analyze behavior data
            behavior_analysis = {
                'engagement_level': 'low',
                'interest_categories': [],
                'preferred_price_range': 'medium',
                'activity_intensity': 'low'
            }
            
            # Calculate engagement level
            engagement_score = 0
            if behavior_data.get('time_spent', 0) > 30:
                engagement_score += 20
            if behavior_data.get('scroll_depth', 0) > 50:
                engagement_score += 15
            if behavior_data.get('mouse_movements', 0) > 100:
                engagement_score += 10
            if behavior_data.get('clicks', 0) > 5:
                engagement_score += 15
            if len(behavior_data.get('products_viewed', [])) > 2:
                engagement_score += 20
            
            if engagement_score >= 60:
                behavior_analysis['engagement_level'] = 'high'
            elif engagement_score >= 30:
                behavior_analysis['engagement_level'] = 'medium'
            
            # Analyze activity intensity
            if behavior_data.get('mouse_movements', 0) > 200:
                behavior_analysis['activity_intensity'] = 'high'
            elif behavior_data.get('mouse_movements', 0) > 100:
                behavior_analysis['activity_intensity'] = 'medium'
            
            # Get recommendations using the AI chatbot
            recommendations = []
            try:
                from products.models import Product
                
                # Get products based on behavior
                products = Product.objects.filter(is_active=True)
                
                # If user has viewed products, try to find similar ones
                if behavior_data.get('products_viewed'):
                    viewed_products = behavior_data['products_viewed']
                    # Try to find similar products to what they've viewed
                    viewed_product_objects = Product.objects.filter(
                        name__icontains=viewed_products[0] if viewed_products else ''
                    )[:limit//2]  # Only get half from viewed products
                    
                    if viewed_product_objects.exists():
                        for product in viewed_product_objects:
                            recommendations.append({
                                'id': product.id,
                                'name': product.name,
                                'price': float(product.price),
                                'discount_price': float(product.discount_price) if product.discount_price else None,
                                'image': product.primary_image.file.url if product.primary_image else '/placeholder.svg',
                                'category': product.category.name if product.category else 'Unknown',
                                'brand': 'Unknown',
                                'score': 0.8,
                                'reason': f'Similar to products you viewed'
                            })
                
                # Fill remaining slots with popular products
                remaining_slots = limit - len(recommendations)
                if remaining_slots > 0:
                    # Get popular products (by rating and review count)
                    popular_products = products.order_by('-review_count')[:remaining_slots]
                    for product in popular_products:
                        recommendations.append({
                            'id': product.id,
                            'name': product.name,
                            'price': float(product.price),
                            'discount_price': float(product.discount_price) if product.discount_price else None,
                            'image': product.primary_image.file.url if product.primary_image else '/placeholder.svg',
                            'category': product.category.name if product.category else 'Unknown',
                            'brand': 'Unknown',
                            'score': 0.7,
                            'reason': 'Popular product'
                        })
                
                # If still no recommendations, get any available products
                if not recommendations:
                    available_products = products[:limit]
                    for product in available_products:
                        recommendations.append({
                            'id': product.id,
                            'name': product.name,
                            'price': float(product.price),
                            'discount_price': float(product.discount_price) if product.discount_price else None,
                            'image': product.primary_image.file.url if product.primary_image else '/placeholder.svg',
                            'category': product.category.name if product.category else 'Unknown',
                            'brand': 'Unknown',
                            'score': 0.6,
                            'reason': 'Available product'
                        })
                        
            except Exception as e:
                print(f"Error getting products: {e}")
                # Fallback to empty recommendations
                recommendations = []
            
            # Ensure we don't exceed the limit
            recommendations = recommendations[:limit]
            
            # Calculate AI confidence based on available data
            ai_confidence = 0.5  # Base confidence
            if user_id:
                ai_confidence += 0.2  # Authenticated user
            if behavior_data.get('time_spent', 0) > 30:
                ai_confidence += 0.1  # Engaged user
            if behavior_data.get('products_viewed'):
                ai_confidence += 0.1  # Has viewed products
            if behavior_data.get('scroll_depth', 0) > 50:
                ai_confidence += 0.1  # Active scroller
            
            ai_confidence = min(ai_confidence, 1.0)  # Cap at 1.0
            
            return Response({
                'recommendations': recommendations,
                'ai_confidence': ai_confidence,
                'behavior_analysis': behavior_analysis,
                'engagement_score': engagement_score
            })
            
        except Exception as e:
            print(f"Error in AI recommendations: {e}")
            # Fallback to empty response
            return Response({
                'recommendations': [],
                'ai_confidence': 0.0,
                'behavior_analysis': {
                    'engagement_level': 'low',
                    'interest_categories': [],
                    'preferred_price_range': 'medium',
                    'activity_intensity': 'low'
                },
                'engagement_score': 0
            })

    @extend_schema(
        description="Get activity-based recommendations after 30 seconds of user activity",
        parameters=[
            OpenApiParameter('session_id', str, description='Current session ID'),
            OpenApiParameter('seconds_elapsed', int, description='Seconds since session start'),
        ]
    )
    @action(detail=False, methods=['get'])
    def activity_recommendations(self, request):
        """Get recommendations based on user activity after 30 seconds"""
        
        if not self.recommendation_engine:
            return Response({'error': 'Recommendation engine not available'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        session_id = request.query_params.get('session_id')
        seconds_elapsed = int(request.query_params.get('seconds_elapsed', 0))
        
        if not session_id:
            return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            session = ChatSession.objects.get(session_id=session_id, is_active=True)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Only provide recommendations after 30 seconds
        if seconds_elapsed < 30:
            return Response({
                'status': 'monitoring',
                'seconds_elapsed': seconds_elapsed,
                'recommendations': [],
                'message': 'Continue browsing for personalized recommendations'
            })
        
        # Get activity-based recommendations
        recommendations = self.recommendation_engine.get_activity_based_recommendations(
            session.user, session, limit=4
        )
        
        # Convert to serializable format
        recommendation_data = []
        for rec in recommendations:
            product_data = {
                'id': rec.get('id'),
                'name': rec.get('name'),
                'price': float(rec.get('price')),
                'discount_price': float(rec.get('discount_price')) if rec.get('discount_price') else None,
                'category': rec.get('category'),
                'image': rec.get('image'),
                'description': rec.get('description'),
                'brand': 'Unknown',
                'score': rec.get('score', 0.0),
                'reason': rec.get('reason', ''),
                'type': rec.get('type', ''),
                'trigger': rec.get('trigger', ''),
            }
            recommendation_data.append(product_data)
        
        # Track this recommendation event
        if hasattr(session, 'user') and session.user and BehaviorTracker:
            behavior_tracker = BehaviorTracker(session)
            metrics = behavior_tracker.track_time_based_activity(session, seconds_elapsed)
        
        return Response({
            'status': 'active_recommendations',
            'seconds_elapsed': seconds_elapsed,
            'recommendations': recommendation_data,
            'session_analysis': {
                'products_viewed': session.products_viewed.count(),
                'categories_explored': session.categories_interested.count(),
                'searches_performed': len(session.search_queries) if session.search_queries else 0,
                'engagement_level': 'high' if session.behavioral_score > 50 else 'medium' if session.behavioral_score > 20 else 'low'
            },
            'timestamp': timezone.now().isoformat()
        })

    @extend_schema(
        description="Get real-time recommendations when viewing a specific product",
        parameters=[
            OpenApiParameter('product_id', int, description='ID of the product being viewed'),
            OpenApiParameter('session_id', str, description='Current session ID'),
        ]
    )
    @action(detail=False, methods=['get'])
    def realtime_recommendations(self, request):
        """Get real-time recommendations based on current product being viewed"""
        
        if not self.recommendation_engine:
            return Response({'error': 'Recommendation engine not available'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        product_id = request.query_params.get('product_id')
        session_id = request.query_params.get('session_id')
        
        if not product_id:
            return Response({'error': 'product_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            product = Product.objects.get(id=product_id, is_active=True)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get session if provided
        session = None
        if session_id:
            try:
                session = ChatSession.objects.get(session_id=session_id, is_active=True)
            except ChatSession.DoesNotExist:
                pass
        
        # Get real-time recommendations
        recommendations = self.recommendation_engine.get_real_time_recommendations(
            request.user if request.user.is_authenticated else None,
            current_product_id=product.id,
            limit=4
        )
        
        # Convert to serializable format
        recommendation_data = []
        for rec in recommendations:
            product_data = {
                'id': rec.get('id'),
                'name': rec.get('name'),
                'price': float(rec.get('price')),
                'discount_price': float(rec.get('discount_price')) if rec.get('discount_price') else None,
                'category': rec.get('category'),
                'image': rec.get('image'),
                'description': rec.get('description'),
                'brand': 'Unknown',
                'score': rec.get('score', 0.0),
                'reason': rec.get('reason', ''),
                'type': rec.get('type', ''),
                'trigger': rec.get('trigger', ''),
            }
            recommendation_data.append(product_data)
        
        # Track the product view if we have a session
        if session and request.user.is_authenticated and BehaviorTracker:
            behavior_tracker = BehaviorTracker(session)
            view_metrics = behavior_tracker.track_real_time_view(product, session)
        
        return Response({
            'status': 'real_time_recommendations',
            'viewed_product': {
                'id': product.id,
                'name': product.name,
                'category': product.category.name if product.category else None
            },
            'recommendations': recommendation_data,
            'timestamp': timezone.now().isoformat()
        })

    @extend_schema(
        description="Get user's recommendation performance metrics"
    )
    @action(detail=False, methods=['get'])
    def recommendation_metrics(self, request):
        """Get metrics on how well recommendations are performing for the user"""
        
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not BehaviorTracker:
            return Response({'error': 'Behavior tracking not available'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        
        # Create a dummy session for the behavior tracker
        latest_session = ChatSession.objects.filter(user=request.user).first()
        if not latest_session:
            return Response({'error': 'No session data available'}, status=status.HTTP_404_NOT_FOUND)
        
        behavior_tracker = BehaviorTracker(latest_session)
        metrics = behavior_tracker.get_recommendation_performance_metrics(request.user)
        
        return Response({
            'user_id': request.user.id,
            'metrics': metrics,
            'timestamp': timezone.now().isoformat()
        })

    @extend_schema(
        description="Get user's behavior profile and preferences"
    )
    @action(detail=False, methods=['get'])
    def user_profile(self, request):
        """Get user's behavior profile and preferences"""
        
        if not request.user.is_authenticated:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            profile = request.user.behavior_profile
            
            return Response({
                'user_id': request.user.id,
                'profile': {
                    'engagement_score': profile.engagement_score,
                    'confidence_level': profile.confidence_level,
                    'session_frequency': profile.session_frequency,
                    'preferred_categories': profile.preferred_categories,
                    'average_price_viewed': float(profile.average_price_viewed) if profile.average_price_viewed else None,
                    'price_sensitivity_score': profile.price_sensitivity_score,
                    'total_searches': profile.total_searches,
                    'total_product_clicks': profile.total_product_clicks,
                    'recommendation_acceptance_rate': profile.recommendation_acceptance_rate,
                    'last_updated': profile.last_updated.isoformat()
                },
                'timestamp': timezone.now().isoformat()
            })
            
        except CustomerBehaviorProfile.DoesNotExist:
            return Response({
                'user_id': request.user.id,
                'profile': None,
                'message': 'No behavior profile available yet. Start browsing to build your profile!',
                'timestamp': timezone.now().isoformat()
            })

    def _perform_enhanced_product_search(self, query: str, entities: Dict, intent: str) -> List:
        """Enhanced product search with intent-aware filtering"""
        if not Product:
            return []
        
        print(f"🔍 ENHANCED SEARCH: Query='{query}', Intent={intent}, Entities={entities}")
        
        try:
            # Start with active products
            products_query = Product.objects.filter(is_active=True, status='active')
            
            # Intent-specific search logic
            if intent == 'trending_request':
                # For trending, prioritize recent products and popular categories
                products_query = products_query.order_by('-created_at')
                print(f"🔥 TRENDING SEARCH: Ordered by creation date")
                
            elif intent == 'rating_inquiry':
                # For ratings, try to get products with reviews
                try:
                    products_query = products_query.annotate(
                        avg_rating=Avg('reviews__rating'),
                        review_count=Count('reviews')
                    ).filter(review_count__gt=0).order_by('-avg_rating', '-review_count')
                    print(f"⭐ RATING SEARCH: Ordered by ratings")
                except:
                    # Fallback: order by price (assuming higher price = better quality)
                    products_query = products_query.order_by('-price')
                    print(f"⭐ RATING SEARCH FALLBACK: Ordered by price")
                    
            elif intent == 'brand_search':
                # Brand search is handled in the filtering below
                print(f"🏷️ BRAND SEARCH: Will apply brand filters")
                
            # Brand and Category filtering logic
            brands = entities.get('brands', [])
            categories = entities.get('categories', [])
            keywords = entities.get('keywords', [])

            # If both brand and category are present, filter by both
            if brands and categories:
                brand_filter = Q()
                for brand in brands:
                    brand_filter |= Q(brand__iexact=brand)
                category_filter = Q()
                for category in categories:
                    category_filter |= Q(category__name__icontains=category)
                products_query = products_query.filter(brand_filter & category_filter)
                print(f"🏷️📂 APPLIED BRAND AND CATEGORY FILTER: brands={brands}, categories={categories}")
            # If only brand is present
            elif brands:
                brand_filter = Q()
                for brand in brands:
                    brand_filter |= Q(brand__iexact=brand)
                products_query = products_query.filter(brand_filter)
                print(f"🏷️ APPLIED BRAND FILTER: {brands}")
            # If only category is present
            elif categories:
                category_filter = Q()
                for category in categories:
                    category_filter |= Q(category__name__icontains=category)
                products_query = products_query.filter(category_filter)
                print(f"📂 APPLIED CATEGORY FILTER: {categories}")
            # If only keywords are present
            elif keywords:
                keyword_filter = Q()
                for keyword in keywords:
                    keyword_filter |= Q(name__icontains=keyword) | Q(description__icontains=keyword)
                products_query = products_query.filter(keyword_filter)
                print(f"🔤 APPLIED KEYWORD FILTER: {keywords}")

            # Price filtering
            price_range = entities.get('price_range')
            if price_range:
                min_price, max_price = price_range
                products_query = products_query.annotate(
                    effective_price=Case(
                        When(discount_price__isnull=False, then=F('discount_price')),
                        default=F('price')
                    )
                ).filter(
                    effective_price__gte=min_price,
                    effective_price__lte=max_price
                )
                print(f"💰 APPLIED PRICE FILTER: ${min_price}-${max_price}")
            
            # Color filtering
            colors = entities.get('colors', [])
            if colors:
                color_filter = Q()
                for color in colors:
                    color_filter |= (
                        Q(name__icontains=color) |
                        Q(description__icontains=color)
                    )
                products_query = products_query.filter(color_filter)
                print(f"🎨 APPLIED COLOR FILTER: {colors}")
            
            # Execute search
            products = list(products_query.distinct()[:20])
            print(f"🎯 ENHANCED SEARCH RESULTS: {len(products)} products found")
            
            return products
            
        except Exception as e:
            print(f"❌ ENHANCED SEARCH ERROR: {e}")
            return []

    def _get_enhanced_simple_recommendations(self, query: str, entities: Dict, intent: str) -> List[Dict]:
        """Enhanced fallback recommendations when AI engine is not available"""
        if not Product:
            return []
            
        try:
            print(f"🔧 USING ENHANCED SIMPLE RECOMMENDATIONS")
            
            # Get products using enhanced search
            products = self._perform_enhanced_product_search(query, entities, intent)
            
            recommendations = []
            for product in products[:8]:
                # Generate intent-specific reasons
                reason = self._generate_recommendation_reason(product, intent, entities)
                
                recommendations.append({
                    'product': product,
                    'score': 0.7,
                    'type': f'simple_{intent}',
                    'reason': reason
                })
            
            print(f"🔧 ENHANCED SIMPLE RECOMMENDATIONS: {len(recommendations)} found")
            return recommendations
            
        except Exception as e:
            print(f"❌ Enhanced simple search error: {e}")
            return []

    def _generate_recommendation_reason(self, product: Product, intent: str, entities: Dict) -> str:
        """Generate appropriate reason based on intent and entities"""
        brands = entities.get('brands', [])
        categories = entities.get('categories', [])
        price_range = entities.get('price_range')
        
        if intent == 'trending_request':
            return "🔥 Trending and popular choice"
        elif intent == 'rating_inquiry':
            return "⭐ Highly rated by customers"
        elif intent == 'brand_search' and brands:
            return f"🏷️ {brands[0].title()} product"
        elif intent == 'price_inquiry' and price_range:
            min_price, max_price = price_range
            if min_price == 0:
                return f"💰 Great value under ${max_price:.0f}"
            else:
                return f"💰 Perfect for your ${min_price:.0f}-${max_price:.0f} budget"
        elif categories:
            return f"📂 Excellent {categories[0]} option"
        else:
            return f"✨ Great match for your search"

    def _generate_enhanced_simple_response(self, query: str, recommendations: List[Dict], intent: str, entities: Dict) -> str:
        """Generate enhanced response when NLP processor is not available"""
        
        if not recommendations:
            return self._generate_no_results_response(intent, entities)
        
        # Intent-specific response generation
        if intent == 'trending_request':
            intro = f"🔥 Here are the trending products I found:"
        elif intent == 'rating_inquiry':
            intro = f"⭐ Here are our top-rated products:"
        elif intent == 'brand_search':
            brands = entities.get('brands', [])
            if brands:
                intro = f"🏷️ Here are {', '.join(brands).title()} products:"
            else:
                intro = f"🏷️ Here are some great brand products:"
        elif intent == 'price_inquiry':
            price_range = entities.get('price_range')
            if price_range:
                min_price, max_price = price_range
                if min_price == 0:
                    intro = f"💰 Here are great products under ${max_price:.0f}:"
                elif max_price >= 10000:
                    intro = f"💎 Here are premium products over ${min_price:.0f}:"
                else:
                    intro = f"💰 Here are products in your ${min_price:.0f}-${max_price:.0f} budget:"
            else:
                intro = f"💰 Here are some great value products:"
        else:
            intro = f"🔍 Here are some products I found for you:"
        
        response = intro + "\n\n"
        
        for i, rec in enumerate(recommendations[:5], 1):
            product = rec['product']
            price_info = f"${product.discount_price}" if product.discount_price else f"${product.price}"
            reason = rec.get('reason', 'Great product')
            response += f"{i}. **{product.name}** - {price_info}\n   {reason}\n\n"
        
        # Add helpful follow-up based on intent
        if intent == 'trending_request':
            response += "🔥 Want to see more trending items or check out a specific category?"
        elif intent == 'rating_inquiry':
            response += "⭐ Would you like to see reviews for any of these products?"
        elif intent == 'brand_search':
            response += "🏷️ Want to compare with other brands or see more from this brand?"
        elif intent == 'price_inquiry':
            response += "💰 Need help finding deals or want to adjust your budget?"
        else:
            response += "💬 Want more details about any of these products?"
        
        return response

    def _generate_no_results_response(self, intent: str, entities: Dict) -> str:
        """Generate helpful response when no products found"""
        brands = entities.get('brands', [])
        categories = entities.get('categories', [])
        price_range = entities.get('price_range')
        keywords = entities.get('keywords', [])
        
        response_parts = []
        
        if intent == 'trending_request':
            response_parts.append("I don't have trending data for")
        elif intent == 'rating_inquiry':
            response_parts.append("I couldn't find highly-rated products for")
        elif intent == 'brand_search':
            response_parts.append("I couldn't find products from")
        else:
            response_parts.append("I couldn't find products matching")
        
        search_parts = []
        if brands:
            search_parts.append(f"{', '.join(brands).title()}")
        if categories:
            search_parts.append(f"{', '.join(categories)} category")
        if keywords:
            search_parts.append(f"'{' '.join(keywords[:3])}'")
        if price_range:
            min_price, max_price = price_range
            if min_price == 0:
                search_parts.append(f"under ${max_price:.0f}")
            elif max_price >= 10000:
                search_parts.append(f"over ${min_price:.0f}")
            else:
                search_parts.append(f"${min_price:.0f}-${max_price:.0f} range")
        
        if search_parts:
            response_parts.append(" ".join(search_parts))
        else:
            response_parts.append("your search")
        
        response = "".join(response_parts) + ".\n\n"
        
        suggestions = [
            "Here are some suggestions:",
            "• Try different keywords or brand names",
            "• Browse our categories to discover new products",
            "• Ask about trending items in specific categories",
            "• Check out our best-rated products",
            "• Look for budget-friendly alternatives"
        ]
        
        if intent == 'brand_search':
            suggestions.append("• Ask me about similar or alternative brands")
        elif intent == 'price_inquiry':
            suggestions.append("• Consider adjusting your price range")
        
        response += "\n".join(suggestions)
        return response

    def _generate_enhanced_greeting(self, session: ChatSession) -> str:
        """Generate enhanced personalized greeting"""
        if session.user and hasattr(session.user, 'behavior_profile'):
            try:
                profile = session.user.behavior_profile
                if hasattr(profile, 'preferred_categories') and profile.preferred_categories:
                    top_category = max(profile.preferred_categories.items(), key=lambda x: x[1])[0]
                    return f"Welcome back! I see you love {top_category} products. I can help you find trending items, compare brands, check ratings, and discover amazing deals. What are you looking for today? 🛍️"
            except:
                pass

        greetings = [
            "Hello! I'm your AI shopping assistant! 🤖 I can help you:\n• Find trending products 🔥\n• Compare brands and alternatives 🏷️\n• Discover top-rated items ⭐\n• Find budget-friendly options 💰\n• Get product recommendations ✨\n\nWhat interests you most today?",
            "Hi there! Welcome to our store! 👋 I'm here to be your personal shopping guide. Whether you're looking for the latest trends, best deals, top brands, or highly-rated products, I've got you covered! How can I help you discover something amazing?",
            "Hey! Ready to find some incredible products? 🎉 I can show you what's trending, help you compare options, find the best-rated items, and discover great deals. Just tell me what you're interested in!"
        ]
        
        import random
        return random.choice(greetings)

    def _get_session_insights(self, session: ChatSession) -> Dict:
        """Enhanced session insights"""
        insights = {
            'engagement_score': getattr(session, 'behavioral_score', 0),
            'products_viewed': session.products_viewed.count() if hasattr(session, 'products_viewed') else 0,
            'categories_explored': session.categories_interested.count() if hasattr(session, 'categories_interested') else 0,
            'searches_performed': getattr(session, 'total_searches', 0),
            'total_clicks': getattr(session, 'total_clicks', 0),
            'session_type': 'discovery'  # Default
        }
        
        # Determine session type based on behavior
        if insights['searches_performed'] > 3:
            insights['session_type'] = 'research'
        elif insights['total_clicks'] > 2:
            insights['session_type'] = 'shopping'
        elif insights['categories_explored'] > 2:
            insights['session_type'] = 'browsing'
        
        # Add price range if available
        if hasattr(session, 'price_range_min') and hasattr(session, 'price_range_max'):
            insights['price_range'] = {
                'min': float(session.price_range_min) if session.price_range_min else None,
                'max': float(session.price_range_max) if session.price_range_max else None
            }
        
        return insights

    @extend_schema(
        description="Track user interaction with products and recommendations"
    )
    @action(detail=False, methods=['post'])
    def track_interaction(self, request):
        """Enhanced interaction tracking"""
        session_id = request.data.get('session_id')
        interaction_type = request.data.get('interaction_type')
        product_id = request.data.get('product_id')
        recommendation_id = request.data.get('recommendation_id')
        click_source = request.data.get('click_source', 'unknown')
        position = request.data.get('position')

        if not session_id:
            return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session = ChatSession.objects.get(session_id=session_id)
            
            # Use behavior tracker if available
            if BehaviorTracker:
                behavior_tracker = BehaviorTracker(session)

                # Track product interactions
                if product_id and Product:
                    try:
                        product = Product.objects.get(id=product_id)

                        if interaction_type == 'view':
                            behavior_tracker.track_product_view(
                                product,
                                came_from_search=(click_source == 'search'),
                                came_from_recommendation=(click_source == 'recommendation')
                            )
                        elif interaction_type == 'click':
                            behavior_tracker.track_product_click(product, click_source, position)
                        elif interaction_type == 'add_to_cart':
                            behavior_tracker.track_cart_addition(product)

                    except Product.DoesNotExist:
                        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

                # Track recommendation interactions
                if recommendation_id:
                    behavior_tracker.track_recommendation_interaction(recommendation_id, interaction_type)

            return Response({'status': 'success'})

        except ChatSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    @extend_schema(
        description="Track recommendation interaction (click, view, add to cart, etc.)"
    )
    @action(detail=False, methods=['post'])
    def track_recommendation_interaction(self, request):
        """Track user interaction with recommendations"""
        
        recommendation_id = request.data.get('recommendation_id')
        interaction_type = request.data.get('interaction_type')  # 'view', 'click', 'cart', 'purchase'
        session_id = request.data.get('session_id')
        
        if not all([recommendation_id, interaction_type]):
            return Response({
                'error': 'recommendation_id and interaction_type are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get the recommendation
            recommendation = ProductRecommendation.objects.get(id=recommendation_id)
            
            # Update recommendation tracking
            if interaction_type == 'view':
                recommendation.was_viewed = True
            elif interaction_type == 'click':
                recommendation.was_clicked = True
                recommendation.time_to_click = timezone.now() - recommendation.shown_at
            elif interaction_type == 'cart':
                recommendation.was_added_to_cart = True
            elif interaction_type == 'purchase':
                recommendation.was_purchased = True
            
            recommendation.save()
            
            # Track in behavior system if session is available
            if session_id and BehaviorTracker:
                try:
                    session = ChatSession.objects.get(session_id=session_id)
                    behavior_tracker = BehaviorTracker(session)
                    behavior_tracker.track_recommendation_interaction(recommendation_id, interaction_type)
                except ChatSession.DoesNotExist:
                    pass
            
            return Response({
                'status': 'success',
                'recommendation_id': recommendation_id,
                'interaction_type': interaction_type,
                'timestamp': timezone.now().isoformat()
            })
            
        except ProductRecommendation.DoesNotExist:
            return Response({'error': 'Recommendation not found'}, status=status.HTTP_404_NOT_FOUND)

    @extend_schema(
        description="End session and update long-term user behavior profile"
    )
    @action(detail=False, methods=['post'])
    def end_session(self, request):
        """Enhanced session ending with comprehensive behavior analysis"""
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            session = ChatSession.objects.get(session_id=session_id, is_active=True)
            
            insights = {}
            if BehaviorTracker:
                behavior_tracker = BehaviorTracker(session)
                insights = behavior_tracker.end_session_analysis()

            # Mark session as ended
            session.is_active = False
            session.ended_at = timezone.now()
            session.save()

            return Response({
                'status': 'Session ended successfully',
                'insights': insights,
                'final_score': getattr(session, 'behavioral_score', 0)
            })

        except ChatSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

    def create_new_session(self, user=None):
        """Create a new chat session with behavior tracking"""
        session = ChatSession.objects.create(
            user=user,
            session_id=str(uuid.uuid4()),
            is_active=True
        )

        # Initialize session with user's historical preferences if available
        if user and hasattr(user, 'behavior_profile'):
            try:
                profile = user.behavior_profile
                session.preferences = {
                    'favorite_categories': list(profile.preferred_categories.keys()) if hasattr(profile, 'preferred_categories') else [],
                    'price_sensitivity': getattr(profile, 'price_sensitivity_score', 0.5),
                    'engagement_level': getattr(profile, 'engagement_score', 0)
                }
                session.save()
            except:
                pass

        return session

    def update_session_preferences(self, session, entities):
        """Enhanced session preference updates with JSON safety"""
        preferences = session.preferences.copy() if session.preferences else {}

        # Update price range (convert to serializable types)
        if entities.get('price_range'):
            min_price, max_price = entities['price_range']
            preferences['price_range'] = [float(min_price), float(max_price)]
            if hasattr(session, 'price_range_min'):
                session.price_range_min = min_price
                session.price_range_max = max_price

        # Update categories (store only names, not objects)
        if entities.get('categories'):
            if 'category_mentions' not in preferences:
                preferences['category_mentions'] = {}

            for category in entities['categories']:
                if category not in preferences['category_mentions']:
                    preferences['category_mentions'][category] = 0
                preferences['category_mentions'][category] += 1

        # Update brands (store only names)
        if entities.get('brands'):
            if 'brand_preferences' not in preferences:
                preferences['brand_preferences'] = {}

            for brand in entities['brands']:
                if brand not in preferences['brand_preferences']:
                    preferences['brand_preferences'][brand] = 0
                preferences['brand_preferences'][brand] += 1

        # Update colors (store only names)
        if entities.get('colors'):
            if 'color_preferences' not in preferences:
                preferences['color_preferences'] = {}

            for color in entities['colors']:
                if color not in preferences['color_preferences']:
                    preferences['color_preferences'][color] = 0
                preferences['color_preferences'][color] += 1

        # Test JSON serialization before saving
        import json
        try:
            json.dumps(preferences)  # Test if it can be serialized
            session.preferences = preferences
            session.save()
            print(f"✅ Session preferences updated successfully")
        except TypeError as e:
            print(f"❌ Cannot serialize preferences: {e}")
            # Save only the serializable parts
            safe_preferences = {}
            for key, value in preferences.items():
                try:
                    json.dumps({key: value})
                    safe_preferences[key] = value
                except TypeError:
                    print(f"⚠️ Skipping non-serializable preference: {key}")

            session.preferences = safe_preferences
            session.save()
            print(f"✅ Session preferences updated with safe data only")

    def _get_session_context(self, session: ChatSession) -> Dict:
        """Get session context from database"""
        try:
            # Get context from session preferences
            context = session.preferences.get('context', {}) if session.preferences else {}
            
            # Ensure required keys exist
            context.setdefault('last_intent', None)
            context.setdefault('last_categories', [])
            context.setdefault('last_brands', [])
            context.setdefault('last_products_shown', 0)
            context.setdefault('shown_product_ids', [])
            context.setdefault('last_product', None)
            context.setdefault('last_product_id', None)
            
            # Do NOT load Product instance into context['last_product'] (causes serialization errors)
            # Only store product dicts or None
            if context.get('last_product') is not None and not isinstance(context['last_product'], dict):
                context['last_product'] = None
            
            print(f"📋 SESSION CONTEXT RETRIEVED: last_product={context.get('last_product_id')}, intent={context.get('last_intent')}")
            return context
            
        except Exception as e:
            print(f"❌ Error getting session context: {e}")
            return {
                'last_intent': None,
                'last_categories': [],
                'last_brands': [],
                'last_products_shown': 0,
                'shown_product_ids': [],
                'last_product': None,
                'last_product_id': None
            }

    def _update_session_context(self, session: ChatSession, intent: str, entities: Dict, recommendations: List[Dict], message: str):
        """Update session context with new information"""
        try:
            # Get current context
            context = self._get_session_context(session)
            
            # Update context
            context['last_intent'] = intent
            context['last_message'] = message
            context['last_categories'] = entities.get('categories', [])
            context['last_brands'] = entities.get('brands', [])
            context['last_products_shown'] = len(recommendations)
            
            # Update shown product IDs
            new_product_ids = [rec['id'] for rec in recommendations]
            context['shown_product_ids'] = list(set(context.get('shown_product_ids', []) + new_product_ids))
            
            # Keep only last 50 shown products to prevent memory issues
            if len(context['shown_product_ids']) > 50:
                context['shown_product_ids'] = context['shown_product_ids'][-50:]
        
            # Set last product (first recommendation)
            if recommendations:
                context['last_product_id'] = recommendations[0]['id']
                context['last_product'] = recommendations[0]  # Store the whole product dict, not ['product']

            # Store last recommendations for follow-up/comparison
            context['last_recommendations'] = recommendations
        
            # Update session preferences with context (without the product object)
            if not session.preferences:
                session.preferences = {}
        
            # Create context copy without product object for storage
            context_to_save = context.copy()
            if 'last_product' in context_to_save:
                del context_to_save['last_product']
        
            session.preferences['context'] = context_to_save
            session.save()
        
            print(f"💾 CONTEXT UPDATED: last_product_id={context.get('last_product_id')}, intent={intent}")
        
        except Exception as e:
            print(f"❌ Error updating session context: {e}")
            import traceback
            traceback.print_exc()

    def _calculate_personalization_score(self, user):
        """Calculate personalization score based on user data"""
        if not user or not user.is_authenticated:
            return 0.0
        
        try:
            profile = user.behavior_profile
            score = 0.0
            
            # Base score from confidence level
            score += profile.confidence_level * 0.4
            
            # Engagement score contribution
            score += min(profile.engagement_score / 100, 1.0) * 0.3
            
            # Session frequency contribution
            frequency_score = 0.0
            if profile.session_frequency == 'frequent':
                frequency_score = 1.0
            elif profile.session_frequency == 'regular':
                frequency_score = 0.7
            elif profile.session_frequency == 'occasional':
                frequency_score = 0.3
            score += frequency_score * 0.2
            
            # Preference strength contribution
            if profile.preferred_categories:
                score += 0.1
            
            return min(score, 1.0)
        except:
            return 0.0


class BehaviorAnalyticsViewSet(viewsets.GenericViewSet):
    """Enhanced analytics and insights for user behavior"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = UserBehaviorProfileSerializer

    @action(detail=False, methods=['get'])
    def user_journey(self, request):
        """Get comprehensive user journey analysis"""
        try:
            from .behavior_tracker import BehaviorAnalyzer
            journey = BehaviorAnalyzer.analyze_user_journey(request.user)
            return Response(journey)
        except ImportError:
            return Response({'error': 'Behavior analytics not available'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    @action(detail=False, methods=['get'])
    def similar_users(self, request):
        """Find users with similar behavior patterns"""
        try:
            from .behavior_tracker import BehaviorAnalyzer
            similar_users = BehaviorAnalyzer.get_similar_users(request.user)
            user_data = [{'id': user.id, 'username': user.username} for user in similar_users]
            return Response({'similar_users': user_data})
        except ImportError:
            return Response({'error': 'Behavior analytics not available'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    @action(detail=False, methods=['get'])
    def daily_analytics(self, request):
        """Get daily behavior analytics"""
        try:
            from .behavior_tracker import BehaviorAnalyzer
            analytics = BehaviorAnalyzer.generate_daily_analytics()
            return Response({
                'date': analytics.date,
                'total_sessions': analytics.total_sessions,
                'total_searches': analytics.total_searches,
                'total_clicks': analytics.total_clicks,
                'search_to_click_ratio': analytics.search_to_click_ratio,
                'top_keywords': analytics.top_search_keywords
            })
        except ImportError:
            return Response({'error': 'Behavior analytics not available'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    @action(detail=False, methods=['get'])
    def trending_insights(self, request):
        """Get insights about trending products and searches"""
        try:
            # Get recent search patterns
            recent_searches = SearchQuery.objects.filter(
                query_timestamp__gte=timezone.now() - timedelta(days=7)
            ).values_list('extracted_keywords', flat=True)
            
            # Flatten and count keywords
            all_keywords = []
            for keywords in recent_searches:
                if keywords:
                    all_keywords.extend(keywords)
            
            from collections import Counter
            trending_keywords = Counter(all_keywords).most_common(10)
            
            # Get popular categories
            popular_categories = ChatSession.objects.filter(
                started_at__gte=timezone.now() - timedelta(days=7)
            ).values(
                'categories_interested__name'
            ).annotate(
                count=Count('categories_interested__name')
            ).order_by('-count')[:10]
            
            return Response({
                'trending_keywords': [{'keyword': k, 'count': c} for k, c in trending_keywords],
                'popular_categories': list(popular_categories),
                'period': '7_days'
            })
        except Exception as e:
            return Response({'error': f'Analytics error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
