from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from chatbot.ai_recommendation_engine import AIRecommendationEngine
from chatbot.models import ChatSession
from analytics.models import UserActivity
from products.models import Product


class Command(BaseCommand):
    help = 'Train the chatbot AI models with existing data'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days of data to use for training'
        )
    
    def handle(self, *args, **options):
        days = options['days']
        cutoff_date = timezone.now() - timedelta(days=days)
        
        self.stdout.write(f'Training chatbot with data from the last {days} days...')
        
        # Initialize AI engine
        ai_engine = AIRecommendationEngine()
        
        # Analyze user sessions (removed UserPreferenceProfile logic)
        sessions = ChatSession.objects.filter(started_at__gte=cutoff_date)
        updated_profiles = 0
        
        for session in sessions:
            if session.user:
                # Update user preferences based on session data
                ai_engine.update_user_preferences(session.user.id, None, 'session_analysis')
                updated_profiles += 1
        
        self.stdout.write(f'✓ Analyzed {updated_profiles} user sessions')
        
        # Generate sample recommendations to test the system
        test_sessions = ChatSession.objects.filter(
            is_active=True,
            started_at__gte=cutoff_date
        )[:5]
        
        for session in test_sessions:
            if session.user:
                recommendations = ai_engine.get_personalized_recommendations(session.user.id, limit=3)
                self.stdout.write(f'✓ Generated {len(recommendations)} recommendations for user {session.user.id}')
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully trained chatbot with {sessions.count()} sessions')
        )
