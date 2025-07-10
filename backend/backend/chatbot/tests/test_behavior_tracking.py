from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import timedelta

from ..models import (
    ChatSession, SessionProductView, SessionProductClick, 
    SearchQuery, ProductRecommendation, CustomerBehaviorProfile
)
from products.models import Product, Category
from ..behavior_tracker import BehaviorTracker, BehaviorAnalyzer

User = get_user_model()

class BehaviorTrackingTests(TestCase):
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create test seller
        self.seller = User.objects.create_user(
            username='testseller',
            email='seller@example.com',
            password='sellerpass123',
            role='seller'
        )
        
        # Create test session
        self.session = ChatSession.objects.create(
            user=self.user,
            session_id='test-session-123'
        )
        
        # Create test category
        self.category = Category.objects.create(
            name='Electronics',
            description='Electronic products'
        )
        
        # Create test products
        self.product1 = Product.objects.create(
            name='Test Product 1',
            description='Test Description 1',
            price=100.00,
            category=self.category,
            seller=self.seller
        )
        
        self.product2 = Product.objects.create(
            name='Test Product 2',
            description='Test Description 2',
            price=200.00,
            category=self.category,
            seller=self.seller
        )
        
        # Initialize behavior tracker
        self.tracker = BehaviorTracker(self.session)
    
    def test_track_product_view(self):
        """Test tracking product views"""
        # Track a view
        view = self.tracker.track_product_view(self.product1)
        
        # Check if view was recorded
        self.assertTrue(SessionProductView.objects.filter(
            session=self.session,
            product=self.product1
        ).exists())
        
        # Check if product was added to session's viewed products
        self.assertIn(self.product1, self.session.products_viewed.all())
        
        # Check if category was added to interests
        self.assertIn(self.category, self.session.categories_interested.all())
    
    def test_track_product_click(self):
        """Test tracking product clicks"""
        # Track a click
        click = self.tracker.track_product_click(
            self.product1,
            click_source='search_result',
            position=1
        )
        
        # Check if click was recorded
        self.assertTrue(SessionProductClick.objects.filter(
            session=self.session,
            product=self.product1
        ).exists())
        
        # Check if product was added to clicked products
        self.assertIn(self.product1, self.session.products_clicked.all())
        
        # Check if total clicks was incremented
        self.assertEqual(self.session.total_clicks, 1)
    
    def test_track_search_query(self):
        """Test tracking search queries"""
        # Track a search
        search = self.tracker.track_search_query(
            'test search query',
            query_type='text_search',
            filters={
                'price_min': 50,
                'price_max': 150,
                'categories': ['Electronics']
            }
        )
        
        # Check if search was recorded
        self.assertTrue(SearchQuery.objects.filter(
            session=self.session,
            query_text='test search query'
        ).exists())
        
        # Check if filters were saved
        self.assertEqual(search.price_filter_min, 50)
        self.assertEqual(search.price_filter_max, 150)
        self.assertEqual(search.category_filters, ['Electronics'])
    
    def test_track_recommendation_effectiveness(self):
        """Test tracking recommendation effectiveness"""
        # Create a recommendation
        rec = ProductRecommendation.objects.create(
            session=self.session,
            product=self.product1,
            recommendation_type='search_based',
            recommendation_score=0.85,
            reason='Based on user search patterns',
            position_in_list=1
        )
        
        # Track view interaction
        self.tracker.track_recommendation_interaction(
            rec.id,
            'view'
        )
        
        # Refresh recommendation from database
        rec.refresh_from_db()
        
        # Check if view was recorded
        self.assertTrue(rec.was_viewed)
        
        # Track click interaction
        self.tracker.track_recommendation_interaction(
            rec.id,
            'click'
        )
        
        # Refresh recommendation from database
        rec.refresh_from_db()
        
        # Check if click was recorded
        self.assertTrue(rec.was_clicked)
        
        # Check effectiveness score
        effectiveness_score = rec.calculate_effectiveness_score()
        self.assertEqual(effectiveness_score, 4)  # 1 for view + 3 for click
    
    def test_real_time_behavior_analysis(self):
        """Test real-time behavior analysis"""
        # Create some test data
        self.tracker.track_product_view(self.product1)
        self.tracker.track_product_view(self.product1)
        self.tracker.track_product_view(self.product2)
        
        # Get real-time analysis
        insights = self.tracker.analyze_real_time_behavior()
        
        # Check insights
        self.assertEqual(insights['current_interest'], 'Electronics')
        self.assertIsNotNone(insights['price_trend'])
        self.assertIsNotNone(insights['category_evolution'])
    
    def test_behavior_analyzer(self):
        """Test behavior analyzer functionality"""
        # Create some test data
        self.tracker.track_product_view(self.product1)
        self.tracker.track_product_click(self.product1, 'search_result')
        
        # Get user journey
        journey = BehaviorAnalyzer.analyze_user_journey(self.user)
        
        # Check journey data
        self.assertEqual(journey['total_sessions'], 1)
        self.assertIsNotNone(journey['engagement_trend'])
        self.assertIsNotNone(journey['category_evolution'])
        
        # Get similar users
        similar_users = BehaviorAnalyzer.get_similar_users(self.user)
        self.assertIsInstance(similar_users, list) 