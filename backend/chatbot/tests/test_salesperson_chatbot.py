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
from products.models import Product, Category, ProductVariantType, ProductVariantOption

def test_salesperson_capabilities():
    print("🧪 Testing Salesperson Chatbot Capabilities")
    print("=" * 60)
    
    # Initialize chatbot
    chatbot = AIChatbot()
    
    # Create a test session
    session = ChatSession.objects.create(session_id=str(uuid.uuid4()))
    
    # Test scenarios - all the queries you mentioned
    test_scenarios = [
        # Basic product search with specificity
        ("show me grey shirts", "Basic color + product search"),
        ("show me t-shirts", "Basic product category search"),
        ("show me 3 shirts", "Quantity + product search"),
        
        # Seasonal/Contextual searches
        ("any light t-shirts for summer?", "Seasonal/contextual search"),
        ("show me winter jackets", "Seasonal search"),
        
        # Value and comparison queries
        ("which t-shirt is the best value for money", "Value comparison"),
        ("compare these shirts", "Direct comparison"),
        ("show me 3 shirts and compare them", "Quantity + comparison"),
        
        # Trending and popularity
        ("show me trending shirts", "Trending products"),
        ("what's popular right now", "Popularity search"),
        
        # Rating and reviews
        ("show me best rated shirts", "Rating-based search"),
        ("which has the best reviews", "Review-based search"),
        
        # Alternatives and substitutes
        ("any alternatives for this product?", "Alternatives request"),
        ("show me similar items", "Similar products"),
        
        # Sales assistance
        ("I need help choosing", "Sales assistance"),
        ("what would you recommend", "Recommendation request"),
        
        # Contextual awareness
        ("tell me more about this", "Contextual follow-up"),
        ("what about the price", "Price follow-up"),
        ("how about the quality", "Quality follow-up"),
        
        # Follow-up questions
        ("which one should I buy", "Decision help"),
        ("what's the difference", "Feature comparison"),
        ("is this worth it", "Value assessment")
    ]
    
    for query, description in test_scenarios:
        print(f"\n🔍 Testing: '{query}'")
        print(f"📝 Description: {description}")
        print("-" * 50)
        
        # Extract entities
        entities = chatbot._extract_entities_spacy(query)
        print(f"Extracted entities: {entities}")
        
        # Get recommendations
        recommendations, filtered = chatbot._get_ai_recommendations(
            intent='product_search',  # We'll let the AI detect the actual intent
            entities=entities, 
            session=session
        )
        
        print(f"Found {len(recommendations)} products")
        for i, rec in enumerate(recommendations[:3]):  # Show first 3
            print(f"  {i+1}. {rec.get('name', 'N/A')} - {rec.get('category', 'N/A')}")
        
        # Test intent detection
        intent, confidence = chatbot._detect_intent_ai(query, session)
        print(f"Detected intent: {intent} (confidence: {confidence:.2f})")
        
        # Generate response
        sentiment = chatbot._analyze_sentiment_ai(query)
        response = chatbot._generate_ai_response(intent, entities, sentiment, session, recommendations=recommendations)
        print(f"Response: {response[:100]}...")
    
    print("\n" + "=" * 60)
    print("✅ Salesperson capability test completed")

def test_contextual_awareness():
    print("\n🧠 Testing Contextual Awareness")
    print("=" * 40)
    
    chatbot = AIChatbot()
    session = ChatSession.objects.create(session_id=str(uuid.uuid4()))
    
    # Simulate a conversation flow
    conversation = [
        ("show me grey shirts", "Initial product search"),
        ("tell me more about the first one", "Contextual follow-up"),
        ("what about alternatives", "Alternatives request"),
        ("compare the first two", "Comparison request"),
        ("which is better value", "Value comparison"),
        ("I'll take the first one", "Purchase decision")
    ]
    
    for i, (query, description) in enumerate(conversation):
        print(f"\n💬 Turn {i+1}: '{query}'")
        print(f"📝 {description}")
        
        # Process the message
        entities = chatbot._extract_entities_spacy(query)
        intent, confidence = chatbot._detect_intent_ai(query, session)
        recommendations, filtered = chatbot._get_ai_recommendations(intent, entities, session)
        sentiment = chatbot._analyze_sentiment_ai(query)
        response = chatbot._generate_ai_response(intent, entities, sentiment, session, recommendations=recommendations)
        
        print(f"Intent: {intent}")
        print(f"Products found: {len(recommendations)}")
        print(f"Response: {response[:80]}...")
        
        # Track the interaction
        chatbot._track_interaction(session, query, intent, entities, sentiment)

if __name__ == "__main__":
    test_salesperson_capabilities()
    test_contextual_awareness() 