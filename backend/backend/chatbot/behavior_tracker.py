from django.utils import timezone
from django.db.models import Count, Avg, Sum, Q, F, Case, When
from datetime import timedelta
import json
from typing import Dict, List, Optional, Tuple
from collections import Counter, defaultdict
import random
import numpy as np
from sklearn.cluster import KMeans
from sentence_transformers import SentenceTransformer

from .models import (
    ChatSession, SessionProductView, SessionProductClick, SearchQuery,
    CustomerBehaviorProfile, BehaviorAnalytics, ProductRecommendation
)
from products.models import Product, Category
from analytics.models import UserActivity


class PersonalizedRecommendationEngine:
    """Enhanced recommendation engine for personalized product suggestions"""
    
    def __init__(self):
        self.recommendation_weights = {
            'browsing_history': 0.25,
            'search_patterns': 0.20,
            'brand_affinity': 0.15,
            'category_preferences': 0.20,
            'price_behavior': 0.10,
            'time_based': 0.10
        }
    
    def get_login_recommendations(self, user, limit: int = 6) -> List[Dict]:
        """Get personalized recommendations when user logs in"""
        print(f"🎯 GENERATING LOGIN RECOMMENDATIONS for user: {user.username if user and hasattr(user, 'username') else 'Anonymous'}")
        
        if not user or not hasattr(user, 'is_authenticated') or not user.is_authenticated:
            return self._get_trending_recommendations(limit)
        
        try:
            # Get or create behavior profile
            profile, created = CustomerBehaviorProfile.objects.get_or_create(user=user)
            
            if created or profile.confidence_level < 0.3:
                # New user or insufficient data - show trending/popular items
                print(f"👤 NEW USER - Showing trending recommendations")
                return self._get_trending_recommendations(limit)
            
            # Generate personalized recommendations based on behavior
            recommendations = []
            
            # 1. Based on favorite categories (40% of recommendations)
            category_recs = self._get_category_based_recommendations(profile, limit=int(limit * 0.4))
            recommendations.extend(category_recs)
            
            # 2. Based on brand preferences (30% of recommendations)
            brand_recs = self._get_brand_based_recommendations(profile, limit=int(limit * 0.3))
            recommendations.extend(brand_recs)
            
            # 3. Based on price behavior (20% of recommendations)
            price_recs = self._get_price_based_recommendations(profile, limit=int(limit * 0.2))
            recommendations.extend(price_recs)
            
            # 4. Trending items in user's categories (10% of recommendations)
            trending_recs = self._get_personalized_trending(profile, limit=max(1, int(limit * 0.1)))
            recommendations.extend(trending_recs)
            
            # Remove duplicates and limit results
            unique_recommendations = self._remove_duplicates(recommendations)
            
            print(f"🎯 LOGIN RECOMMENDATIONS: {len(unique_recommendations)} personalized items")
            return unique_recommendations[:limit]
            
        except Exception as e:
            print(f"❌ Error generating login recommendations: {e}")
            return self._get_trending_recommendations(limit)
    
    def get_activity_based_recommendations(self, user, session: ChatSession, limit: int = 4) -> List[Dict]:
        """Get recommendations based on current session activity (after 30 seconds)"""
        print(f"⏰ GENERATING ACTIVITY-BASED RECOMMENDATIONS for session: {session.session_id}")
        
        try:
            # Analyze current session behavior
            session_analysis = self._analyze_current_session(session)
            
            recommendations = []
            
            # 1. Based on products viewed in current session
            if session.products_viewed.exists():
                similar_recs = self._get_similar_to_viewed(session, limit=int(limit * 0.5))
                recommendations.extend(similar_recs)
            
            # 2. Based on search queries in current session
            if session.search_queries:
                search_recs = self._get_search_based_recommendations(session, limit=int(limit * 0.3))
                recommendations.extend(search_recs)
            
            # 3. Based on categories explored
            if session.categories_interested.exists():
                category_recs = self._get_session_category_recommendations(session, limit=int(limit * 0.2))
                recommendations.extend(category_recs)
            
            # 4. Complementary products (what goes well with viewed items)
            if session.products_viewed.exists():
                complementary_recs = self._get_complementary_recommendations(session, limit=max(1, limit - len(recommendations)))
                recommendations.extend(complementary_recs)
            
            # If no session activity, fall back to user profile
            if not recommendations and user and user.is_authenticated:
                return self.get_login_recommendations(user, limit)
            elif not recommendations:
                return self._get_trending_recommendations(limit)
            
            unique_recommendations = self._remove_duplicates(recommendations)
            print(f"⏰ ACTIVITY RECOMMENDATIONS: {len(unique_recommendations)} items based on session")
            return unique_recommendations[:limit]
            
        except Exception as e:
            print(f"❌ Error generating activity recommendations: {e}")
            return self._get_trending_recommendations(limit)
    
    def get_real_time_recommendations(self, user, current_product_id: int = None, limit: int = 4) -> List[Dict]:
        """Get real-time recommendations based on current product being viewed"""
        print(f"🔄 GENERATING REAL-TIME RECOMMENDATIONS")
        
        try:
            if current_product_id:
                current_product = Product.objects.get(id=current_product_id, is_active=True)
                
                # Get similar products
                similar_products = self._get_products_in_same_category(current_product, limit=limit)
                
                recommendations = []
                for product in similar_products:
                    recommendations.append({
                        'product': product,
                        'score': 0.8,
                        'type': 'behavior',
                        'reason': f"🔗 Similar to {current_product.name}",
                        'trigger': 'real_time_view',
                        'recommendation_type': 'behavior'
                    })
                
                return recommendations
            
            # Fallback to activity-based recommendations
            if user and user.is_authenticated:
                latest_session = ChatSession.objects.filter(user=user, is_active=True).first()
                if latest_session:
                    return self.get_activity_based_recommendations(user, latest_session, limit)
            
            return self._get_trending_recommendations(limit)
            
        except Exception as e:
            print(f"❌ Error generating real-time recommendations: {e}")
            return self._get_trending_recommendations(limit)
    
    def _get_category_based_recommendations(self, profile: CustomerBehaviorProfile, limit: int) -> List[Dict]:
        """Get recommendations based on user's favorite categories"""
        recommendations = []
        
        if not profile.preferred_categories:
            return recommendations
        
        # Sort categories by preference score
        sorted_categories = sorted(profile.preferred_categories.items(), key=lambda x: x[1], reverse=True)
        
        for category_name, score in sorted_categories[:3]:  # Top 3 categories
            try:
                category = Category.objects.get(name__icontains=category_name)
                products = Product.objects.filter(
                    category=category,
                    is_active=True,
                    status='active'
                ).order_by('-created_at')[:limit//3 + 1]
                
                for product in products:
                    recommendations.append({
                        'product': product,
                        'score': 0.7 + (score * 0.1),  # Base score + preference bonus
                        'type': 'behavior',
                        'reason': f"📂 Based on your interest in {category_name}",
                        'trigger': 'login_personalized',
                        'recommendation_type': 'behavior'
                    })
                    
            except Category.DoesNotExist:
                continue
        
        return recommendations
    
    def _get_brand_based_recommendations(self, profile: CustomerBehaviorProfile, limit: int) -> List[Dict]:
        """Get recommendations based on user's brand preferences"""
        recommendations = []
        
        # Analyze user's brand preferences from search history
        user_sessions = ChatSession.objects.filter(user=profile.user)
        brand_mentions = defaultdict(int)
        
        for session in user_sessions:
            if session.preferences and 'brand_preferences' in session.preferences:
                for brand, count in session.preferences['brand_preferences'].items():
                    brand_mentions[brand] += count
        
        # Get products from preferred brands
        for brand, count in sorted(brand_mentions.items(), key=lambda x: x[1], reverse=True)[:3]:
            products = Product.objects.filter(
                Q(name__icontains=brand) | Q(description__icontains=brand),
                is_active=True,
                status='active'
            ).order_by('-created_at')[:limit//3 + 1]
            
            for product in products:
                recommendations.append({
                    'product': product,
                    'score': 0.75,
                    'type': 'behavior',
                    'reason': f"🏷️ {brand.title()} - your preferred brand",
                    'trigger': 'login_personalized',
                    'recommendation_type': 'behavior'
                })
        
        return recommendations
    
    def _get_price_based_recommendations(self, profile: CustomerBehaviorProfile, limit: int) -> List[Dict]:
        """Get recommendations based on user's price behavior"""
        recommendations = []
        
        if not profile.average_price_viewed:
            return recommendations
        
        avg_price = float(profile.average_price_viewed)
        price_range_min = avg_price * 0.7  # 30% below average
        price_range_max = avg_price * 1.3  # 30% above average
        
        products = Product.objects.filter(
            is_active=True,
            status='active'
        ).annotate(
            effective_price=Case(
                When(discount_price__isnull=False, then=F('discount_price')),
                default=F('price')
            )
        ).filter(
            effective_price__gte=price_range_min,
            effective_price__lte=price_range_max
        ).order_by('?')[:limit]  # Random selection within price range
        
        for product in products:
            recommendations.append({
                'product': product,
                'score': 0.65,
                'type': 'behavior',
                'reason': f"💰 Perfect for your ${avg_price:.0f} budget range",
                'trigger': 'login_personalized',
                'recommendation_type': 'behavior'
            })
        
        return recommendations
    
    def _get_personalized_trending(self, profile: CustomerBehaviorProfile, limit: int) -> List[Dict]:
        """Get trending items in user's preferred categories"""
        recommendations = []
        
        if not profile.preferred_categories:
            return self._get_trending_recommendations(limit)
        
        # Get trending products in user's favorite categories
        favorite_categories = list(profile.preferred_categories.keys())[:2]  # Top 2 categories
        
        for category_name in favorite_categories:
            try:
                category = Category.objects.get(name__icontains=category_name)
                trending_products = Product.objects.filter(
                    category=category,
                    is_active=True,
                    status='active',
                    created_at__gte=timezone.now() - timedelta(days=30)  # Recent products
                ).order_by('-created_at')[:limit//2 + 1]
                
                for product in trending_products:
                    recommendations.append({
                        'product': product,
                        'score': 0.8,
                        'type': 'behavior',
                        'reason': f"🔥 Trending in {category_name} - your favorite category",
                        'trigger': 'login_personalized',
                        'recommendation_type': 'behavior'
                    })
                    
            except Category.DoesNotExist:
                continue
        
        return recommendations
    
    def _get_similar_to_viewed(self, session: ChatSession, limit: int) -> List[Dict]:
        """Get products similar to what user viewed in current session"""
        recommendations = []
        
        viewed_products = session.products_viewed.all()[:3]  # Last 3 viewed products
        
        for viewed_product in viewed_products:
            similar_products = self._get_products_in_same_category(viewed_product, limit=2)
            
            for product in similar_products:
                recommendations.append({
                    'product': product,
                    'score': 0.75,
                    'type': 'behavior',
                    'reason': f"🔗 Similar to {viewed_product.name}",
                    'trigger': 'activity_based',
                    'recommendation_type': 'behavior'
                })
        
        return recommendations
    
    def _get_search_based_recommendations(self, session: ChatSession, limit: int) -> List[Dict]:
        """Get recommendations based on current session searches"""
        recommendations = []
        
        if not session.search_queries:
            return recommendations
        
        # Analyze recent search queries
        recent_searches = session.search_queries[-3:]  # Last 3 searches
        all_keywords = []
        
        for search_data in recent_searches:
            query = search_data['query'].lower()
            words = [word for word in query.split() if len(word) > 2]
            all_keywords.extend(words)
        
        # Find products matching search keywords
        if all_keywords:
            keyword_filter = Q()
            for keyword in set(all_keywords):  # Remove duplicates
                keyword_filter |= (
                    Q(name__icontains=keyword) |
                    Q(description__icontains=keyword)
                )
            
            products = Product.objects.filter(
                keyword_filter,
                is_active=True,
                status='active'
            ).distinct()[:limit]
            
            for product in products:
                recommendations.append({
                    'product': product,
                    'score': 0.7,
                    'type': 'behavior',
                    'reason': f"🔍 Matches your recent searches",
                    'trigger': 'activity_based',
                    'recommendation_type': 'behavior'
                })
        
        return recommendations
    
    def _get_session_category_recommendations(self, session: ChatSession, limit: int) -> List[Dict]:
        """Get recommendations from categories explored in current session"""
        recommendations = []
        
        categories = session.categories_interested.all()[:2]  # Top 2 categories from session
        
        for category in categories:
            products = Product.objects.filter(
                category=category,
                is_active=True,
                status='active'
            ).exclude(
                id__in=session.products_viewed.values_list('id', flat=True)  # Exclude already viewed
            ).order_by('?')[:limit//2 + 1]  # Random selection
            
            for product in products:
                recommendations.append({
                    'product': product,
                    'score': 0.65,
                    'type': 'behavior',
                    'reason': f"📂 More {category.name} products you might like",
                    'trigger': 'activity_based',
                    'recommendation_type': 'behavior'
                })
        
        return recommendations
    
    def _get_complementary_recommendations(self, session: ChatSession, limit: int) -> List[Dict]:
        """Get products that complement what user has viewed"""
        recommendations = []
        
        viewed_products = session.products_viewed.all()
        
        # Simple complementary logic based on categories
        complementary_categories = {
            'electronics': ['accessories', 'cases', 'chargers'],
            'clothing': ['shoes', 'accessories', 'bags'],
            'shoes': ['clothing', 'accessories', 'socks'],
            'home': ['decor', 'kitchen', 'furniture'],
            'sports': ['fitness', 'outdoor', 'accessories']
        }
        
        for product in viewed_products:
            if product.category:
                category_name = product.category.name.lower()
                
                # Find complementary categories
                for main_cat, comp_cats in complementary_categories.items():
                    if main_cat in category_name:
                        for comp_cat in comp_cats:
                            comp_products = Product.objects.filter(
                                Q(category__name__icontains=comp_cat) |
                                Q(name__icontains=comp_cat),
                                is_active=True,
                                status='active'
                            )[:2]
                            
                            for comp_product in comp_products:
                                recommendations.append({
                                    'product': comp_product,
                                    'score': 0.6,
                                    'type': 'behavior',
                                    'reason': f"✨ Goes well with {product.name}",
                                    'trigger': 'activity_based',
                                    'recommendation_type': 'behavior'
                                })
                        break
        
        return recommendations
    
    def _get_products_in_same_category(self, product: Product, limit: int) -> List[Product]:
        """Get products in the same category as the given product"""
        if not product.category:
            return []
        
        return list(Product.objects.filter(
            category=product.category,
            is_active=True,
            status='active'
        ).exclude(id=product.id).order_by('?')[:limit])
    
    def _get_trending_recommendations(self, limit: int) -> List[Dict]:
        """Get trending/popular recommendations for new users"""
        recommendations = []
        
        # Get recently created products (trending)
        trending_products = Product.objects.filter(
            is_active=True,
            status='active',
            created_at__gte=timezone.now() - timedelta(days=30)
        ).order_by('-created_at')[:limit]
        
        for product in trending_products:
            recommendations.append({
                'product': product,
                'score': 0.6,
                'type': 'behavior',
                'reason': "🔥 Trending now - Popular choice!",
                'trigger': 'default_trending',
                'recommendation_type': 'behavior'
            })
        
        # If not enough trending products, add popular categories
        if len(recommendations) < limit:
            popular_products = Product.objects.filter(
                is_active=True,
                status='active'
            ).order_by('?')[:limit - len(recommendations)]
            
            for product in popular_products:
                recommendations.append({
                    'product': product,
                    'score': 0.5,
                    'type': 'behavior',
                    'reason': "⭐ Popular choice",
                    'trigger': 'default_popular',
                    'recommendation_type': 'behavior'
                })
        
        return recommendations
    
    def _analyze_current_session(self, session: ChatSession) -> Dict:
        """Analyze current session behavior patterns"""
        analysis = {
            'products_viewed': session.products_viewed.count(),
            'categories_explored': session.categories_interested.count(),
            'searches_performed': len(session.search_queries) if session.search_queries else 0,
            'clicks_made': session.total_clicks,
            'engagement_level': 'low'
        }
        
        # Determine engagement level
        engagement_score = (
            analysis['products_viewed'] * 2 +
            analysis['categories_explored'] * 1.5 +
            analysis['searches_performed'] * 3 +
            analysis['clicks_made'] * 2
        )
        
        if engagement_score >= 15:
            analysis['engagement_level'] = 'high'
        elif engagement_score >= 8:
            analysis['engagement_level'] = 'medium'
        
        return analysis
    
    def _remove_duplicates(self, recommendations: List[Dict]) -> List[Dict]:
        """Remove duplicate products from recommendations"""
        seen_products = set()
        unique_recommendations = []
        
        for rec in recommendations:
            product_id = rec['product'].id
            if product_id not in seen_products:
                seen_products.add(product_id)
                unique_recommendations.append(rec)
        
        # Sort by score (highest first)
        unique_recommendations.sort(key=lambda x: x['score'], reverse=True)
        return unique_recommendations


class AIBehaviorTracker:
    """AI-powered behavior tracker for user actions and personalization"""
    def __init__(self, session: ChatSession):
        self.session = session
        self.user = session.user
        self.sentence_encoder = SentenceTransformer('all-MiniLM-L6-v2')

    def track_product_view(self, product: Product):
        """Track when a user views a product and update profile"""
        view, _ = SessionProductView.objects.get_or_create(session=self.session, product=product)
        self.session.products_viewed.add(product)
        self._update_user_profile(product, action='view')
        return view

    def track_product_click(self, product: Product):
        """Track when a user clicks a product and update profile"""
        click = SessionProductClick.objects.create(session=self.session, product=product)
        self.session.products_clicked.add(product)
        self._update_user_profile(product, action='click')
        return click

    def track_purchase(self, products: List[Product]):
        """Track when products are purchased and update profile"""
        for product in products:
            self._update_user_profile(product, action='purchase')

    def track_search_query(self, query: str, intent: str, entities: Dict):
        """Track a search query and update user profile with semantic info"""
        # Optionally, store embeddings for advanced analytics
        embedding = self.sentence_encoder.encode(query)
        # You can store this embedding in a vector DB or user profile for clustering
        self._update_user_profile_from_query(query, intent, entities, embedding)

    def _update_user_profile(self, product: Product, action: str):
        """Update user profile based on product interaction"""
        if not self.user or not hasattr(self.user, 'is_authenticated') or not self.user.is_authenticated:
            return
        profile, _ = CustomerBehaviorProfile.objects.get_or_create(user=self.user)
        # Update preferred categories
        if product.category:
            cats = profile.preferred_categories or {}
            cats[product.category.name] = cats.get(product.category.name, 0) + 1
            profile.preferred_categories = cats
        # Update price behavior
        if product.price:
            if not profile.average_price_viewed:
                profile.average_price_viewed = float(product.price)
            else:
                profile.average_price_viewed = (profile.average_price_viewed + float(product.price)) / 2
        # Update engagement score
        profile.engagement_score = (profile.engagement_score or 0) + (2 if action == 'click' else 1)
        profile.save()

    def _update_user_profile_from_query(self, query: str, intent: str, entities: Dict, embedding: np.ndarray):
        """Update user profile from search query and semantic info"""
        if not self.user or not hasattr(self.user, 'is_authenticated') or not self.user.is_authenticated:
            return
        profile, _ = CustomerBehaviorProfile.objects.get_or_create(user=self.user)
        # Update brand/category/keyword preferences
        if entities.get('brands'):
            brands = profile.brand_preferences or {}
            for brand in entities['brands']:
                brands[brand] = brands.get(brand, 0) + 1
            profile.brand_preferences = brands
        if entities.get('categories'):
            cats = profile.preferred_categories or {}
            for cat in entities['categories']:
                cats[cat] = cats.get(cat, 0) + 1
            profile.preferred_categories = cats
        # Optionally, store or update embeddings for clustering
        # (Not persisted here, but you can extend for vector DB)
        profile.save()

    def cluster_users(self, n_clusters=5):
        """Cluster users based on their profile embeddings for personalization"""
        profiles = CustomerBehaviorProfile.objects.exclude(average_price_viewed=None)
        X = []
        for profile in profiles:
            # Simple feature vector: [avg_price, engagement_score, ...]
            X.append([
                profile.average_price_viewed or 0,
                profile.engagement_score or 0,
                len(profile.preferred_categories or {}),
                len(profile.brand_preferences or {})
            ])
        if len(X) < n_clusters:
            return None
        kmeans = KMeans(n_clusters=n_clusters, random_state=42).fit(X)
        return kmeans.labels_

    def get_real_time_recommendation_feedback(self, product: Product, action: str):
        """Provide real-time feedback to the AI recommender based on user action"""
        # This can be used to trigger online learning or update user embeddings
        print(f"[AIBehaviorTracker] User {self.user.id if self.user else 'anon'} {action} product {product.id}")

    def get_user_profile_summary(self) -> Dict:
        """Return a summary of the user's AI profile for analytics"""
        if not self.user or not hasattr(self.user, 'is_authenticated') or not self.user.is_authenticated:
            return {}
        profile, _ = CustomerBehaviorProfile.objects.get_or_create(user=self.user)
        return {
            'preferred_categories': profile.preferred_categories,
            'brand_preferences': profile.brand_preferences,
            'average_price_viewed': profile.average_price_viewed,
            'engagement_score': profile.engagement_score
        }


class BehaviorTracker:
    """Comprehensive behavior tracking and analysis"""
    
    def __init__(self, session: ChatSession):
        self.session = session
        self.user = session.user
        self.recommendation_engine = PersonalizedRecommendationEngine()
    
    def track_product_view(self, product: Product, came_from_search=False, came_from_recommendation=False):
        """Track when a user views a product"""
        view, created = SessionProductView.objects.get_or_create(
            session=self.session,
            product=product,
            defaults={
                'came_from_search': came_from_search,
                'came_from_recommendation': came_from_recommendation
            }
        )
        
        if not created:
            # Update the existing view
            view.came_from_search = view.came_from_search or came_from_search
            view.came_from_recommendation = view.came_from_recommendation or came_from_recommendation
            view.save()
        
        # Add to session's viewed products
        self.session.products_viewed.add(product)
        
        # Track category interest
        if product.category:
            self.session.categories_interested.add(product.category)
        
        # Update price interest
        self._update_price_interest(product.price)
        
        # Create analytics entry
        if self.user:
            UserActivity.objects.create(
                user=self.user,
                session_id=self.session.session_id,
                activity_type='view',
                product=product,
                category=product.category
            )
        
        return view
    
    def track_product_click(self, product: Product, click_source: str, position: int = None):
        """Track when a user clicks on a product"""
        if position is None:
            position = 0
        click = SessionProductClick.objects.create(
            session=self.session,
            product=product,
            click_source=click_source,
            click_position=position
        )
        
        # Add to session's clicked products
        self.session.products_clicked.add(product)
        self.session.total_clicks += 1
        self.session.save(update_fields=['total_clicks'])
        
        # Also track as a view if not already viewed
        self.track_product_view(product, 
                               came_from_search=(click_source == 'search_result'),
                               came_from_recommendation=(click_source == 'recommendation'))
        
        # Create analytics entry
        if self.user:
            UserActivity.objects.create(
                user=self.user,
                session_id=self.session.session_id,
                activity_type='add_to_cart',  # Clicks often lead to cart additions
                product=product,
                category=product.category
            )
        
        return click
    
    def track_search_query(self, query: str, query_type: str = 'text_search', 
                          filters: Dict = None) -> SearchQuery:
        """Track a search query with detailed analysis"""
        if filters is None:
            filters = {}
        # Add to session's search queries
        self.session.add_search_query(query)
        
        # Truncate values to fit database constraints
        query_text = query[:500] if len(query) > 500 else query  # Assuming query_text is TextField
        query_type = query_type[:100] if len(query_type) > 100 else query_type
        
        # Create detailed search record with proper field length handling
        try:
            # Truncate query_type to fit database field (assuming 100 char limit)
            safe_query_type = query_type[:50] if len(query_type) > 50 else query_type
            
            search = SearchQuery.objects.create(
                session=self.session,
                user=self.user,
                query_text=query_text,
                query_type=safe_query_type
            )
        except Exception as e:
            print(f"Error creating SearchQuery: {e}")
            # Create a minimal search record with safe defaults
            search = SearchQuery.objects.create(
                session=self.session,
                user=self.user,
                query_text=query[:200],  # Truncate query text too
                query_type='search'  # Use simple default
            )
        
        # Apply filters if provided
        if filters:
            search.price_filter_min = filters.get('price_min')
            search.price_filter_max = filters.get('price_max')
            search.category_filters = filters.get('categories', [])
            search.brand_filters = filters.get('brands', [])
            search.save()
        
        # Analyze the query
        self._analyze_search_query(search)
        
        # Create analytics entry
        if self.user:
            UserActivity.objects.create(
                user=self.user,
                session_id=self.session.session_id,
                activity_type='search',
                search_query=query
            )
        
        return search
    
    def track_search_results(self, search: SearchQuery, results: List[Product], 
                           clicked_positions: List[int] = None):
        """Track search results and user interactions"""
        if clicked_positions is None:
            clicked_positions = []
        search.results_count = len(results)
        
        if clicked_positions:
            search.results_clicked = len(clicked_positions)
            search.first_click_position = min(clicked_positions) if clicked_positions else None
        
        search.save()
        
        # Update session search patterns
        self._update_search_patterns(search, results)
    
    def track_cart_addition(self, product: Product):
        """Track when a product is added to cart"""
        # Update any existing clicks for this product
        clicks = SessionProductClick.objects.filter(
            session=self.session,
            product=product
        )
        clicks.update(added_to_cart=True)
        
        # Create analytics entry
        if self.user:
            UserActivity.objects.create(
                user=self.user,
                session_id=self.session.session_id,
                activity_type='add_to_cart',
                product=product,
                category=product.category
            )
    
    def track_purchase(self, products: List[Product]):
        """Track when products are purchased"""
        for product in products:
            # Update clicks and recommendations
            SessionProductClick.objects.filter(
                session=self.session,
                product=product
            ).update(added_to_cart=True)
            
            # Create analytics entry
            if self.user:
                UserActivity.objects.create(
                    user=self.user,
                    session_id=self.session.session_id,
                    activity_type='purchase',
                    product=product,
                    category=product.category
                )
    
    def track_recommendation_interaction(self, recommendation_id: int, 
                                       interaction_type: str):
        """Track user interaction with recommendations"""
        from .models import ProductRecommendation
        
        try:
            rec = ProductRecommendation.objects.get(id=recommendation_id)
            
            if interaction_type == 'view':
                rec.was_viewed = True
            elif interaction_type == 'click':
                rec.was_clicked = True
                rec.time_to_click = timezone.now() - rec.shown_at
                # Also track as a product click
                self.track_product_click(rec.product, 'recommendation', rec.position_in_list)
            elif interaction_type == 'cart':
                rec.was_added_to_cart = True
                self.track_cart_addition(rec.product)
            elif interaction_type == 'purchase':
                rec.was_purchased = True
            
            rec.save()
            
        except ProductRecommendation.DoesNotExist:
            pass
    
    def track_message_response_time(self, user_message_id: int, bot_message_id: int):
        """Track how quickly user responds to bot messages"""
        from .models import ChatMessage
        
        try:
            user_msg = ChatMessage.objects.get(id=user_message_id)
            bot_msg = ChatMessage.objects.get(id=bot_message_id)
            
            response_time = user_msg.timestamp - bot_msg.timestamp
            bot_msg.user_responded = True
            bot_msg.response_time = response_time
            bot_msg.save()
            
        except ChatMessage.DoesNotExist:
            pass
    
    def track_login_activity(self, user) -> Dict:
        """Track user login and generate initial recommendations"""
        print(f"🔑 TRACKING LOGIN ACTIVITY for user: {user.username}")
        
        try:
            # Update user's last login behavior
            profile, created = CustomerBehaviorProfile.objects.get_or_create(user=user)
            
            # Update login patterns
            current_hour = timezone.now().hour
            if not profile.preferred_shopping_times:
                profile.preferred_shopping_times = {}
            
            hour_key = str(current_hour)
            if hour_key not in profile.preferred_shopping_times:
                profile.preferred_shopping_times[hour_key] = 0
            profile.preferred_shopping_times[hour_key] += 1
            
            # Update session frequency
            recent_sessions = ChatSession.objects.filter(
                user=user,
                started_at__gte=timezone.now() - timedelta(days=7)
            ).count()
            
            if recent_sessions >= 5:
                profile.session_frequency = 'frequent'
            elif recent_sessions >= 2:
                profile.session_frequency = 'regular'
            else:
                profile.session_frequency = 'occasional'
            
            profile.save()
            
            # Generate login recommendations
            recommendations = self.recommendation_engine.get_login_recommendations(user, limit=6)
            
            return {
                'status': 'success',
                'user_type': 'new_user' if created else 'returning_user',
                'session_frequency': profile.session_frequency,
                'recommendations': recommendations,
                'confidence_level': profile.confidence_level
            }
            
        except Exception as e:
            print(f"❌ Error tracking login activity: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'recommendations': []
            }
    
    def track_time_based_activity(self, session: ChatSession, seconds_elapsed: int) -> Dict:
        """Track time-based activity and generate recommendations after 30 seconds"""
        print(f"⏰ TRACKING TIME-BASED ACTIVITY: {seconds_elapsed} seconds elapsed")
        
        try:
            if seconds_elapsed >= 30:
                # User has been active for 30+ seconds, generate activity-based recommendations
                recommendations = self.recommendation_engine.get_activity_based_recommendations(
                    session.user, session, limit=4
                )
                
                # Update session engagement
                session.behavioral_score += 5  # Bonus for staying engaged
                session.save()
                
                return {
                    'status': 'active_recommendations',
                    'trigger': 'time_based',
                    'seconds_elapsed': seconds_elapsed,
                    'recommendations': recommendations,
                    'engagement_bonus': 5
                }
            
            return {
                'status': 'monitoring',
                'seconds_elapsed': seconds_elapsed,
                'recommendations': []
            }
            
        except Exception as e:
            print(f"❌ Error tracking time-based activity: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'recommendations': []
            }
    
    def track_real_time_view(self, product: Product, session: ChatSession) -> Dict:
        """Track real-time product view and generate instant recommendations"""
        print(f"👁️ TRACKING REAL-TIME VIEW: {product.name}")
        
        try:
            # Track the view
            self.track_product_view(product, came_from_recommendation=True)
            
            # Generate real-time recommendations
            recommendations = self.recommendation_engine.get_real_time_recommendations(
                session.user, current_product_id=product.id, limit=4
            )
            
            return {
                'status': 'real_time_recommendations',
                'trigger': 'product_view',
                'viewed_product': {
                    'id': product.id,
                    'name': product.name,
                    'category': product.category.name if product.category else None
                },
                'recommendations': recommendations
            }
            
        except Exception as e:
            print(f"❌ Error tracking real-time view: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'recommendations': []
            }
    
    def get_recommendation_performance_metrics(self, user) -> Dict:
        """Get metrics on how well recommendations are performing for a user"""
        try:
            user_recommendations = ProductRecommendation.objects.filter(
                session__user=user,
                shown_at__gte=timezone.now() - timedelta(days=30)
            )
            
            total_shown = user_recommendations.count()
            total_clicked = user_recommendations.filter(was_clicked=True).count()
            total_cart = user_recommendations.filter(was_added_to_cart=True).count()
            total_purchased = user_recommendations.filter(was_purchased=True).count()
            
            metrics = {
                'total_recommendations_shown': total_shown,
                'click_rate': (total_clicked / total_shown * 100) if total_shown > 0 else 0,
                'cart_rate': (total_cart / total_shown * 100) if total_shown > 0 else 0,
                'purchase_rate': (total_purchased / total_shown * 100) if total_shown > 0 else 0,
                'effectiveness_score': 0
            }
            
            # Calculate effectiveness score
            if total_shown > 0:
                metrics['effectiveness_score'] = (
                    (total_clicked * 1) + 
                    (total_cart * 3) + 
                    (total_purchased * 10)
                ) / total_shown
            
            return metrics
            
        except Exception as e:
            print(f"❌ Error getting recommendation metrics: {e}")
            return {}
    
    def end_session_analysis(self):
        """Perform comprehensive analysis when session ends"""
        # Calculate session duration
        if self.session.started_at:
            self.session.session_duration = timezone.now() - self.session.started_at
    
        # Update behavioral score
        self.session.update_behavioral_score()
    
        # Mark session as inactive
        self.session.is_active = False
    
        # Update user's long-term behavior profile
        if self.user:
            profile, created = CustomerBehaviorProfile.objects.get_or_create(
                user=self.user
            )
            profile.update_from_session(self.session)
    
        # Generate session insights
        insights = self._generate_session_insights()
        self.session.preferences.update({'session_insights': insights})
        self.session.save()
    
        return insights
    
    def _update_price_interest(self, price: float):
        """Update session price interest based on viewed products"""
        if self.session.price_range_min is None or price < self.session.price_range_min:
            self.session.price_range_min = price
        
        if self.session.price_range_max is None or price > self.session.price_range_max:
            self.session.price_range_max = price
        
        # Calculate average price interest
        viewed_products = self.session.products_viewed.all()
        if viewed_products:
            total_price = sum(float(p.price) for p in viewed_products)
            self.session.average_price_interest = total_price / viewed_products.count()
        
        self.session.save()
    
    def _analyze_search_query(self, search: SearchQuery):
        """Analyze search query for keywords and intent"""
        from .enhanced_ai_engine import NLPProcessor
        
        nlp = NLPProcessor()
        
        # Detect intent
        intent, confidence = nlp.detect_intent(search.query_text)
        search.detected_intent = intent
        search.confidence_score = confidence
        
        # Extract entities
        entities = nlp.extract_entities(search.query_text)
        search.extracted_keywords = entities.get('keywords', [])
        
        search.save()
    
    def _update_search_patterns(self, search: SearchQuery, results: List[Product]):
        """Update session search patterns based on results"""
        # Update preferences based on search results
        preferences = self.session.preferences.copy()
        
        if 'search_patterns' not in preferences:
            preferences['search_patterns'] = {}
        
        # Track result categories (store only category names, not objects)
        result_categories = []
        for product in results:
            if product.category:
                result_categories.append(product.category.name)
        
        if result_categories:
            for category in set(result_categories):
                if category not in preferences['search_patterns']:
                    preferences['search_patterns'][category] = 0
                preferences['search_patterns'][category] += 1
        
        # Track price ranges in results (convert Decimal to float for JSON serialization)
        if results:
            prices = [float(p.price) for p in results]
            preferences['search_patterns']['price_ranges'] = {
                'min': min(prices),
                'max': max(prices),
                'avg': sum(prices) / len(prices)
            }
        
        self.session.preferences = preferences
        self.session.save()
    
    def _generate_session_insights(self) -> Dict:
        """Generate insights about the user's session behavior"""
        insights = {
            'engagement_level': 'low',
            'shopping_intent': 'browsing',
            'price_sensitivity': 'medium',
            'category_focus': None,
            'recommendation_responsiveness': 'low',
            'search_behavior': 'exploratory'
        }
        
        # Determine engagement level
        score = self.session.behavioral_score
        if score >= 70:
            insights['engagement_level'] = 'high'
        elif score >= 40:
            insights['engagement_level'] = 'medium'
        
        # Determine shopping intent
        if self.session.total_clicks > 3 or SessionProductClick.objects.filter(
            session=self.session, added_to_cart=True
        ).exists():
            insights['shopping_intent'] = 'buying'
        elif self.session.total_clicks > 1:
            insights['shopping_intent'] = 'considering'
        
        # Determine price sensitivity
        if self.session.average_price_interest:
            avg_price = float(self.session.average_price_interest)
            if avg_price < 50:
                insights['price_sensitivity'] = 'high'
            elif avg_price > 200:
                insights['price_sensitivity'] = 'low'
        
        # Determine category focus
        categories = self.session.categories_interested.all()
        if categories.count() == 1:
            insights['category_focus'] = categories.first().name
        elif categories.count() <= 3:
            insights['category_focus'] = 'focused'
        else:
            insights['category_focus'] = 'diverse'
        
        # Determine recommendation responsiveness
        from .models import ProductRecommendation
        recs = ProductRecommendation.objects.filter(session=self.session)
        if recs.exists():
            clicked_recs = recs.filter(was_clicked=True).count()
            if clicked_recs / recs.count() > 0.3:
                insights['recommendation_responsiveness'] = 'high'
            elif clicked_recs / recs.count() > 0.1:
                insights['recommendation_responsiveness'] = 'medium'
        
        # Determine search behavior
        search_analysis = self.session.analyze_search_patterns()
        evolution = search_analysis.get('search_evolution', 'insufficient_data')
        if evolution == 'becoming_more_specific':
            insights['search_behavior'] = 'focused'
        elif evolution == 'becoming_more_general':
            insights['search_behavior'] = 'exploratory'
        else:
            insights['search_behavior'] = 'consistent'
        
        return insights

    def analyze_real_time_behavior(self):
        """Analyze real-time behavior for the current session"""
        # Get all viewed products in this session
        viewed_products = self.session.products_viewed.all()
        categories = [p.category.name for p in viewed_products if p.category]
        prices = [float(p.price) for p in viewed_products]

        # Most viewed category
        if categories:
            from collections import Counter
            most_common_category = Counter(categories).most_common(1)[0][0]
        else:
            most_common_category = None

        # Price trend
        if prices:
            price_trend = {
                'min': min(prices),
                'max': max(prices),
                'avg': sum(prices) / len(prices)
            }
        else:
            price_trend = None

        # Category evolution (order of viewing)
        category_evolution = []
        seen = set()
        for p in viewed_products:
            if p.category and p.category.name not in seen:
                category_evolution.append(p.category.name)
                seen.add(p.category.name)

        return {
            'current_interest': most_common_category,
            'price_trend': price_trend,
            'category_evolution': category_evolution
        }


class BehaviorAnalyzer:
    """Analyze behavior patterns across users and sessions"""
    
    @staticmethod
    def analyze_user_journey(user):
        """Analyze a user's complete journey across sessions"""
        if not user.is_authenticated:
            return {}
        
        sessions = ChatSession.objects.filter(user=user).order_by('started_at')
        
        if not sessions.exists():
            return {}
        
        journey = {
            'total_sessions': sessions.count(),
            'total_duration': sum([s.session_duration for s in sessions if s.session_duration], timedelta()),
            'engagement_trend': [],
            'category_evolution': [],
            'price_evolution': [],
            'search_sophistication': []
        }
        
        for session in sessions:
            journey['engagement_trend'].append(session.behavioral_score)
            
            # Track category interests over time
            categories = list(session.categories_interested.values_list('name', flat=True))
            journey['category_evolution'].append(categories)
            
            # Track price interests over time
            if session.average_price_interest:
                journey['price_evolution'].append(float(session.average_price_interest))
            
            # Track search sophistication
            search_count = len(session.search_queries) if session.search_queries else 0
            journey['search_sophistication'].append(search_count)
        
        return journey
    
    @staticmethod
    def get_similar_users(user, limit=5):
        """Find users with similar behavior patterns"""
        if not user.is_authenticated or not hasattr(user, 'behavior_profile'):
            return []
        
        user_profile = user.behavior_profile
        
        # Find users with similar category preferences
        similar_users = []
        
        for profile in CustomerBehaviorProfile.objects.exclude(user=user):
            similarity_score = BehaviorAnalyzer._calculate_similarity(user_profile, profile)
            if similarity_score > 0.3:  # Minimum similarity threshold
                similar_users.append((profile.user, similarity_score))
        
        # Sort by similarity and return top matches
        similar_users.sort(key=lambda x: x[1], reverse=True)
        return [user for user, score in similar_users[:limit]]
    
    @staticmethod
    def _calculate_similarity(profile1, profile2):
        """Calculate similarity between two behavior profiles"""
        similarity = 0.0
        
        # Category similarity
        cats1 = set(profile1.preferred_categories.keys())
        cats2 = set(profile2.preferred_categories.keys())
        
        if cats1 and cats2:
            category_similarity = len(cats1.intersection(cats2)) / len(cats1.union(cats2))
            similarity += category_similarity * 0.4
        
        # Price similarity
        if profile1.average_price_viewed and profile2.average_price_viewed:
            price1 = float(profile1.average_price_viewed)
            price2 = float(profile2.average_price_viewed)
            price_diff = abs(price1 - price2) / max(price1, price2)
            price_similarity = max(0, 1 - price_diff)
            similarity += price_similarity * 0.3
        
        # Engagement similarity
        engagement_diff = abs(profile1.engagement_score - profile2.engagement_score) / 100
        engagement_similarity = max(0, 1 - engagement_diff)
        similarity += engagement_similarity * 0.3
        
        return similarity
    
    @staticmethod
    def generate_daily_analytics():
        """Generate daily behavior analytics"""
        today = timezone.now().date()
        
        # Get today's sessions
        today_sessions = ChatSession.objects.filter(started_at__date=today)
        
        analytics, created = BehaviorAnalytics.objects.get_or_create(
            date=today,
            defaults={
                'total_sessions': today_sessions.count(),
                'total_searches': sum(s.total_searches for s in today_sessions),
                'total_clicks': sum(s.total_clicks for s in today_sessions),
            }
        )
        
        if not created:
            # Update existing analytics
            analytics.total_sessions = today_sessions.count()
            analytics.total_searches = sum(s.total_searches for s in today_sessions)
            analytics.total_clicks = sum(s.total_clicks for s in today_sessions)
        
        # Calculate averages
        if today_sessions.exists():
            durations = [s.session_duration for s in today_sessions if s.session_duration]
            if durations:
                analytics.average_session_duration = sum(durations, timedelta()) / len(durations)
            
            if analytics.total_searches > 0:
                analytics.search_to_click_ratio = analytics.total_clicks / analytics.total_searches
        
        # Get top keywords and categories
        all_searches = SearchQuery.objects.filter(query_timestamp__date=today)
        keywords = []
        for search in all_searches:
            keywords.extend(search.extracted_keywords)
        
        from collections import Counter
        keyword_counts = Counter(keywords)
        analytics.top_search_keywords = [kw for kw, count in keyword_counts.most_common(10)]
        
        analytics.save()
        return analytics
