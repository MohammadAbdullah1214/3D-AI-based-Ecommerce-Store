from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.utils import timezone

from ..models import ChatSession, ProductRecommendation
from products.models import Product, Category

User = get_user_model()

class ChatbotAPITests(TestCase):
    def setUp(self):
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create test client
        self.client = APIClient()
        
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
            category=self.category
        )
        
        self.product2 = Product.objects.create(
            name='Test Product 2',
            description='Test Description 2',
            price=200.00,
            category=self.category
        )
    
    def test_chat_endpoint(self):
        """Test chat endpoint"""
        # Create a session
        session = ChatSession.objects.create(
            user=self.user,
            session_id='test-session-123'
        )
        
        # Test chat message
        response = self.client.post(
            reverse('chatbot-chat'),
            {
                'session_id': session.session_id,
                'message': 'Show me electronics under $150'
            },
            format='json'
        )
        
        # Check response
        self.assertEqual(response.status_code, 200)
        self.assertIn('recommendations', response.data)
        self.assertIn('insights', response.data)
        
        # Check if recommendations are relevant
        recommendations = response.data['recommendations']
        self.assertTrue(len(recommendations) > 0)
        
        # Check if price filter was applied
        for rec in recommendations:
            self.assertLessEqual(float(rec['price']), 150.00)
    
    def test_track_interaction(self):
        """Test tracking user interactions"""
        # Create a session
        session = ChatSession.objects.create(
            user=self.user,
            session_id='test-session-123'
        )
        
        # Create a recommendation
        rec = ProductRecommendation.objects.create(
            session=session,
            product=self.product1,
            recommendation_type='search_based',
            position_in_list=1
        )
        
        # Test tracking view
        response = self.client.post(
            reverse('chatbot-track-interaction'),
            {
                'session_id': session.session_id,
                'interaction_type': 'view',
                'recommendation_id': rec.id,
                'product_id': self.product1.id
            },
            format='json'
        )
        
        # Check response
        self.assertEqual(response.status_code, 200)
        
        # Refresh recommendation from database
        rec.refresh_from_db()
        
        # Check if view was recorded
        self.assertTrue(rec.was_viewed)
        
        # Test tracking click
        response = self.client.post(
            reverse('chatbot-track-interaction'),
            {
                'session_id': session.session_id,
                'interaction_type': 'click',
                'recommendation_id': rec.id,
                'product_id': self.product1.id
            },
            format='json'
        )
        
        # Check response
        self.assertEqual(response.status_code, 200)
        
        # Refresh recommendation from database
        rec.refresh_from_db()
        
        # Check if click was recorded
        self.assertTrue(rec.was_clicked)
    
    def test_end_session(self):
        """Test ending a session"""
        # Create a session
        session = ChatSession.objects.create(
            user=self.user,
            session_id='test-session-123'
        )
        
        # Add some test data
        session.products_viewed.add(self.product1)
        session.products_clicked.add(self.product1)
        session.categories_interested.add(self.category)
        
        # Test ending session
        response = self.client.post(
            reverse('chatbot-end-session'),
            {
                'session_id': session.session_id
            },
            format='json'
        )
        
        # Check response
        self.assertEqual(response.status_code, 200)
        
        # Refresh session from database
        session.refresh_from_db()
        
        # Check if session was ended
        self.assertIsNotNone(session.ended_at)
        self.assertIsNotNone(session.behavioral_score)
    
    def test_analytics_endpoints(self):
        """Test analytics endpoints"""
        # Create a session
        session = ChatSession.objects.create(
            user=self.user,
            session_id='test-session-123'
        )
        
        # Add some test data
        session.products_viewed.add(self.product1)
        session.products_clicked.add(self.product1)
        session.categories_interested.add(self.category)
        
        # Test user journey endpoint
        response = self.client.get(
            reverse('behavior-analytics-user-journey'),
            {'user_id': self.user.id}
        )
        
        # Check response
        self.assertEqual(response.status_code, 200)
        self.assertIn('total_sessions', response.data)
        self.assertIn('engagement_trend', response.data)
        
        # Test similar users endpoint
        response = self.client.get(
            reverse('behavior-analytics-similar-users'),
            {'user_id': self.user.id}
        )
        
        # Check response
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.data, list)
        
        # Test daily analytics endpoint
        response = self.client.get(
            reverse('behavior-analytics-daily-analytics')
        )
        
        # Check response
        self.assertEqual(response.status_code, 200)
        self.assertIn('total_sessions', response.data)
        self.assertIn('total_searches', response.data)
        self.assertIn('total_clicks', response.data) 