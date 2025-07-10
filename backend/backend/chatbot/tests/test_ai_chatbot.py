#!/usr/bin/env python3
"""
Test script for AI-powered chatbot
"""
import os
import sys
from pathlib import Path
import time

# Ensure we can import core.settings from backend
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

# Set Django settings for project
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
import django
django.setup()

from chatbot.ai_chatbot import AIChatbot
from products.models import Product, Category
from chatbot.models import ChatSession

def test_ai_chatbot():
    """Test the AI-powered chatbot"""
    print("🤖 Testing AI-Powered Chatbot")
    print("=" * 50)
    
    # Initialize AI chatbot
    chatbot = AIChatbot()
    
    # Create a test session with unique ID
    session_id = f"test_session_{int(time.time())}"
    session = ChatSession.objects.create(
        session_id=session_id,
        is_active=True
    )
    
    # Test cases
    test_cases = [
        # Intent detection tests
        ("I want to buy shoes", "Intent detection"),
        ("Show me Nike products", "Brand search"),
        ("What's the price of this item?", "Price inquiry"),
        ("I need help with my order", "Support request"),
        
        # Entity extraction tests
        ("I want red shoes under $100", "Entity extraction"),
        ("Show me size 10 Nike sneakers", "Variant extraction"),
        ("I need 3 pairs of running shoes", "Quantity extraction"),
        
        # Context and conversation tests
        ("Which one is best?", "Context handling"),
        ("I prefer comfortable shoes", "Preference learning"),
        ("What about the blue ones?", "Context reference"),
        
        # Recommendation tests
        ("Recommend me some shoes", "Recommendation"),
        ("I like sporty styles", "Style preference"),
        ("What's popular right now?", "Trending items"),
    ]
    
    for message, test_type in test_cases:
        print(f"\n🧪 {test_type}: '{message}'")
        print("-" * 40)
        
        try:
            response = chatbot.process_message(message, session)
            print(f"🤖 Response: {response}")
        except Exception as e:
            print(f"❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("✅ AI Chatbot testing completed!")

if __name__ == "__main__":
    test_ai_chatbot() 