#!/usr/bin/env python3
"""
Test script to verify alternatives functionality
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

def test_alternatives_detection():
    """Test that alternatives requests are properly detected"""
    print("🧪 TESTING ALTERNATIVES DETECTION")
    print("=" * 50)
    
    # Initialize NLP processor
    nlp = NLPProcessor()
    
    # Test messages for alternatives
    test_messages = [
        "alternatives for nike shoes",
        "show me alternatives for nike shoes",
        "find alternatives for adidas",
        "alternatives to apple phones",
        "show me alternatives for nike",
        "get alternatives for samsung",
        "alternatives for nike shoes under $100"
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
        
        if intent == 'comparison_request':
            print("✅ CORRECT: Alternatives request detected")
        else:
            print(f"❌ INCORRECT: Expected 'comparison_request', got '{intent}'")
        
        print("-" * 30)

def test_alternatives_functionality():
    """Test that alternatives exclude the mentioned brand"""
    print("\n🧪 TESTING ALTERNATIVES FUNCTIONALITY")
    print("=" * 50)
    
    # Initialize chatbot
    chatbot = EnhancedChatbotAI()
    
    # Test messages
    test_cases = [
        {
            "message": "alternatives for nike shoes",
            "expected_exclude": "nike",
            "expected_category": "shoes"
        },
        {
            "message": "show me alternatives for adidas",
            "expected_exclude": "adidas",
            "expected_category": None
        },
        {
            "message": "alternatives to apple phones",
            "expected_exclude": "apple",
            "expected_category": "phones"
        }
    ]
    
    for test_case in test_cases:
        message = test_case["message"]
        expected_exclude = test_case["expected_exclude"]
        expected_category = test_case["expected_category"]
        
        print(f"\n📝 Testing: '{message}'")
        print("-" * 40)
        
        # Detect intent and extract entities
        intent, confidence = chatbot.nlp_processor.detect_intent(message)
        entities = chatbot.nlp_processor.extract_entities(message)
        
        print(f"Intent: {intent}")
        print(f"Entities: {entities}")
        
        if intent == 'comparison_request':
            # Test the alternatives method directly
            recommendations = chatbot.recommendation_engine._get_alternatives_for_brand(
                session=None,
                entities=entities,
                limit=5,
                current_message=message
            )
            
            print(f"Found {len(recommendations)} alternatives")
            
            # Check that no Nike products are in the results
            excluded_brand_found = False
            for rec in recommendations:
                product_name = rec['product'].name.lower()
                if expected_exclude.lower() in product_name:
                    excluded_brand_found = True
                    print(f"❌ ERROR: Found excluded brand '{expected_exclude}' in result: {rec['product'].name}")
            
            if not excluded_brand_found:
                print(f"✅ SUCCESS: No '{expected_exclude}' products found in alternatives")
            
            # Show the alternatives found
            if recommendations:
                print("🔄 Alternatives found:")
                for i, rec in enumerate(recommendations[:3], 1):
                    print(f"   {i}. {rec['product'].name} - {rec['reason']}")
            else:
                print("⚠️ No alternatives found")
        else:
            print(f"❌ FAILED: Expected 'comparison_request', got '{intent}'")
        
        print("-" * 40)

def test_full_chatbot_response():
    """Test the full chatbot response for alternatives"""
    print("\n🧪 TESTING FULL CHATBOT RESPONSE")
    print("=" * 50)
    
    # Initialize chatbot
    chatbot = EnhancedChatbotAI()
    
    # Create a mock session
    session = type('MockSession', (), {'session_id': 'test_session', 'preferences': {}})()
    
    # Test message
    test_message = "alternatives for nike shoes"
    
    print(f"📝 Testing full response for: '{test_message}'")
    print("-" * 40)
    
    try:
        # Process the message
        response = chatbot.process_message(session, test_message)
        
        print(f"Intent: {response['intent']}")
        print(f"Confidence: {response['confidence']:.2f}")
        print(f"Message: {response['message']}")
        print(f"Products found: {len(response['recommendations'])}")
        
        # Check if Nike products are excluded
        nike_found = False
        for rec in response['recommendations']:
            if 'nike' in rec['name'].lower():
                nike_found = True
                print(f"❌ ERROR: Nike product found: {rec['name']}")
        
        if not nike_found:
            print("✅ SUCCESS: No Nike products in alternatives")
        
        # Show recommendations
        if response['recommendations']:
            print("\n🔄 Recommendations:")
            for i, rec in enumerate(response['recommendations'][:3], 1):
                print(f"   {i}. {rec['name']} - ${rec['price']}")
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
    
    print("-" * 40)

if __name__ == "__main__":
    print("🚀 TESTING ALTERNATIVES FUNCTIONALITY")
    print("=" * 60)
    
    try:
        test_alternatives_detection()
        test_alternatives_functionality()
        test_full_chatbot_response()
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS COMPLETED!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc() 