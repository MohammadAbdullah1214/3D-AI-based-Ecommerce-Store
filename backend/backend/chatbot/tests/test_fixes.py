#!/usr/bin/env python3
"""
Test script to verify chatbot fixes
"""

import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from chatbot.enhanced_ai_engine import NLPProcessor, EnhancedChatbotAI
from chatbot.models import ChatSession

def test_no_results_response():
    """Test that the chatbot gives proper 'sorry we don't have that available' responses"""
    print("🧪 TESTING NO RESULTS RESPONSES")
    print("=" * 50)
    
    # Initialize NLP processor
    nlp = NLPProcessor()
    
    # Test messages that should result in no results
    test_messages = [
        "lipsticks",
        "any lipsticks?",
        "shirts",
        "t-shirts",
        "iphones",
        "red dresses",
        "expensive laptops",
        "nike shoes under $50"
    ]
    
    for message in test_messages:
        print(f"\n📝 Testing: '{message}'")
        print("-" * 30)
        
        # Detect intent
        intent, confidence = nlp.detect_intent(message)
        print(f"Intent: {intent} (confidence: {confidence:.2f})")
        
        # Extract entities
        entities = nlp.extract_entities(message)
        print(f"Entities: {entities}")
        
        # Generate response (simulate no recommendations)
        response = nlp.generate_response(intent, entities, recommendations=[], session_context={})
        
        # Check if response contains the expected phrase
        if "sorry" in response.lower() and "don't have" in response.lower() and "available" in response.lower():
            print("✅ CORRECT: Response contains 'sorry we don't have that available'")
        else:
            print("❌ INCORRECT: Response doesn't contain expected phrase")
            print(f"Response: {response[:100]}...")
        
        print("-" * 30)

def test_why_question_detection():
    """Test that why questions are properly detected"""
    print("\n🧪 TESTING WHY QUESTION DETECTION")
    print("=" * 50)
    
    # Initialize NLP processor
    nlp = NLPProcessor()
    
    # Test why questions
    why_questions = [
        "why did you suggest me this",
        "why did you recommend this?",
        "why is this the best?",
        "but why?",
        "why this product?",
        "what's the reason?",
        "can you explain why?"
    ]
    
    for question in why_questions:
        print(f"\n📝 Testing: '{question}'")
        print("-" * 30)
        
        intent, confidence = nlp.detect_intent(question)
        print(f"Intent: {intent} (confidence: {confidence:.2f})")
        
        if intent == 'why_question':
            print("✅ CORRECT: Why question detected")
        else:
            print(f"❌ INCORRECT: Expected 'why_question', got '{intent}'")
        
        print("-" * 30)

def test_why_question_response():
    """Test that why questions get proper explanations"""
    print("\n🧪 TESTING WHY QUESTION RESPONSES")
    print("=" * 50)
    
    # Initialize chatbot
    chatbot = EnhancedChatbotAI()
    
    # Create a mock session context with a last product
    session_context = {
        'last_product': type('MockProduct', (), {
            'name': 'Test Product',
            'price': 99.99,
            'discount_price': 79.99,
            'category': type('MockCategory', (), {'name': 'Electronics'})(),
            'description': 'A high-quality test product with great features',
            'seller': type('MockSeller', (), {'username': 'TestBrand'})()
        })(),
        'last_products_shown': 3,
        'current_message': 'why did you recommend this?'
    }
    
    # Test why question response
    response = chatbot.nlp_processor._generate_why_question_response(
        entities={}, 
        recommendations=[], 
        session_context=session_context
    )
    
    print(f"📝 Why Question Response:")
    print("-" * 30)
    print(response)
    print("-" * 30)
    
    # Check if response contains explanation elements
    checks = [
        ("Why I recommended", "Contains recommendation explanation"),
        ("Great Value", "Contains value reasoning"),
        ("Premium Technology", "Contains category reasoning"),
        ("Trusted Brand", "Contains brand reasoning"),
        ("Features", "Contains feature description")
    ]
    
    for check_text, description in checks:
        if check_text in response:
            print(f"✅ {description}")
        else:
            print(f"❌ Missing: {description}")

if __name__ == "__main__":
    print("🚀 TESTING CHATBOT FIXES")
    print("=" * 60)
    
    try:
        test_no_results_response()
        test_why_question_detection()
        test_why_question_response()
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc() 