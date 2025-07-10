#!/usr/bin/env python3
"""
Standalone test script for "why_question" intent patterns
"""

import re
from typing import Dict, Tuple

class TestNLPProcessor:
    """Test version of NLPProcessor for intent detection"""
    
    def __init__(self):
        # Copy the why_question patterns from the main file
        self.why_question_patterns = [
            r'\bwhy\b',
            r'\bwhy.*recommend(ed|ation)?\b',
            r'\bwhy.*(best|good|choose|pick|selected|suggest(ed)?)\b',
            r'\bwhy.*(show(ed)?|display(ed)?|suggest(ed)?|pick(ed)?|choose(n)?)\b',
            r'\bwhat.*reason(s)?\b',
            r'\bcan you explain\b',
            r'\bexplain why\b',
            r'\bwhat makes.*(best|good|better|special|stand out)\b',
            r'\bhow did you decide\b',
            r'\bhow did you pick\b',
            r'\bhow did you choose\b',
            r'\bwhat is the reason\b',
            r'\bfor what reason\b',
            r'\bbut why\b',
            r'\bwhy is that\b',
            r'\bwhy this\b',
            r'\bwhy not\b',
            r'\bwhy do you think\b',
            r'\bwhy did you\b',
            r'\bwhy was this\b',
            r'\bwhy were these\b',
        ]
    
    def detect_intent(self, message: str) -> Tuple[str, float]:
        """Test intent detection for why questions"""
        message_lower = message.lower()
        
        # Check for why question patterns
        matches = 0
        for pattern in self.why_question_patterns:
            if re.search(pattern, message_lower):
                matches += 1
                print(f"✅ MATCH: '{message}' matches pattern '{pattern}'")
        
        if matches > 0:
            confidence = min(matches / len(self.why_question_patterns) * 2, 1.0)
            return 'why_question', confidence
        else:
            return 'general', 0.0

def test_why_question_patterns():
    """Test the why question intent patterns"""
    print("🧪 TESTING WHY QUESTION INTENT PATTERNS")
    print("=" * 60)
    
    # Initialize test NLP processor
    nlp = TestNLPProcessor()
    
    # Test messages for "why_question" intent
    test_messages = [
        "why",
        "why did you recommend this?",
        "why is this the best?",
        "why did you choose this?",
        "why did you pick this?",
        "why did you show this?",
        "why did you suggest this?",
        "what's the reason?",
        "can you explain why?",
        "explain why",
        "what makes this the best?",
        "how did you decide?",
        "how did you pick this?",
        "how did you choose this?",
        "what is the reason?",
        "for what reason?",
        "but why?",
        "why is that?",
        "why this?",
        "why not?",
        "why do you think?",
        "why did you?",
        "why was this?",
        "why were these?",
        # Additional test cases
        "why did you recommend these shoes?",
        "why is nike better?",
        "why should I choose this one?",
        "what makes this product special?",
        "how did you pick these items?",
        "can you explain why you suggested this?",
        "what's the reason for this recommendation?",
        "but why this specific product?",
        "why is this the best choice?",
        "why did you show me these?",
        "what makes these stand out?",
        "why do you think this is good?",
        "why was this selected?",
        "why were these chosen?"
    ]
    
    # Test each message
    results = []
    for i, message in enumerate(test_messages, 1):
        print(f"\n{i:2d}. Testing: '{message}'")
        print("-" * 40)
        
        intent, confidence = nlp.detect_intent(message)
        results.append((message, intent, confidence))
        
        if intent == 'why_question':
            print(f"✅ DETECTED: why_question (confidence: {confidence:.2f})")
        else:
            print(f"❌ MISSED: {intent} (confidence: {confidence:.2f})")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST RESULTS SUMMARY")
    print("=" * 60)
    
    why_questions = [r for r in results if r[1] == 'why_question']
    missed = [r for r in results if r[1] != 'why_question']
    
    print(f"✅ Correctly detected: {len(why_questions)}/{len(test_messages)}")
    print(f"❌ Missed: {len(missed)}/{len(test_messages)}")
    
    if why_questions:
        print(f"\n✅ SUCCESSFULLY DETECTED:")
        for message, intent, confidence in why_questions:
            print(f"   • '{message}' (confidence: {confidence:.2f})")
    
    if missed:
        print(f"\n❌ MISSED DETECTIONS:")
        for message, intent, confidence in missed:
            print(f"   • '{message}' -> {intent} (confidence: {confidence:.2f})")
    
    success_rate = len(why_questions) / len(test_messages) * 100
    print(f"\n🎯 SUCCESS RATE: {success_rate:.1f}%")
    
    if success_rate >= 90:
        print("🎉 EXCELLENT! Why question detection is working well!")
    elif success_rate >= 70:
        print("👍 GOOD! Why question detection is mostly working.")
    else:
        print("⚠️ NEEDS IMPROVEMENT: Many why questions are being missed.")
    
    print("\n✅ WHY QUESTION INTENT TESTING COMPLETE")

if __name__ == "__main__":
    test_why_question_patterns() 