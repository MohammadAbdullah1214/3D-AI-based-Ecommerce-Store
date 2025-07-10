#!/usr/bin/env python
import os
import sys
import django
import uuid

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from chatbot.ai_chatbot import AIChatbot
from chatbot.models import ChatSession
from products.models import Product, ProductVariantType, ProductVariantOption

def test_chatbot_search():
    print("🧪 Testing Chatbot Product Search")
    print("=" * 50)
    
    # Initialize chatbot
    chatbot = AIChatbot()
    
    # Create a test session
    session = ChatSession.objects.create(session_id=str(uuid.uuid4()))
    
    # Test queries
    test_queries = [
        "grey shirt",
        "summer shirt", 
        "grey t-shirt",
        "show me grey products",
        "I want a grey shirt"
    ]
    
    for query in test_queries:
        print(f"\n🔍 Testing query: '{query}'")
        print("-" * 30)
        
        # Extract entities
        entities = chatbot._extract_entities_spacy(query)
        print(f"Extracted entities: {entities}")
        
        # Get recommendations
        recommendations, filtered = chatbot._get_ai_recommendations(
            intent='product_search', 
            entities=entities, 
            session=session
        )
        
        print(f"Found {len(recommendations)} products")
        for i, rec in enumerate(recommendations[:3]):  # Show first 3
            print(f"  {i+1}. {rec.get('name', 'N/A')} - {rec.get('category', 'N/A')}")
    
    print("\n" + "=" * 50)
    print("✅ Test completed")

if __name__ == "__main__":
    test_chatbot_search() 