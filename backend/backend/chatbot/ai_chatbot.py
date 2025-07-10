import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sentence_transformers import SentenceTransformer
from transformers import pipeline
import joblib
import os
from typing import Dict, List, Tuple, Optional, Any
import json
from datetime import datetime, timedelta
import re
import logging
from collections import defaultdict, Counter

from django.utils import timezone
from django.db.models import Count, Avg, Q, F, Case, When
from .models import ChatSession, SessionProductView, SessionProductClick, CustomerBehaviorProfile
from products.models import Product, Category, ProductVariantType, ProductVariantOption
from analytics.models import UserActivity
from django.core.cache import cache
from django.conf import settings
import spacy

logger = logging.getLogger(__name__)

class AIChatbot:
    """Comprehensive AI-powered chatbot with ML-based NLP and recommendations"""
    
    def __init__(self):
        self.model_dir = os.path.join(settings.BASE_DIR, 'chatbot', 'ai_models')
        os.makedirs(self.model_dir, exist_ok=True)
        
        # Initialize AI components
        self.intent_classifier = None
        self.sentiment_analyzer = None
        self.sentence_encoder = None
        self.vectorizer = None
        self.recommendation_engine = None
        
        # Load or train models
        self._load_or_train_models()
        
        # Intent labels for comprehensive coverage
        self.intent_labels = [
            'product_search', 'brand_search', 'category_browse', 'price_inquiry',
            'variant_inquiry', 'trending_request', 'rating_inquiry', 'comparison_request',
            'recommendation_request', 'cart_inquiry', 'greeting', 'goodbye',
            'context_question', 'follow_up_price', 'follow_up_performance',
            'follow_up_style', 'follow_up_features', 'positive_response',
            'show_more_request', 'brand_comparison', 'sales_assistance',
            'alternatives_request'
        ]
        
        # Context tracking
        self.conversation_context = {}
        
        # Intent patterns for fallback
        self.intent_patterns = {
            'greeting': [
                r'^\s*(hi|hello|hey|good morning|good afternoon|good evening|greetings|hi there|hello there|hey there|good day|morning|afternoon|evening)\s*$',
                r'\b(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b'
            ],
            'goodbye': [
                r'^\s*(bye|goodbye|see you|thanks|thank you|thank you bye|thanks bye|see you later|have a good day|take care|bye bye|see ya|farewell|that\'s all)\s*$',
                r'\b(bye|goodbye|see you|thanks|thank you|farewell|that\'s all|have a good day|take care)\b'
            ],
            'product_search': [
                r'\b(show|find|search|look for|get|want|need|display|browse)\b.*\b(product|item|thing|shoes|clothes|electronics|phone|laptop|t-shirt|hoodie|dress|jeans|jacket|shirt|pants|apparel|wear|tops|bottoms|accessories)\b',
                r'\b(shoes?|clothes?|electronics?|phones?|laptops?|t-shirts?|hoodies?|lipsticks?|dresses?|jeans?|jackets?|shirts?|pants?|apparel|wear|tops|bottoms|accessories)\b'
            ],
            'brand_search': [
                r'\b(show|find|search|look for|get|want|need|display|browse)\b.*\b(nike|adidas|puma|reebok|converse|vans|jordan|under armour|apple|samsung|sony|lg|brand)\b',
                r'\b(nike|adidas|puma|reebok|converse|vans|jordan|under armour|apple|samsung|sony|lg)\b.*\b(product|item|shoes|clothes|phone|laptop|collection|brand)\b',
                r'\b(nike|adidas|puma|reebok|converse|vans|jordan|under armour|apple|samsung|sony|lg)\b'
            ],
            'category_browse': [
                r'\b(show|browse|look at|see|display)\b.*\b(category|section|department|categories|collection)\b',
                r'\b(electronics|clothing|books|home|sports|beauty|winter wear|summer wear|shoes|apparel|accessories)\b.*\b(category|section|department|collection)\b',
                r'^(electronics|clothing|books|home|sports|beauty|winter wear|summer wear|shoes|apparel|accessories)$'
            ],
            'price_inquiry': [
                r'\b(price|cost|how much|expensive|cheap|budget|affordable|pricing|price range|cost range|under \$?\d+|over \$?\d+|less than \$?\d+|more than \$?\d+|\d+ dollars?|\$\d+)\b',
                r'\b(what\'s the price|how much does it cost|price information|price details|cost information|pricing|price check|price of this|cost of this)\b'
            ],
            'size_inquiry': [
                r'\b(size|sizes|what sizes|available sizes|which sizes|size options|what size)\b'
            ],
            'comparison_request': [
                r'\b(compare|comparison|difference|vs|versus|which is better|which one|which should I buy|which to buy|better option|best choice|recommend between|compare prices|compare quality|compare features|pros and cons|help me decide)\b',
                r'\b(compare products|compare these|compare items|compare options|which is best|which is better|what\'s the difference|which one should I choose|which one should I buy|which product|which should I buy|which is better|what\'s the difference)\b'
            ],
            'recommendation_request': [
                r'\b(recommend|suggest|what should I buy|help me choose|best|top picks|popular items|trending products|what\'s popular|best sellers|customer favorites|recommend me|what should I get|what do you recommend|best options|trending now|hot items|must-have products|what\'s in style|fashion recommendations|style advice)\b'
            ],
            'quantity_request': [r'\b(how many|quantity|amount|number)\b'],
            'add_to_cart': [r'\b(add|put|place)\b.*\b(cart|basket)\b'],
            'order_status': [r'\b(order|status|track|where)\b'],
            'support_request': [r'\b(help|support|problem|issue|trouble)\b'],
        }
        
        # Entity patterns
        self.entity_patterns = {
            'brand': [r'\b(nike|adidas|puma|reebok|converse|vans|jordan|under armour|apple|samsung|sony|lg)\b'],
            'color': [r'\b(red|blue|green|yellow|black|white|gray|grey|pink|purple|orange|brown)\b'],
            'size': [r'\b(xs|s|m|l|xl|xxl|xxxl|small|medium|large)\b'],
            'price_range': [r'\b(under|less than|more than|above|below)\b.*\b(\d+)\b'],
            'quantity': [r'\b(\d+)\b.*\b(pair|pairs|item|items|piece|pieces)\b'],
        }
        
        self.nlp = spacy.load('en_core_web_sm')
        # Preload brands and categories from DB for matching
        self._brand_list = [
            'Nike', 'Adidas', 'Apple', 'Samsung', 'Sony', 'Reebok', 'Converse', 'Jordan', 'Puma', 'Under Armour', 'LG', 'Vans'
        ]
        self._category_list = list(Category.objects.values_list('name', flat=True).distinct())
        self._color_list = [
            'red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'grey', 'pink', 'purple', 'orange', 'brown', 'beige', 'gold', 'silver', 'navy', 'maroon', 'olive', 'teal', 'coral', 'peach', 'mint', 'lavender', 'turquoise', 'burgundy', 'cream', 'ivory', 'charcoal', 'mustard', 'tan', 'bronze', 'copper', 'platinum', 'rose', 'aqua', 'indigo', 'violet', 'magenta', 'cyan', 'amber', 'lime', 'khaki', 'chocolate', 'apricot', 'azure', 'crimson', 'fuchsia', 'jade', 'lemon', 'mauve', 'ochre', 'ruby', 'sapphire', 'scarlet', 'taupe', 'topaz', 'emerald', 'amethyst', 'periwinkle', 'sand', 'slate', 'steel', 'wine', 'zinc'
        ]
        
        # Add retail term to category mapping for salesperson-like behavior
        self.retail_category_mapping = {
            'summer wear': ['Dress', 'T-Shirts', 'Shirts', 'Tops'],
            'summer dress': ['Dress'],
            'shirts': ['T-Shirts', 'Shirts'],
            'shirt': ['T-Shirts', 'Shirts'],
            'tops': ['Tops', 'T-Shirts', 'Shirts'],
            'winter wear': ['Jackets', 'Hoodies', 'Sweaters'],
            'makeup': ['Lipstick', 'Makeup'],
            'beauty': ['Makeup', 'Lipstick'],
            
        }
    
    def _load_or_train_models(self):
        """Load existing models or train new ones"""
        # Check if models are already loaded to prevent infinite reloading
        if hasattr(self, '_models_loaded') and self._models_loaded:
            return
            
        try:
            # Try to load existing models
            self.intent_classifier = joblib.load(f'{self.model_dir}/intent_classifier.pkl')
            self.vectorizer = joblib.load(f'{self.model_dir}/vectorizer.pkl')
            print("✅ Loaded existing AI models")
        except FileNotFoundError:
            print("🔄 Training new AI models...")
            self._train_models()
        
        # Initialize sentence encoder with error handling
        try:
            if not hasattr(self, 'sentence_encoder') or self.sentence_encoder is None:
                self.sentence_encoder = SentenceTransformer('all-MiniLM-L6-v2')
                print("✅ Loaded sentence encoder")
        except Exception as e:
            print(f"⚠️ Could not load sentence encoder: {e}")
            self.sentence_encoder = None
        
        # Initialize sentiment analyzer with error handling
        try:
            if not hasattr(self, 'sentiment_analyzer') or self.sentiment_analyzer is None:
                self.sentiment_analyzer = pipeline('sentiment-analysis', model='cardiffnlp/twitter-roberta-base-sentiment')
                print("✅ Loaded sentiment analyzer")
        except Exception as e:
            print(f"⚠️ Could not load sentiment analyzer: {e}")
            self.sentiment_analyzer = None
            
        # Mark models as loaded to prevent reloading
        self._models_loaded = True
    
    def _train_models(self):
        """Train comprehensive AI models with large dataset"""
        print("📊 Generating comprehensive training data...")
        
        # Generate large training dataset
        training_data = self._generate_comprehensive_training_data()
        
        # Split data for training and testing (80/20)
        train_data, test_data = self._split_data(training_data, test_size=0.2)
        
        print(f"📈 Training with {len(train_data)} samples, testing with {len(test_data)} samples")
        
        # Train intent classification model
        self._train_intent_classifier(train_data, test_data)
        
        # Initialize other AI components
        self.sentence_encoder = SentenceTransformer('all-MiniLM-L6-v2')
        self.sentiment_analyzer = pipeline('sentiment-analysis', model='cardiffnlp/twitter-roberta-base-sentiment')
        
        # Save models
        self._save_models()
        
        # Evaluate models
        self._evaluate_models(test_data)
        
        print("✅ AI models trained and saved")
    
    def _generate_comprehensive_training_data(self) -> List[Dict]:
        """Generate a comprehensive, realistic training dataset for all product types and queries"""
        training_data = []

        # --- SALESPERSON-LIKE QUERIES: Product Search with Specificity ---
        specific_search_patterns = [
            # Color + Product combinations
            "show me grey shirts", "find blue t-shirts", "I want red dresses", "looking for black shoes", 
            "show me white sneakers", "find green hoodies", "I need pink lipsticks", "show me yellow tops",
            "find purple dresses", "show me brown shoes", "I want orange t-shirts", "find silver jewelry",
            
            # Quantity + Product combinations
            "show me 3 shirts", "find 5 t-shirts", "get 2 dresses", "show me 4 pairs of shoes",
            "I want 3 lipsticks", "find 2 laptops", "show me 6 t-shirts", "get 1 phone",
            "show me 10 products", "find 3 alternatives", "get 5 options", "show me 2 choices",
            
            # Seasonal/Contextual searches
            "any light t-shirts for summer", "show me winter jackets", "find summer dresses",
            "show me spring collection", "find autumn wear", "show me beach wear",
            "any formal shirts", "find casual wear", "show me party dresses",
            "find workout clothes", "show me office wear", "find weekend outfits",
            
            # Material/Quality searches
            "show me cotton shirts", "find silk dresses", "show me leather shoes",
            "find denim jeans", "show me wool sweaters", "find polyester shirts",
            "show me organic cotton", "find sustainable fashion", "show me premium quality",
            "find budget-friendly options", "show me luxury items", "find affordable alternatives"
        ]
        for pattern in specific_search_patterns:
            training_data.append({'text': pattern, 'intent': 'product_search', 'entities': {}})

        # --- COMPARISON QUERIES: Salesperson Comparison Skills ---
        comparison_patterns = [
            # Direct comparison requests
            "compare these shirts", "which t-shirt is better", "compare these 3 products",
            "show me the differences", "which one should I choose", "help me decide between these",
            "what's the difference between these", "compare prices and quality",
            "which is the best option", "compare features", "show me pros and cons",
            
            # Value-based comparisons
            "which t-shirt is the best value for money", "show me the best bang for buck",
            "which product offers the most value", "compare value for money",
            "which is worth the price", "show me cost-effective options",
            "which gives me the most for my money", "compare price to quality ratio",
            
            # Feature-based comparisons
            "which has better quality", "compare durability", "which lasts longer",
            "compare comfort levels", "which is more comfortable", "compare styles",
            "which looks better", "compare designs", "which is more fashionable",
            "compare sizes", "which fits better", "compare colors"
        ]
        for pattern in comparison_patterns:
            training_data.append({'text': pattern, 'intent': 'comparison_request', 'entities': {}})

        # --- TRENDING & POPULARITY QUERIES ---
        trending_patterns = [
            "show me trending shirts", "what's popular right now", "show me best sellers",
            "find trending products", "show me hot items", "what's in fashion",
            "show me popular choices", "find trending styles", "show me what's new",
            "what are people buying", "show me customer favorites", "find trending colors",
            "show me viral products", "what's trending this season", "show me popular brands"
        ]
        for pattern in trending_patterns:
            training_data.append({'text': pattern, 'intent': 'trending_request', 'entities': {}})

        # --- RATING & REVIEW QUERIES ---
        rating_patterns = [
            "show me best rated shirts", "find highly rated products", "show me top rated items",
            "which has the best reviews", "show me customer favorites", "find well-reviewed products",
            "show me 5-star products", "which gets the best feedback", "show me highly recommended",
            "find products with good ratings", "show me customer choice awards", "which is most popular"
        ]
        for pattern in rating_patterns:
            training_data.append({'text': pattern, 'intent': 'rating_inquiry', 'entities': {}})

        # --- ALTERNATIVES & SUBSTITUTES QUERIES ---
        alternatives_patterns = [
            "show me alternatives for this product", "find similar items", "show me other options",
            "what else do you have like this", "show me substitutes", "find comparable products",
            "show me other choices", "what are my alternatives", "find similar styles",
            "show me different options", "what else is available", "find other brands",
            "show me more options", "what are the alternatives", "find similar quality items"
        ]
        for pattern in alternatives_patterns:
            training_data.append({'text': pattern, 'intent': 'alternatives_request', 'entities': {}})

        # --- CONTEXTUAL AWARENESS QUERIES ---
        contextual_patterns = [
            # Follow-up questions
            "tell me more about this", "what about the price", "how about the quality",
            "what's the material", "tell me about the brand", "what are the features",
            "how does it compare", "what's special about this", "why should I choose this",
            "what makes this different", "is this worth it", "should I buy this",
            
            # Contextual recommendations
            "what would you recommend", "what do you suggest", "help me choose",
            "what's your opinion", "what would you buy", "give me advice",
            "what's the best choice", "guide me", "help me decide",
            "what's your recommendation", "suggest something", "advise me"
        ]
        for pattern in contextual_patterns:
            training_data.append({'text': pattern, 'intent': 'context_question', 'entities': {}})

        # --- SALES ASSISTANCE QUERIES ---
        sales_patterns = [
            "I need help choosing", "can you help me find", "I'm not sure what to buy",
            "help me pick", "I need guidance", "what should I look for",
            "how do I choose", "what factors should I consider", "help me decide",
            "I'm confused", "what's your advice", "guide me through this",
            "I need recommendations", "suggest something for me", "help me shop"
        ]
        for pattern in sales_patterns:
            training_data.append({'text': pattern, 'intent': 'sales_assistance', 'entities': {}})

        # --- Beauty & Makeup (Enhanced) ---
        beauty_patterns = [
            "show me lipsticks", "I want matte lipstick", "find me some eyeliners", "search for makeup", 
            "show beauty products", "I need a new lipstick", "where can I find foundation", "show me cosmetics", 
            "find blush", "show me mascara", "recommend me makeup", "best lipstick brands", "affordable eyeliners", 
            "long-lasting lipstick", "show me makeup kits", "find me beauty essentials", "show me vegan cosmetics", 
            "find cruelty-free lipstick", "organic beauty products", "best foundation for oily skin", "cheap mascara", 
            "luxury makeup brands", "compare lipstick brands", "which foundation is best", "show me trending makeup",
            "find alternatives to this lipstick", "what's the best value makeup", "show me highly rated cosmetics"
        ]
        for pattern in beauty_patterns:
            training_data.append({'text': pattern, 'intent': 'product_search', 'entities': {'categories': ['beauty', 'makeup', 'lipstick', 'eyeliner', 'cosmetics']}})

        # --- Fashion & Apparel (Enhanced) ---
        fashion_patterns = [
            "show me t-shirts", "I want cotton shirts", "looking for hoodies", "find me some tops", 
            "search for dresses", "show casual wear", "I need a new shirt", "where can I find pants", 
            "show me options", "find jeans", "show me jackets", "recommend me shoes", "best sneakers", 
            "affordable dresses", "summer wear", "winter jackets", "show me blue jeans", "find red dresses", 
            "show me black t-shirts", "find white sneakers", "show me green hoodies", "compare these shirts",
            "which dress is better", "show me trending fashion", "find alternatives to this shirt",
            "what's the best value clothing", "show me highly rated clothes", "compare shoe brands"
        ]
        for pattern in fashion_patterns:
            training_data.append({'text': pattern, 'intent': 'product_search', 'entities': {'categories': ['fashion', 'clothing', 'shoes', 'apparel']}})

        # --- Electronics (Enhanced) ---
        electronics_patterns = [
            "show me phones", "I want a new laptop", "find me some headphones", "search for smartwatches", 
            "show electronics", "I need a new phone", "where can I find tablets", "show me gadgets", 
            "find speakers", "show me cameras", "recommend me laptops", "best smartphones", "affordable tablets", 
            "wireless headphones", "gaming laptops", "show me apple iphone", "find samsung galaxy", 
            "show me sony headphones", "compare these phones", "which laptop is better",
            "show me trending electronics", "find alternatives to this phone", "what's the best value tech",
            "show me highly rated gadgets", "compare laptop brands"
        ]
        for pattern in electronics_patterns:
            training_data.append({'text': pattern, 'intent': 'product_search', 'entities': {'categories': ['electronics', 'phones', 'laptops', 'gadgets']}})

        # --- Brand Search (Enhanced) ---
        brand_patterns = [
            "show me Nike shoes", "find Adidas sneakers", "search for Apple phones", "show Samsung gadgets", 
            "I want Sony headphones", "find me Reebok shoes", "show Converse sneakers", "best Jordan shoes", 
            "affordable Puma sneakers", "find Under Armour t-shirts", "show me LG electronics", "find Vans shoes",
            "compare Nike and Adidas", "which brand is better", "show me trending brands",
            "find alternatives to Nike", "what's the best value brand", "show me highly rated brands"
        ]
        for pattern in brand_patterns:
            training_data.append({'text': pattern, 'intent': 'brand_search', 'entities': {'brands': ['nike', 'adidas', 'apple', 'samsung', 'sony', 'reebok', 'converse', 'jordan', 'puma', 'under armour', 'lg', 'vans']}})

        # --- Price Inquiry (Enhanced) ---
        price_patterns = [
            "show me lipsticks under $20", "find affordable makeup", "cheap t-shirts", "expensive headphones", 
            "phones less than $500", "laptops over $1000", "budget shoes", "affordable dresses", 
            "show me products under $50", "find items over $200", "show me blue jeans under $100",
            "what's the best value for money", "show me budget-friendly options", "find premium products",
            "compare prices", "which is more affordable", "show me cost-effective choices"
        ]
        for pattern in price_patterns:
            training_data.append({'text': pattern, 'intent': 'price_inquiry', 'entities': {}})

        # --- Greetings & Goodbyes ---
        greetings = ["hi", "hello", "hey", "good morning", "good afternoon", "greetings", "what's up", "howdy", "yo"]
        for g in greetings:
            training_data.append({'text': g, 'intent': 'greeting', 'entities': {}})
        goodbyes = ["bye", "goodbye", "see you", "thanks", "thank you", "farewell", "see you later", "catch you later"]
        for g in goodbyes:
            training_data.append({'text': g, 'intent': 'goodbye', 'entities': {}})

        # --- Follow-up Questions (Contextual) ---
        follow_up_patterns = [
            "what about the price", "how about the quality", "tell me more", "what else",
            "show me more", "what about alternatives", "how does it compare", "what's different",
            "why this one", "what makes it special", "is it worth it", "should I buy it",
            "what's your opinion", "what do you think", "help me decide", "guide me"
        ]
        for pattern in follow_up_patterns:
            training_data.append({'text': pattern, 'intent': 'follow_up_price', 'entities': {}})

        return training_data
    
    def _split_data(self, data: List[Dict], test_size: float = 0.2) -> Tuple[List[Dict], List[Dict]]:
        """Split data into training and testing sets"""
        # Shuffle data for random split
        import random
        random.shuffle(data)
        
        split_index = int(len(data) * (1 - test_size))
        train_data = data[:split_index]
        test_data = data[split_index:]
        
        return train_data, test_data
    
    def _train_intent_classifier(self, train_data: List[Dict], test_data: List[Dict]):
        """Train intent classification model"""
        print("🧠 Training intent classification model...")
        
        # Prepare features and labels
        texts = [item['text'] for item in train_data]
        intents = [item['intent'] for item in train_data]
        
        # Create TF-IDF vectorizer
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 3),
            stop_words='english',
            min_df=2
        )
        
        # Transform text to features
        X_train = self.vectorizer.fit_transform(texts)
        
        # Train Random Forest classifier
        self.intent_classifier = RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42
        )
        
        self.intent_classifier.fit(X_train, intents)
        
        # Evaluate on test data
        test_texts = [item['text'] for item in test_data]
        test_intents = [item['intent'] for item in test_data]
        X_test = self.vectorizer.transform(test_texts)
        
        y_pred = self.intent_classifier.predict(X_test)
        accuracy = accuracy_score(test_intents, y_pred)
        
        print(f"✅ Intent classification model trained with {accuracy:.4f} accuracy")
        
        # Print detailed classification report
        print("\n📊 Classification Report:")
        print(classification_report(test_intents, y_pred))
    
    def _save_models(self):
        """Save all trained models"""
        joblib.dump(self.intent_classifier, f'{self.model_dir}/intent_classifier.pkl')
        joblib.dump(self.vectorizer, f'{self.model_dir}/vectorizer.pkl')
    
    def _evaluate_models(self, test_data: List[Dict]):
        """Evaluate model performance on test data"""
        print("📊 Evaluating model performance...")
        
        if not test_data:
            print("⚠️ No test data available for evaluation")
            return
        
        # Prepare test data
        test_texts = [item['text'] for item in test_data]
        test_intents = [item['intent'] for item in test_data]
        
        # Transform features
        X_test = self.vectorizer.transform(test_texts)
        
        # Predict and evaluate
        y_pred = self.intent_classifier.predict(X_test)
        accuracy = accuracy_score(test_intents, y_pred)
        
        print(f"🎯 Final Model Performance:")
        print(f"   Accuracy: {accuracy:.4f}")
        print(f"   Test samples: {len(test_data)}")
        print(f"   Training samples: {len(test_data) * 4}")  # 80% of total
    
    def process_message(self, message: str, session: ChatSession, user_id: int = None) -> Dict:
        """Process user message with AI-powered understanding (now with spaCy entity extraction)"""
        try:
            filtered = False  # PATCH: define filtered at the start
            print(f"🤖 AI PROCESSING: '{message}'")
            processed_message = self._preprocess_text(message)
            intent, confidence = self._detect_intent_ai(processed_message, session)
            entities = self._extract_entities_spacy(processed_message)
            sentiment = self._analyze_sentiment_ai(processed_message)
            confidence = self._apply_context_adjustments(processed_message, intent, confidence, session)
            recommendations, filtered = self._get_ai_recommendations(intent, entities, session, user_id)  # PATCH: get filtered flag
            self._track_interaction(session, message, intent, entities, sentiment)
            if not isinstance(recommendations, list):
                print(f"[DEFENSIVE] Recommendations is not a list! Type: {type(recommendations)}, Value: {recommendations}")
                recommendations = []
            # --- Conversational Context/Flow ---
            # Track last intent, entities, recommendations in session.preferences
            if hasattr(session, 'preferences') and session.preferences is not None:
                context = session.preferences.get('context', {})
                context['last_intent'] = intent
                context['last_entities'] = entities
                # Store last recommendations as summary dicts (id, name, price, description, etc.)
                context['last_recommendations'] = [
                    {
                        'id': rec['id'],
                        'name': rec.get('name'),
                        'price': rec.get('price'),
                        'discount_price': rec.get('discount_price'),
                        'category': rec.get('category'),
                        'brand': rec.get('brand'),
                        'description': rec.get('description', ''),
                        'score': rec.get('score'),
                        'effective_price': rec.get('effective_price'),
                        'image': rec.get('image'),
                    }
                    for rec in recommendations
                ] if recommendations else context.get('last_recommendations', [])
                # Always update last_categories to the categories used for the search (including mapped/fallback)
                if entities.get('categories'):
                    context['last_categories'] = entities['categories']
                elif filtered and recommendations:
                    # If fallback mapping was used, set last_categories to the categories of the recommended products
                    context['last_categories'] = list(set([rec.get('category') for rec in recommendations if rec.get('category')]))
                session.preferences['context'] = context
                session.save()
            # --- Context-aware follow-up for comparison_request ---
            if intent == 'comparison_request':
                session_context = self._get_session_context(session)
                last_recs = session_context.get('last_recommendations', [])
                last_cats = session_context.get('last_categories', [])
                if last_recs and len(last_recs) >= 2:
                    # Filter last_recs by last_categories if present
                    if last_cats:
                        last_cats_set = set([cat.lower() for cat in last_cats])
                        filtered_recs = [rec for rec in last_recs if rec.get('category', '').lower() in last_cats_set]
                        if len(filtered_recs) >= 2:
                            recommendations = filtered_recs
                        else:
                            recommendations = last_recs
                    else:
                        recommendations = last_recs
            response_text = self._generate_ai_response(intent, entities, sentiment, session, user_id, recommendations)
            # --- User Query Logging (JSON) ---
            log_entry = {
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": user_id,
                "session_id": getattr(session, 'id', None),
                "message": message,
                "predicted_intent": intent,
                "entities": entities,
                "bot_response": response_text
            }
            try:
                with open("backend/chatbot_user_queries.json", "a", encoding="utf-8") as f:
                    f.write(json.dumps(log_entry) + "\n")
            except Exception as log_err:
                print(f"[LOGGING ERROR] {log_err}")
            return {
                'intent': intent,
                'confidence': confidence,
                'entities': entities,
                'sentiment': sentiment,
                'response': response_text,
                'recommendations': recommendations,
                'ai_model': 'comprehensive_ml_spacy'
            }
        except Exception as e:
            print(f"Error in process_message: {e}")
            return self._get_fallback_response(message)
    
    def _preprocess_text(self, text: str) -> str:
        """Preprocess text for AI models"""
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters but keep spaces
        text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def _detect_intent_ai(self, message: str, session: ChatSession) -> Tuple[str, float]:
        """Use AI to detect intent with confidence score"""
        try:
            # First, try pattern matching for common intents
            pattern_intent = self._detect_intent_patterns(message)
            if pattern_intent:
                return pattern_intent, 0.9  # High confidence for pattern matches
            
            # Transform message to features
            features = self.vectorizer.transform([message])
            
            # Predict intent
            intent = self.intent_classifier.predict(features)[0]
            
            # Get confidence score
            confidence_scores = self.intent_classifier.predict_proba(features)[0]
            confidence = max(confidence_scores)
            
            # Apply context-aware adjustments
            confidence = self._apply_context_adjustments(message, intent, confidence, session)
            
            print(f"🧠 AI INTENT: '{message}' → {intent} (confidence: {confidence:.3f})")
            
            return intent, confidence
            
        except Exception as e:
            print(f"Intent detection error: {e}")
            # Fallback to pattern matching
            pattern_intent = self._detect_intent_patterns(message)
            if pattern_intent:
                return pattern_intent, 0.8
            return 'product_search', 0.5
    
    def _detect_intent_patterns(self, message: str) -> str:
        """Detect intent using pattern matching as fallback"""
        import re
        message_lower = message.lower().strip()
        
        # HIGHEST PRIORITY: Greeting and Goodbye patterns (must be exact matches)
        greeting_patterns = [
            r'^\s*(hi|hello|hey|good morning|good afternoon|good evening|greetings|hi there|hello there|hey there|good day|morning|afternoon|evening)\s*$',
            r'^\s*(how are you|what\'s up)\s*$'
        ]
        for pattern in greeting_patterns:
            if re.search(pattern, message_lower):
                return 'greeting'
        
        goodbye_patterns = [
            r'^\s*(bye|goodbye|see you|thanks|thank you|thank you bye|thanks bye|see you later|have a good day|take care|bye bye|see ya|farewell|that\'s all)\s*$',
            r'^\s*(I am done|no more questions|that\'s it for now)\s*$'
        ]
        for pattern in goodbye_patterns:
            if re.search(pattern, message_lower):
                return 'goodbye'
        
        # HIGH PRIORITY: Brand search patterns (must contain brand names)
        brand_patterns = [
            r'\b(nike|adidas|puma|reebok|converse|vans|jordan|under armour|apple|samsung|sony|lg)\b.*\b(product|item|shoes|clothes|phone|laptop|collection|brand)\b',
            r'\b(show|find|search|look for|get|want|need|display|browse)\b.*\b(nike|adidas|puma|reebok|converse|vans|jordan|under armour|apple|samsung|sony|lg)\b',
            r'^\s*(nike|adidas|puma|reebok|converse|vans|jordan|under armour|apple|samsung|sony|lg)\s*$',
            # NEW: More specific brand patterns
            r'\b(nike|adidas|puma|reebok|converse|vans|jordan|under armour|apple|samsung|sony|lg)\b.*\b(shoes?|phones?|laptops?|clothes?|products?)\b',
            r'\b(shoes?|phones?|laptops?|clothes?|products?)\b.*\b(nike|adidas|puma|reebok|converse|vans|jordan|under armour|apple|samsung|sony|lg)\b',
            # NEW: Brand + product combinations
            r'\b(nike|adidas|puma|reebok|converse|vans|jordan|under armour)\b.*\b(shoes?|sneakers?|clothes?|apparel)\b',
            r'\b(apple|samsung|sony|lg)\b.*\b(phones?|laptops?|electronics?|devices?)\b'
        ]
        for pattern in brand_patterns:
            if re.search(pattern, message_lower):
                return 'brand_search'
        
        # HIGH PRIORITY: Category browse patterns (must be about categories/sections)
        category_patterns = [
            r'\b(show|browse|look at|see|display)\b.*\b(category|section|department|categories|collection)\b',
            r'\b(electronics|clothing|books|home|sports|beauty|winter wear|summer wear|shoes|apparel|accessories)\b.*\b(category|section|department|collection)\b',
            r'^\s*(electronics|clothing|books|home|sports|beauty|winter wear|summer wear|shoes|apparel|accessories)\s*$'
        ]
        for pattern in category_patterns:
            if re.search(pattern, message_lower):
                return 'category_browse'
        
        # HIGH PRIORITY: Comparison patterns (must contain comparison keywords)
        comparison_patterns = [
            r'\b(compare|comparison|difference|vs|versus|which is better|which one|which should I buy|which to buy|better option|best choice|recommend between|compare prices|compare quality|compare features|pros and cons|help me decide)\b',
            r'\b(compare products|compare these|compare items|compare options|which is best|which is better|what\'s the difference|which one should I choose|which one should I buy|which product|which should I buy|which is better|what\'s the difference)\b'
        ]
        for pattern in comparison_patterns:
            if re.search(pattern, message_lower):
                return 'comparison_request'
        
        # HIGH PRIORITY: Price inquiry patterns (must contain price-related keywords)
        price_patterns = [
            r'\b(price|cost|how much|expensive|cheap|budget|affordable|pricing|price range|cost range|under \$?\d+|over \$?\d+|less than \$?\d+|more than \$?\d+|\d+ dollars?|\$\d+)\b',
            r'\b(what\'s the price|how much does it cost|price information|price details|cost information|pricing|price check|price of this|cost of this)\b'
        ]
        for pattern in price_patterns:
            if re.search(pattern, message_lower):
                return 'price_inquiry'
        
        # MEDIUM PRIORITY: Recommendation patterns
        recommend_patterns = [
            r'\b(recommend|suggest|what should I buy|help me choose|best|top picks|popular items|trending products|what\'s popular|best sellers|customer favorites|recommend me|what should I get|what do you recommend|best options|trending now|hot items|must-have products|what\'s in style|fashion recommendations|style advice)\b'
        ]
        for pattern in recommend_patterns:
            if re.search(pattern, message_lower):
                return 'recommendation_request'
        
        # MEDIUM PRIORITY: Product search patterns (generic product mentions - NOT brand-specific)
        search_patterns = [
            r'\b(show|find|search|look for|get|want|need|display|browse)\b.*\b(product|item|thing|shoes|clothes|electronics|phone|laptop|t-shirt|hoodie|dress|jeans|jacket|shirt|pants|apparel|wear|tops|bottoms|accessories)\b',
            # NEW: More specific product patterns that don't conflict with brands
            r'\b(shoes?|clothes?|electronics?|phones?|laptops?|t-shirts?|hoodies?|lipsticks?|dresses?|jeans?|jackets?|shirts?|pants?|apparel|wear|tops|bottoms|accessories)\b(?!.*\b(nike|adidas|puma|reebok|converse|vans|jordan|under armour|apple|samsung|sony|lg)\b)',
            # NEW: Generic product requests without brand mentions
            r'\b(show|find|search|look for|get|want|need|display|browse)\b.*\b(product|item|thing)\b(?!.*\b(nike|adidas|puma|reebok|converse|vans|jordan|under armour|apple|samsung|sony|lg)\b)'
        ]
        for pattern in search_patterns:
            if re.search(pattern, message_lower):
                return 'product_search'
        
        # LOW PRIORITY: Fallback patterns
        variant_patterns = [
            r'\b(size|color|colour|variant|option|available)\b'
        ]
        for pattern in variant_patterns:
            if re.search(pattern, message_lower):
                return 'variant_inquiry'
        
        quantity_patterns = [
            r'\b(how many|quantity|amount|number)\b'
        ]
        for pattern in quantity_patterns:
            if re.search(pattern, message_lower):
                return 'quantity_request'
        
        cart_patterns = [
            r'\b(add|put|place)\b.*\b(cart|basket)\b'
        ]
        for pattern in cart_patterns:
            if re.search(pattern, message_lower):
                return 'add_to_cart'
        
        order_patterns = [
            r'\b(order|status|track|where)\b'
        ]
        for pattern in order_patterns:
            if re.search(pattern, message_lower):
                return 'order_status'
        
        support_patterns = [
            r'\b(help|support|problem|issue|trouble)\b'
        ]
        for pattern in support_patterns:
            if re.search(pattern, message_lower):
                return 'support_request'
        
        return None
    
    def _extract_entities_spacy(self, message: str) -> dict:
        """Extract entities using spaCy and custom matching (robust category/keyword fallback, size/color, price, quantity)"""
        doc = self.nlp(message)
        brands = []
        categories = []
        colors = []
        sizes = []
        price_range = None
        quantity = None
        # Detect if this is a follow-up/comparison query
        follow_up_keywords = ['which one', 'which is', 'which', 'best', 'better', 'value', 'worth', 'stylish', 'perfect', 'party', 'occasion', 'event', 'formal', 'casual', 'compare']
        lowered_message = message.lower()
        is_follow_up = any(kw in lowered_message for kw in follow_up_keywords)
        # --- Retail mapping: add mapped categories if retail term is present ---
        mapped_categories = []
        for retail_term, mapped in self.retail_category_mapping.items():
            if retail_term in lowered_message:
                mapped_categories.extend(mapped)
        # Brand matching
        for token in doc:
            for brand in self._brand_list:
                if brand and brand.lower() in token.text.lower():
                    brands.append(brand)
        # Multi-word category matching (skip for follow-up)
        if not is_follow_up:
            for cat in self._category_list:
                cat_lower = cat.lower()
                if cat_lower in lowered_message:
                    categories.append(cat)
        # Fallback: single-word category matching (skip for follow-up)
        if not categories and not is_follow_up:
            tokens = [token.text.lower() for token in doc]
            for cat in self._category_list:
                cat_lower = cat.lower()
                for token_text in tokens:
                    singular = token_text[:-1] if token_text.endswith('s') and len(token_text) > 3 else token_text
                    if cat_lower in [token_text, singular] or token_text in cat_lower or singular in cat_lower or cat_lower in token_text or cat_lower in singular:
                        categories.append(cat)
        # Add mapped categories if not already present
        for mapped_cat in mapped_categories:
            if mapped_cat not in categories and mapped_cat in self._category_list:
                categories.append(mapped_cat)
        print(f"[DEBUG] Extracted categories: {categories} from message: '{message}'")
        if categories:
            categories = [categories[0]]
        # Color matching
        for token in doc:
            for color in self._color_list:
                if color in token.text.lower():
                    colors.append(color)
        print(f"[DEBUG] Extracted colors: {colors} from message: '{message}'")
        # Size extraction (numbers, S/M/L/XL, etc.)
        size_keywords = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', 'small', 'medium', 'large']
        for token in doc:
            if token.like_num and token.text.isdigit() and int(token.text) < 100:  # likely a size, not a price
                sizes.append(token.text)
            elif token.text.lower() in size_keywords:
                sizes.append(token.text.upper())
        print(f"[DEBUG] Extracted sizes: {sizes} from message: '{message}'")
        # Price extraction (under, over, between)
        import re
        price_under = re.search(r'(?:under|less than|below)\s*\$?(\d+)', lowered_message)
        price_over = re.search(r'(?:over|more than|above)\s*\$?(\d+)', lowered_message)
        price_between = re.search(r'between\s*\$?(\d+)\s*(?:and|to)\s*\$?(\d+)', lowered_message)
        if price_under:
            price = float(price_under.group(1))
            price_range = (0, price)
        elif price_over:
            price = float(price_over.group(1))
            price_range = (price, 10000)
        elif price_between:
            price1 = float(price_between.group(1))
            price2 = float(price_between.group(2))
            price_range = (min(price1, price2), max(price1, price2))
        else:
            # Fallback: spaCy MONEY entity
            for ent in doc.ents:
                if ent.label_ == 'MONEY':
                    price_text = ent.text.replace('$', '').replace(',', '').strip()
                    try:
                        price = float(price_text)
                        price_range = (price, price)
                    except Exception:
                        pass
        print(f"[DEBUG] Extracted price_range: {price_range} from message: '{message}'")
        # Quantity extraction (skip for follow-up)
        if not is_follow_up:
            quantity_match = re.search(r'(?:show me|find|get|show|list|display|see|recommend|give me|give)\s*(\d+)\s*\w+', lowered_message)
            if quantity_match:
                quantity = int(quantity_match.group(1))
            else:
                # Fallback: look for a number before a category
                for token in doc:
                    if token.like_num and token.text.isdigit():
                        next_token = token.nbor(1) if token.i + 1 < len(doc) else None
                        if next_token and next_token.text.lower() in [c.lower() for c in self._category_list]:
                            quantity = int(token.text)
        print(f"[DEBUG] Extracted quantity: {quantity} from message: '{message}'")
        # Fallback: if no category found, use top keyword as pseudo-category (skip for follow-up)
        # But don't create fallback categories if colors are already detected (to avoid "Grey" category)
        if not categories and not is_follow_up and not colors:
            for token in doc:
                if token.pos_ in ['NOUN', 'PROPN'] and len(token.text) > 2:
                    categories.append(token.text.capitalize())
                    print(f"[DEBUG] Fallback category used: {token.text.capitalize()}")
                    break
        # Remove duplicates
        brands = list(set(brands))
        categories = list(set(categories))
        colors = list(set(colors))
        sizes = list(set(sizes))
        return {
            'brands': brands,
            'categories': categories,
            'colors': colors,
            'sizes': sizes,
            'price_range': price_range,
            'quantity': quantity
        }
    
    def _extract_brands_semantic(self, message: str, message_embedding: np.ndarray) -> List[str]:
        """Extract brands using semantic similarity"""
        brands = []
        
        # Get all unique brand names from products
        brand_names = set()
        products = Product.objects.filter(is_active=True)
        
        for product in products:
            # Extract brand from product name/description
            product_text = f"{product.name} {product.description}".lower()
            
            # Common brand patterns
            brand_patterns = ['nike', 'adidas', 'apple', 'samsung', 'sony', 'lg', 'hp', 'dell', 'lenovo']
            for brand in brand_patterns:
                if brand in product_text and brand not in brand_names:
                    brand_names.add(brand)
        
        # Calculate semantic similarity with message
        for brand in brand_names:
            brand_embedding = self.sentence_encoder.encode(brand)
            similarity = np.dot(message_embedding, brand_embedding) / (np.linalg.norm(message_embedding) * np.linalg.norm(brand_embedding))
            
            if similarity > 0.3 or brand.lower() in message.lower():
                brands.append(brand)
        
        return brands
    
    def _extract_categories_semantic(self, message: str, message_embedding: np.ndarray) -> List[str]:
        """Extract categories using semantic similarity"""
        categories = []
        
        # Get all categories
        all_categories = Category.objects.all()
        
        for category in all_categories:
            category_embedding = self.sentence_encoder.encode(category.name)
            similarity = np.dot(message_embedding, category_embedding) / (np.linalg.norm(message_embedding) * np.linalg.norm(category_embedding))
            
            if similarity > 0.4 or category.name.lower() in message.lower():
                categories.append(category.name)
        
        return categories
    
    def _extract_colors_ai(self, message: str) -> List[str]:
        """Extract colors using AI-enhanced pattern matching"""
        colors = []
        
        # Color keywords with semantic variations
        color_patterns = {
            'red': ['red', 'crimson', 'scarlet', 'ruby'],
            'blue': ['blue', 'navy', 'azure', 'cobalt'],
            'green': ['green', 'emerald', 'forest', 'olive'],
            'yellow': ['yellow', 'golden', 'amber', 'lemon'],
            'black': ['black', 'ebony', 'onyx', 'charcoal'],
            'white': ['white', 'ivory', 'cream', 'pearl'],
            'purple': ['purple', 'violet', 'lavender', 'plum'],
            'pink': ['pink', 'rose', 'magenta', 'fuchsia'],
            'orange': ['orange', 'tangerine', 'coral', 'peach'],
            'brown': ['brown', 'chocolate', 'tan', 'beige']
        }
        
        message_lower = message.lower()
        
        for color, variations in color_patterns.items():
            for variation in variations:
                if variation in message_lower:
                    colors.append(color)
                    break
        
        return colors
    
    def _extract_price_range_ai(self, message: str) -> Optional[Tuple[float, float]]:
        """Extract price range using NLP"""
        # Price patterns
        price_patterns = [
            r'\$(\d+(?:\.\d{2})?)\s*-\s*\$(\d+(?:\.\d{2})?)',  # $50 - $100
            r'(\d+(?:\.\d{2})?)\s*-\s*(\d+(?:\.\d{2})?)\s*dollars?',  # 50 - 100 dollars
            r'under\s*\$?(\d+(?:\.\d{2})?)',  # under $50
            r'over\s*\$?(\d+(?:\.\d{2})?)',  # over $100
            r'less\s*than\s*\$?(\d+(?:\.\d{2})?)',  # less than $50
            r'more\s*than\s*\$?(\d+(?:\.\d{2})?)',  # more than $100
        ]
        
        message_lower = message.lower()
        
        for pattern in price_patterns:
            matches = re.findall(pattern, message_lower)
            if matches:
                if len(matches[0]) == 2:  # Range
                    min_price = float(matches[0][0])
                    max_price = float(matches[0][1])
                    return (min_price, max_price)
                elif len(matches[0]) == 1:  # Single price
                    price = float(matches[0])
                    if 'under' in message_lower or 'less' in message_lower:
                        return (0, price)
                    elif 'over' in message_lower or 'more' in message_lower:
                        return (price, float('inf'))
        
        return None
    
    def _extract_quantity_ai(self, message: str) -> Optional[int]:
        """Extract quantity using NLP"""
        # Quantity patterns
        quantity_patterns = [
            r'(\d+)\s*(?:items?|products?|things?)',  # 3 items
            r'show\s*me\s*(\d+)',  # show me 5
            r'(\d+)\s*(?:of|pieces?)',  # 5 of them
            r'quantity\s*(\d+)',  # quantity 3
        ]
        
        message_lower = message.lower()
        
        for pattern in quantity_patterns:
            matches = re.findall(pattern, message_lower)
            if matches:
                return int(matches[0])
        
        return None
    
    def _extract_keywords_ai(self, message: str) -> List[str]:
        """Extract keywords using TF-IDF and pattern matching"""
        try:
            # Common follow-up question keywords
            follow_up_keywords = [
                'best', 'better', 'recommend', 'choose', 'which', 'what about', 'how about',
                'tell me about', 'show me more', 'more options', 'other choices',
                'compare', 'comparison', 'difference', 'why', 'why is', 'why should',
                'value', 'worth', 'quality', 'good', 'great', 'excellent', 'perfect'
            ]
            
            # Common product-related keywords
            product_keywords = [
                'product', 'item', 'thing', 'shoes', 'clothes', 'electronics', 'phone',
                'laptop', 'shirt', 'pants', 'dress', 'jacket', 'hoodie', 'sneakers',
                'boots', 'sandals', 'accessories', 'bag', 'watch', 'jewelry'
            ]
            
            # Common action keywords
            action_keywords = [
                'show', 'find', 'search', 'look', 'get', 'want', 'need', 'buy',
                'purchase', 'order', 'add', 'put', 'place', 'see', 'view'
            ]
            
            # Extract keywords using pattern matching
            keywords = []
            message_lower = message.lower()

            # Recognize the phrase 'value for money' as a single keyword
            if "value for money" in message_lower:
                keywords.append("value for money")
            
            # Check for follow-up keywords
            for keyword in follow_up_keywords:
                if keyword in message_lower:
                    keywords.append(keyword)
            
            # Check for product keywords
            for keyword in product_keywords:
                if keyword in message_lower:
                    keywords.append(keyword)
            
            # Check for action keywords
            for keyword in action_keywords:
                if keyword in message_lower:
                    keywords.append(keyword)
            
            # Add any other significant words (3+ characters)
            words = message_lower.split()
            for word in words:
                if len(word) >= 3 and word not in keywords and word not in ['the', 'and', 'for', 'you', 'are', 'with', 'this', 'that', 'have', 'been', 'they', 'will', 'your', 'from', 'their', 'know', 'would', 'there', 'could', 'time', 'very', 'into', 'just', 'only', 'come', 'over', 'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us']:
                    keywords.append(word)
            
            # Remove duplicates while preserving order
            seen = set()
            unique_keywords = []
            for keyword in keywords:
                if keyword not in seen:
                    seen.add(keyword)
                    unique_keywords.append(keyword)
            
            return unique_keywords[:10]  # Limit to 10 keywords
            
        except Exception as e:
            print(f"Keyword extraction error: {e}")
            return []
    
    def _analyze_sentiment_ai(self, message: str) -> str:
        """Analyze sentiment using AI"""
        try:
            if self.sentiment_analyzer:
                result = self.sentiment_analyzer(message)
                sentiment = result[0]['label'].lower()
                
                # Map to our sentiment categories
                if sentiment in ['positive', 'pos']:
                    return 'positive'
                elif sentiment in ['negative', 'neg']:
                    return 'negative'
                else:
                    return 'neutral'
            else:
                # Fallback to simple sentiment analysis
                return self._analyze_sentiment_simple(message)
                
        except Exception as e:
            print(f"Sentiment analysis error: {e}")
            return 'neutral'
    
    def _analyze_sentiment_simple(self, message: str) -> str:
        """Simple sentiment analysis using keyword matching"""
        message_lower = message.lower()
        
        # Positive keywords
        positive_words = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'awesome', 'perfect', 'best', 'nice', 'happy', 'excited']
        
        # Negative keywords
        negative_words = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'worst', 'horrible', 'disappointed', 'angry', 'frustrated', 'sad', 'upset']
        
        positive_count = sum(1 for word in positive_words if word in message_lower)
        negative_count = sum(1 for word in negative_words if word in message_lower)
        
        if positive_count > negative_count:
            return 'positive'
        elif negative_count > positive_count:
            return 'negative'
        else:
            return 'neutral'
    
    def _apply_context_adjustments(self, message: str, intent: str, confidence: float, session: ChatSession) -> float:
        """Apply context-aware adjustments to confidence score"""
        adjusted_confidence = confidence
        
        # Boost confidence for context-appropriate intents
        if session.products_viewed.exists():
            if intent in ['context_question', 'recommendation_request', 'comparison_request']:
                adjusted_confidence *= 1.2
            
            if intent == 'show_more_request':
                adjusted_confidence *= 1.3
        
        # Boost confidence for follow-up questions after brand comparison
        if hasattr(session, 'last_intent') and session.last_intent == 'brand_comparison':
            if intent in ['follow_up_price', 'follow_up_performance', 'follow_up_style', 'follow_up_features']:
                adjusted_confidence *= 1.4
        
        # Reduce confidence for conflicting intents
        if hasattr(session, 'last_intent') and session.last_intent == 'greeting' and intent == 'goodbye':
            adjusted_confidence *= 0.7
        
        return min(adjusted_confidence, 1.0)
    
    def _generate_ai_response(self, intent: str, entities: Dict, sentiment: str, 
                            session: ChatSession, user_id: int = None, recommendations: List[Dict] = None) -> str:
        """Generate context-aware AI response"""
        try:
            # Get session context for better response generation
            session_context = self._get_session_context(session)
            
            # Generate intent-specific responses
            if intent == 'greeting':
                return self._generate_greeting_response(sentiment)
            elif intent == 'goodbye':
                return self._generate_goodbye_response(sentiment)
            elif intent == 'product_search':
                return self._generate_product_search_response(entities, recommendations, sentiment)
            elif intent == 'brand_search':
                return self._generate_brand_search_response(entities, recommendations, sentiment)
            elif intent == 'recommendation_request':
                return self._generate_recommendation_response(entities, recommendations, sentiment)
            elif intent == 'comparison_request':
                return self._generate_comparison_response(entities, recommendations, sentiment, session)
            elif intent == 'price_inquiry':
                return self._generate_price_response(entities, recommendations, sentiment)
            elif intent == 'trending_request':
                return self._generate_trending_response(entities, recommendations, sentiment)
            elif intent == 'rating_inquiry':
                return self._generate_rating_response(entities, recommendations, sentiment)
            elif intent == 'alternatives_request':
                return self._generate_alternatives_response(entities, recommendations, sentiment)
            elif intent == 'context_question':
                return self._generate_context_response(entities, recommendations, sentiment)
            elif intent == 'sales_assistance':
                return self._generate_sales_assistance_response(entities, sentiment)
            else:
                return self._generate_general_response(intent, entities, recommendations, sentiment)
                
        except Exception as e:
            print(f"Response generation error: {e}")
            return "I'm here to help you find the perfect products! What are you looking for today?"
    
    def _get_ai_recommendations(self, intent: str, entities: Dict, session: ChatSession, user_id: int = None) -> Tuple[List[Dict], bool]:
        """Get AI-powered recommendations based on intent and context (dynamic, future-proof, strict filtering, size/color/alternatives)"""
        try:
            print(f"🔍 Getting recommendations for intent: {intent}, entities: {entities}")
            if intent in ['greeting', 'goodbye']:
                print(f"🚫 No recommendations for {intent} intent")
                return [], False
            session_context = self._get_session_context(session)
            print(f"📋 Retrieved session context: {session_context}")
            products = Product.objects.filter(is_active=True)
            print(f"📦 Total active products: {products.count()}")
            filtered = False
            # --- SALESPERSON-LIKE INTENT HANDLING ---
            
            # --- Alternatives intent: recommend products in same category but different brands ---
            if intent == 'alternatives_request':
                # If context has last product, find alternatives in same category
                last_product_id = session_context.get('last_product_id')
                if last_product_id:
                    try:
                        last_product = Product.objects.get(id=last_product_id)
                        if last_product.category:
                            products = products.filter(category=last_product.category)
                            # Exclude the current product
                            products = products.exclude(id=last_product_id)
                            print(f"🔄 After alternatives filter (context): {products.count()} products")
                            filtered = True
                    except Product.DoesNotExist:
                        pass
                elif entities.get('brands') and entities.get('categories'):
                    category_filter = Q()
                    for category in entities['categories']:
                        category_filter |= Q(category__name__icontains=category)
                    products = products.filter(category_filter)
                    for brand in entities['brands']:
                        products = products.exclude(name__icontains=brand)
                    print(f"🔄 After alternatives filter: {products.count()} products")
                    filtered = True
            
            # --- Trending intent: show most viewed/popular products ---
            elif intent == 'trending_request':
                # Order by views (if available) or by creation date (newest first)
                products = products.order_by('-created_at')[:10]
                print(f"🔥 After trending filter: {products.count()} products")
                filtered = True
            
            # --- Rating intent: show highly rated products ---
            elif intent == 'rating_inquiry':
                # Order by average rating (if available) or by review count
                products = products.annotate(
                    avg_rating=Avg('reviews__rating'),
                    review_count=Count('reviews')
                ).filter(review_count__gt=0).order_by('-avg_rating', '-review_count')
                print(f"⭐ After rating filter: {products.count()} products")
                filtered = True
            
            # --- Comparison intent: show multiple products for comparison ---
            elif intent == 'comparison_request':
                # Get more products for comparison (up to 5)
                quantity = entities.get('quantity', 5)
                if quantity is None:
                    quantity = 5
                products = products[:quantity]
                print(f"⚖️ After comparison filter: {products.count()} products")
                filtered = True
            
            # --- Sales assistance: show a variety of options ---
            elif intent == 'sales_assistance':
                # Show diverse options across categories
                products = products.order_by('?')[:8]  # Random selection for variety
                print(f"🛍️ After sales assistance filter: {products.count()} products")
                filtered = True
            
            # --- Context questions: use last shown products ---
            elif intent == 'context_question':
                last_recs = session_context.get('last_recommendations', [])
                if last_recs:
                    # Return the last shown products for context
                    product_ids = [rec.get('id') for rec in last_recs if rec.get('id')]
                    if product_ids:
                        products = products.filter(id__in=product_ids)
                        print(f"📋 After context filter: {products.count()} products")
                        filtered = True
            # Strict category filtering first
            if entities.get('categories'):
                category_filter = Q()
                for category in entities['categories']:
                    category_filter |= Q(category__name__icontains=category)
                products = products.filter(category_filter)
                print(f"📂 After strict category filter: {products.count()} products")
                filtered = True
                # If color is also specified, filter by color on top of category
                if entities.get('colors'):
                    color_products = products.filter(
                        variants__options__variant_type__name__iexact='Color',
                        variants__options__value__in=entities['colors']
                    ).distinct()
                    products = color_products
                    print(f"🎨 After color+category filter: {products.count()} products")
            # --- NEW: If no products found, try mapped retail categories ---
            # Only fallback to mapped retail categories if color, brand, size, and price are NOT specified
            if (
                not products.exists() and entities.get('categories')
                and not entities.get('colors')
                and not entities.get('brands')
                and not entities.get('sizes')
                and not entities.get('price_range')
            ):
                mapped_products = Product.objects.filter(is_active=True)
                mapped_filter = Q()
                for category in entities['categories']:
                    # Use retail mapping if available
                    mapped_cats = self.retail_category_mapping.get(category.lower(), [])
                    for mapped_cat in mapped_cats:
                        mapped_filter |= Q(category__name__icontains=mapped_cat)
                if mapped_filter:
                    mapped_products = mapped_products.filter(mapped_filter)
                    if mapped_products.exists():
                        print(f"🗺️ After mapped retail category filter: {mapped_products.count()} products")
                        products = mapped_products
                        filtered = True
            # If still no products, try brand
            if not products.exists() and entities.get('brands'):
                brand_filter = Q()
                for brand in entities['brands']:
                    brand_filter |= Q(name__icontains=brand) | Q(description__icontains=brand)
                products = Product.objects.filter(is_active=True).filter(brand_filter)
                print(f"🏷️ After brand filter: {products.count()} products")
                filtered = True
            # If still no products, try color (only if category was not specified)
            if not products.exists() and entities.get('colors') and not entities.get('categories'):
                color_products = Product.objects.filter(is_active=True).filter(
                    variants__options__variant_type__name__iexact='Color',
                    variants__options__value__in=entities['colors']
                ).distinct()
                products = color_products
                print(f"🎨 After color filter: {products.count()} products")
                filtered = True
            # If still no products, try size (search in name/description)
            if not products.exists() and entities.get('sizes'):
                size_filter = Q()
                for size in entities['sizes']:
                    size_filter |= (
                        Q(name__icontains=size) | Q(description__icontains=size)
                    )
                products = Product.objects.filter(is_active=True).filter(size_filter)
                print(f"📏 After size filter: {products.count()} products")
                filtered = True
            # If still no products, try price range
            if not products.exists() and entities.get('price_range'):
                min_price, max_price = entities['price_range']
                products = Product.objects.filter(is_active=True).annotate(
                    effective_price=Case(
                        When(discount_price__isnull=False, then=F('discount_price')),
                        default=F('price')
                    )
                ).filter(
                    effective_price__gte=min_price,
                    effective_price__lte=max_price
                )
                print(f"💰 After price filter: {products.count()} products")
                filtered = True
            # --- NEW: If still no products, try keyword fallback (search name/description/category for user query/keywords) ---
            # Only fallback to keyword search if neither category nor color is specified
            if not products.exists() and not entities.get('categories') and not entities.get('colors'):
                keyword_filter = Q()
                # Try all entities as keywords
                for key in ['categories', 'brands', 'colors', 'sizes', 'keywords']:
                    for kw in entities.get(key, []) or []:
                        keyword_filter |= (
                            Q(name__icontains=kw) | Q(description__icontains=kw) | Q(category__name__icontains=kw)
                        )
                # Fallback: use the original message as a keyword
                if hasattr(session, 'last_message') and session.last_message:
                    keyword_filter |= (
                        Q(name__icontains=session.last_message) | Q(description__icontains=session.last_message)
                    )
                products = Product.objects.filter(is_active=True).filter(keyword_filter)
                print(f"🔍 After keyword fallback filter: {products.count()} products")
                filtered = True
            # --- CONTEXT-AWARE VARIANT INQUIRY ---
            if intent == 'variant_inquiry' and (not products.exists() or not entities.get('categories')):
                # Use last shown product from session context if available
                last_recs = session_context.get('last_recommendations', [])
                # Also check for pronouns in the message to treat as follow-up
                import re
                pronoun_followup = False
                if 'message' in locals():
                    pronoun_followup = bool(re.search(r'\b(it|this|that)\b', message.lower()))
                if last_recs and (not entities.get('categories') or pronoun_followup or not products.exists()):
                    # Try to find the product by name if user mentioned it, else use last shown
                    product_id = last_recs[0].get('id')
                    try:
                        product = Product.objects.get(id=product_id)
                        # Get all color options for this product
                        color_type = ProductVariantType.objects.filter(name__iexact='Color').first()
                        if color_type:
                            color_options = ProductVariantOption.objects.filter(variant_type=color_type, variants__product=product).distinct()
                            colors = [opt.value for opt in color_options]
                        else:
                            colors = []
                        # Get all size options for this product
                        size_type = ProductVariantType.objects.filter(name__iexact='Size').first()
                        if size_type:
                            size_options = ProductVariantOption.objects.filter(variant_type=size_type, variants__product=product).distinct()
                            sizes = [opt.value for opt in size_options]
                        else:
                            sizes = []
                        # Return a special recommendation dict for the UI/response
                        return [{
                            'id': product.id,
                            'name': product.name,
                            'category': product.category.name if product.category else None,
                            'brand': getattr(product, 'brand', None),
                            'price': float(product.price) if hasattr(product, 'price') else None,
                            'discount_price': float(product.discount_price) if hasattr(product, 'discount_price') and product.discount_price else None,
                            'image': product.image.url if hasattr(product, 'image') and product.image else None,
                            'colors': colors,
                            'sizes': sizes,
                            'type': 'product',
                            'recommendation_type': 'variant_inquiry',
                            'reason': f"Available colors: {', '.join(colors) if colors else 'N/A'}; sizes: {', '.join(sizes) if sizes else 'N/A'}"
                        }]
                    except Exception as e:
                        print(f"[VARIANT INQUIRY ERROR] {e}")
                        return []
            quantity = entities.get('quantity', 10)
            if quantity is None:
                quantity = 10
            recommendations = []
            for product in products[:quantity]:
                effective_price = product.discount_price if hasattr(product, 'discount_price') and product.discount_price else product.price
                # Get color options for this product
                color_type = ProductVariantType.objects.filter(name__iexact='Color').first()
                if color_type:
                    color_options = ProductVariantOption.objects.filter(variant_type=color_type, variants__product=product).distinct()
                    colors = [opt.value for opt in color_options]
                else:
                    colors = []
                # Serialize product fields only
                recommendations.append({
                    'id': product.id,
                    'name': product.name,
                    'category': product.category.name if hasattr(product, 'category') and product.category else None,
                    'brand': getattr(product, 'brand', None),
                    'price': float(product.price) if hasattr(product, 'price') else None,
                    'discount_price': float(product.discount_price) if hasattr(product, 'discount_price') and product.discount_price else None,
                    'image': product.image.url if hasattr(product, 'image') and product.image else None,
                    'score': 0.9,
                    'reason': f"Matches your search criteria",
                    'effective_price': float(effective_price) if effective_price else None,
                    'type': 'product',
                    'colors': colors,
                    'recommendation_type': 'product'
                })
            for idx, rec in enumerate(recommendations):
                if not isinstance(rec, dict):
                    print(f"[DEBUG] Non-dict recommendation at index {idx}: {type(rec)} - {rec}")
            print(f"✅ Generated {len(recommendations)} recommendations (filtered: {filtered})")
            return recommendations, filtered
        except Exception as e:
            print(f"Error getting recommendations: {e}")
            return [], False
    
    def _get_session_context(self, session: ChatSession) -> Dict:
        """Get session context from database"""
        try:
            # Get context from session preferences
            context = session.preferences.get('context', {}) if session.preferences else {}
            
            # Ensure required keys exist
            context.setdefault('last_intent', None)
            context.setdefault('last_categories', [])
            context.setdefault('last_brands', [])
            context.setdefault('last_products_shown', 0)
            context.setdefault('shown_product_ids', [])
            context.setdefault('last_product', None)
            context.setdefault('last_product_id', None)
            
            print(f"📋 Retrieved session context: {context}")
            return context
            
        except Exception as e:
            print(f"❌ Error getting session context: {e}")
            return {
                'last_intent': None,
                'last_categories': [],
                'last_brands': [],
                'last_products_shown': 0,
                'shown_product_ids': [],
                'last_product': None,
                'last_product_id': None
            }
    
    def _generate_greeting_response(self, sentiment: str) -> str:
        """Generate AI-powered greeting response"""
        import random
        
        greetings = [
            "Hello! 👋 I'm your AI shopping assistant. I can help you find amazing products, compare prices, and discover the best deals. What are you looking for today?",
            "Hi there! 🛍️ Welcome to our store. I'm here to help you find exactly what you need. I can search products, recommend items, and answer any questions you have. How can I assist you?",
            "Greetings! ✨ I'm excited to help you shop today. I can show you trending products, help with comparisons, or find items within your budget. What would you like to explore?",
            "Hello! 🎯 I'm your personal shopping AI. I know our inventory inside out and can help you find the perfect products. Just tell me what you're looking for!"
        ]
        
        if sentiment == 'positive':
            return "Great to see your enthusiasm! " + random.choice(greetings)
        else:
            return random.choice(greetings)
    
    def _generate_goodbye_response(self, sentiment: str) -> str:
        """Generate AI-powered goodbye response"""
        import random
        
        goodbyes = [
            "Thank you for shopping with us! 🙏 I hope I helped you find what you were looking for. Come back anytime for more personalized recommendations!",
            "It was a pleasure assisting you today! 😊 I'm here whenever you need shopping help. Have a wonderful day!",
            "Thanks for visiting! 👋 I'm always here to help with product searches, comparisons, and recommendations. See you soon!",
            "Goodbye! ✨ I hope you found everything you needed. Feel free to return anytime - I'm here to make your shopping experience amazing!"
        ]
        
        return random.choice(goodbyes)
    
    def _generate_product_search_response(self, entities: Dict, recommendations: List[Dict], sentiment: str) -> str:
        """Generate AI-powered product search response"""
        import random
        
        # Get requested quantity
        requested_quantity = entities.get('quantity', 10)
        found_quantity = len(recommendations)
        
        # If no products found, provide helpful response
        if not recommendations:
            # Check if this was a specific product request
            if entities.get('keywords'):
                requested_product = None
                for keyword in entities['keywords']:
                    if keyword.lower() in ['underwears', 'underwear', 'lipsticks', 'lipstick']:
                        requested_product = keyword.lower()
                        break
                
                if requested_product:
                    return f"I'm sorry, but we don't currently have {requested_product} in our inventory. Would you like me to show you similar products, or help you find something else?"
                else:
                    return "I couldn't find any products matching your criteria. Would you like me to show you similar products in different categories, browse our trending items, or help you refine your search?"
            else:
                return "I couldn't find any products matching your criteria. Would you like me to show you similar products in different categories, browse our trending items, or help you refine your search?"
        
        # If products found, generate appropriate response
        product_names = [rec.get('name') for rec in recommendations[:3]]
        # Compose a context-aware intro
        intro = "🎯 I found some great products for you!"
        if entities.get('colors') and entities.get('categories'):
            intro = f"🎯 Here are some {', '.join(entities['colors'])} {', '.join(entities['categories'])} I found:"
        elif entities.get('colors'):
            intro = f"🎯 Here are some {', '.join(entities['colors'])} products I found:"
        elif entities.get('categories'):
            intro = f"🎯 Here are some {', '.join(entities['categories'])} I found:"
        # Handle partial results - only compare if requested_quantity is not None
        if requested_quantity is not None and found_quantity < requested_quantity:
            if found_quantity == 1:
                response = f"{intro} {product_names[0]}. "
            else:
                response = f"{intro} {', '.join(product_names)}. "
            # Add context about partial results
            if entities.get('colors'):
                color_text = ', '.join(entities['colors'])
                response += f"Unfortunately, I only found {found_quantity} {color_text} products in our current inventory. "
            if entities.get('quantity'):
                response += f"You asked for {requested_quantity}, but we currently have {found_quantity} available. "
            response += "Would you like me to show you similar products in different colors, or help you find alternatives?"
        else:
            # Full results found
            response = f"{intro} {', '.join(product_names)}. "
            if entities.get('brands'):
                response += f"I've focused on {', '.join(entities['brands'])} products as requested. "
            if entities.get('price_range'):
                min_price, max_price = entities['price_range']
                response += f"All items are within your ${min_price}-${max_price} budget range. "
            if entities.get('colors'):
                response += f"I've included {', '.join(entities['colors'])} options as you mentioned. "
            response += "Would you like me to show you more details about any of these products, help you compare them, or suggest something else?"
        return response
    
    def _generate_brand_search_response(self, entities: Dict, recommendations: List[Dict], sentiment: str) -> str:
        """Generate AI-powered brand search response"""
        if entities.get('brands'):
            brand_names = ', '.join(entities['brands'])
            if recommendations:
                product_names = [rec['product'].name for rec in recommendations[:3]]
                return f"🏆 Here are the best {brand_names} products I found: {', '.join(product_names)}. These are highly rated and popular choices! Would you like me to show you more {brand_names} products or help you compare them?"
            else:
                return f"I'm looking for {brand_names} products in our inventory. Let me find the best options for you! Would you like me to show you similar brands or check if we have any {brand_names} products coming soon?"
        else:
            return "I'd be happy to help you find products from any brand! Which brand are you interested in? I can show you Nike, Adidas, Apple, Samsung, and many more!"
    
    def _generate_recommendation_response(self, entities: Dict, recommendations: List[Dict], sentiment: str) -> str:
        """Generate AI-powered recommendation response with context awareness"""
        import random
        if not recommendations:
            return "I'd be happy to help you find the perfect products! Could you tell me what you're looking for? I can search by category, brand, or specific features."
        # Get the top recommendation
        top_recommendation = recommendations[0]
        product_name = top_recommendation.get('name')
        product_category = top_recommendation.get('category', 'product')
        price = top_recommendation.get('price')
        rating = top_recommendation.get('average_rating')
        reason = top_recommendation.get('reason', '')
        details = []
        if rating:
            details.append(f"average rating {rating}")
        if price:
            details.append(f"price ${price}")
        if reason:
            details.append(reason)
        details_str = ", ".join(details)
        # Check if this is a follow-up question about previously shown products
        is_follow_up = False
        if entities.get('keywords'):
            follow_up_indicators = ['best', 'better', 'recommend', 'choose', 'which', 'value', 'worth', 'quality']
            is_follow_up = any(keyword in follow_up_indicators for keyword in entities['keywords'])
        # Check if this is a follow-up question (context-aware)
        if len(recommendations) > 1:
            # Multiple recommendations - this might be a follow-up to "which one is best"
            product_names = [rec.get('name') for rec in recommendations[:3]]
            if is_follow_up:
                # Pick the best product as above
                best = recommendations[0]
                best_name = best.get('name')
                best_details = []
                best_rating = best.get('average_rating')
                best_price = best.get('price')
                if best_rating:
                    best_details.append(f"average rating {best_rating}")
                if best_price:
                    best_details.append(f"price ${best_price}")
                best_reason = best.get('reason', '')
                if best_reason:
                    best_details.append(best_reason)
                best_details_str = ", ".join(best_details)
                responses = [
                    f"💡 Based on my analysis, I recommend: {best_name}. {best_details_str}.",
                    f"🎯 My top pick for you is {best_name}. It stands out for its value and customer satisfaction. {best_details_str}.",
                    f"⭐ After reviewing all options, {best_name} is the best match for your needs. {best_details_str}."
                ]
            else:
                responses = [
                    f"💡 Here are some great {product_category} recommendations: {', '.join(product_names)}. {details_str}. Would you like me to explain the features of any of these products?",
                    f"🎯 I found these excellent {product_category} options for you: {', '.join(product_names)}. {details_str}. Would you like more details about any of these products?",
                    f"⭐ Here are my top {product_category} picks: {', '.join(product_names)}. {details_str}. Would you like me to help you compare them or show you more options?"
                ]
        else:
            # Single recommendation
            if is_follow_up:
                responses = [
                    f"💡 Based on my analysis, I recommend: {product_name}. {details_str}.",
                    f"🎯 My top pick for you is {product_name}. It stands out for its value and customer satisfaction. {details_str}.",
                    f"⭐ After reviewing all options, {product_name} is the best match for your needs. {details_str}."
                ]
            else:
                responses = [
                    f"💡 Here's a great {product_category} recommendation: {product_name}. {details_str}. Would you like me to explain the features of this product?",
                    f"🎯 I found this excellent {product_category} option for you: {product_name}. {details_str}. Would you like more details about this product?",
                    f"⭐ Here's my top {product_category} pick: {product_name}. {details_str}. Would you like me to help you explore this product or show you more options?"
                ]
        return random.choice(responses)
    
    def _generate_comparison_response(self, entities: Dict, recommendations: List[Dict], sentiment: str, session: ChatSession = None) -> str:
        """Generate AI-powered comparison response with context awareness and follow-up"""
        import random
        # Filter recommendations by category if specified
        if entities.get('categories'):
            requested_categories = set([cat.lower() for cat in entities['categories']])
            recommendations = [
                rec for rec in recommendations
                if rec.get('category', '').lower() in requested_categories
            ]
        # Use recommendations or fallback to last recommendations from session context
        if (not recommendations or len(recommendations) < 2) and session is not None:
            session_context = self._get_session_context(session)
            last_recs = session_context.get('last_recommendations', [])
            last_cats = session_context.get('last_categories', [])
            # Generalized: filter by categories from the original user query
            original_query_cats = session_context.get('last_entities', {}).get('categories', [])
            original_query_cats_set = set([cat.lower() for cat in original_query_cats])
            if last_recs and len(last_recs) >= 2:
                if original_query_cats_set:
                    filtered_recs = [rec for rec in last_recs if rec.get('category', '').lower() in original_query_cats_set]
                    if len(filtered_recs) >= 2:
                        recommendations = filtered_recs
                    else:
                        recommendations = last_recs
                elif last_cats:
                    last_cats_set = set([cat.lower() for cat in last_cats])
                    filtered_recs = [rec for rec in last_recs if rec.get('category', '').lower() in last_cats_set]
                    if len(filtered_recs) >= 2:
                        recommendations = filtered_recs
                    else:
                        recommendations = last_recs
                else:
                    recommendations = last_recs
        # Detect follow-up keywords
        follow_up_keywords = ['best', 'better', 'recommend', 'choose', 'which', 'top', 'value', 'worth', 'quality', 'party', 'occasion', 'event', 'formal', 'casual']
        user_criteria = None
        if entities.get('keywords'):
            for kw in entities['keywords']:
                if kw in follow_up_keywords:
                    user_criteria = kw
                    break
        # If user asks for 'best value', 'best for party', etc.
        if len(recommendations) >= 2 and user_criteria:
            # If 'value' or 'worth', pick best price-to-rating or lowest price among high-rated

        # Step 1: Handle 'style' comparison
            if user_criteria == 'style' or user_criteria == 'styles':
                descs = [(rec.get('name'), (rec.get('description') or '')) for rec in recommendations[:2]]
                style_keywords = ['casual', 'formal', 'sporty', 'classic', 'modern', 'trendy', 'elegant', 'simple', 'colorful', 'plain', 'graphic', 'summer', 'winter', 'lightweight', 'comfortable']
                style_summary = []
                for name, desc in descs:
                    found = [kw for kw in style_keywords if kw in desc.lower()]
                    if found:
                        style_summary.append(f"{name}: {', '.join(found)} style.")
                    else:
                        style_summary.append(f"{name}: style not clearly described.")
                return (
                    f"👗 Style comparison:\n" + '\n'.join(style_summary) +
                    "\nBased on the descriptions, choose the one that matches your preferred style! Would you like more details about either product?"
                )

            # Step 2: Handle 'value for money' comparison
            if user_criteria in ['value', 'worth', 'value for money']:
                def value_score(rec):
                    price = rec.get('discount_price') or rec.get('price') or 1
                    rating = rec.get('score', 0.5)
                    return (rating or 0.5) / (price or 1)
                best = max(recommendations, key=value_score)
                other = [rec for rec in recommendations if rec != best][0]
                best_price = best.get('discount_price') or best.get('price')
                other_price = other.get('discount_price') or other.get('price')
                best_rating = best.get('score', 0.5)
                other_rating = other.get('score', 0.5)
                return (
                    f"💸 For best value for money, I recommend: {best.get('name')} (${best_price}). "
                    f"It has a rating of {best_rating} and costs less than {other.get('name')} (${other_price}) "
                    f"with a rating of {other_rating}. This makes it a better deal overall!"
                )


            if user_criteria in ['value', 'worth']:
                def value_score(rec):
                    price = rec.get('discount_price') or rec.get('price') or 1
                    rating = rec.get('score', 0.5)
                    return (rating or 0.5) / (price or 1)
                best = max(recommendations, key=value_score)
                return f"💸 For best value for money, I recommend: {best.get('name')} (${best.get('price')}). It offers a great balance of price and quality!"
            # If 'party', 'occasion', 'event', 'formal', 'casual', use description keyword match
            elif user_criteria in ['party', 'occasion', 'event', 'formal', 'casual']:
                def match_score(rec):
                    desc = (rec.get('description') or '').lower()
                    return sum(1 for word in [user_criteria] if word in desc)
                best = max(recommendations, key=match_score)
                if match_score(best) == 0:
                    return f"🤔 None of the products seem perfect for a {user_criteria}. Could you tell me more about what you're looking for (e.g., style, color, material)?"
                return f"🎉 For a {user_criteria}, I recommend: {best.get('name')} (${best.get('price')}). It matches your occasion!"
            # Otherwise, pick by score/rating/price
            else:
                def get_score(rec):
                    return rec.get('score', 0)
                def get_price(rec):
                    return rec.get('discount_price') or rec.get('price') or 0
                sorted_recs = sorted(recommendations, key=lambda r: (-get_score(r), get_price(r)))
                best = sorted_recs[0]
                return f"⭐ Based on my analysis, {best.get('name')} (${best.get('price')}) is the top choice! Would you like to know more about its features or see alternatives?"
        elif len(recommendations) >= 2:
            names = [rec.get('name') for rec in recommendations[:2]]
            response = f"📊 Let me compare {names[0]} and {names[1]} for you. Would you like me to compare specific features like performance, style, value for money, or customer ratings?"
            return response
        elif len(recommendations) == 1 and user_criteria:
            best = recommendations[0]
            return f"Based on my analysis, {best.get('name')} (${best.get('price')}) is the best match for you. Would you like to know more about it or see alternatives?"
        else:
            return "I'd be happy to help you compare products! Which specific items would you like me to compare? I can analyze prices, features, ratings, and more!"
    
    def _generate_price_response(self, entities: Dict, recommendations: List[Dict], sentiment: str) -> str:
        """Generate AI-powered price response"""
        if entities.get('price_range'):
            min_price, max_price = entities['price_range']
            if recommendations:
                product_names = [rec.get('name') for rec in recommendations[:3]]
                return f"💰 I found these great products in your ${min_price}-${max_price} price range: {', '.join(product_names)}. All offer excellent value for money! Would you like me to show you more options in this price range?"
            else:
                return f"I'm searching for products in your ${min_price}-${max_price} budget range. Let me find the best options! Would you like me to show you similar products at different price points?"
        else:
            return "I can help you find products in any price range! What's your budget? I can show you budget-friendly options, mid-range products, or premium items."
    
    def _generate_variant_inquiry_response(self, entities: Dict, recommendations: List[Dict], sentiment: str) -> str:
        """Generate a response listing available color options for recommended products, including the count."""
        if recommendations and len(recommendations) > 0:
            color_info = []
            for rec in recommendations:
                colors = rec.get('colors') or []
                if colors:
                    color_info.append(f"{rec.get('name')}: {len(colors)} colors available ({', '.join(colors)})")
            if color_info:
                return "🎨 Here are the available colors:\n" + "\n".join(color_info)
            else:
                return "I couldn't find color options for these products. Would you like to see other variants or more details?"
        return "🎨 I can help you find products in different colors, sizes, and variants! What specific options are you looking for?"


    def _generate_size_inquiry_response(self, entities: Dict, recommendations: List[Dict], sentiment: str) -> str:
        """Generate a response listing available size options for recommended products."""
        if recommendations and len(recommendations) > 0:
            size_info = []
            for rec in recommendations:
                sizes = rec.get('sizes') or []
                if sizes:
                    size_info.append(f"{rec.get('name')}: {', '.join(sizes)}")
            if size_info:
                return "📏 Here are the available sizes:\n" + "\n".join(size_info)
            else:
                return "I couldn't find size options for these products. Would you like to see other variants or more details?"
        return "📏 I can help you find products in different sizes! What specific options are you looking for?"
    
    def _generate_sales_assistance_response(self, entities: Dict, sentiment: str) -> str:
        """Generate AI-powered sales assistance response"""
        assistance_responses = [
            "I'm here to help you make the best shopping decisions! 🎯 Let me ask a few questions to understand your needs better. What type of products are you looking for?",
            "I'd love to assist you in finding the perfect products! 💫 I can help with product searches, comparisons, recommendations, and more. What can I help you with today?",
            "I'm your personal shopping assistant! 🛍️ I can help you compare products, find deals, and make informed decisions. What would you like to explore?",
            "Let me guide you through our selection! ✨ I can recommend products based on your preferences, budget, and style. What are you interested in today?"
        ]
        
        import random
        return random.choice(assistance_responses)
    
    def _generate_trending_response(self, entities: Dict, recommendations: List[Dict], sentiment: str) -> str:
        """Generate AI-powered trending products response"""
        if recommendations:
            product_names = [rec.get('name') for rec in recommendations[:3]]
            return f"🔥 Here are the hottest trending products right now: {', '.join(product_names)}. These are flying off the shelves! Would you like to see more trending items or get details about any of these?"
        else:
            return "🔥 I'm searching for the most popular and trending products for you! Let me find what's hot right now. Would you like to see trending items in specific categories?"
    
    def _generate_rating_response(self, entities: Dict, recommendations: List[Dict], sentiment: str) -> str:
        """Generate AI-powered highly rated products response"""
        if recommendations:
            product_names = [rec.get('name') for rec in recommendations[:3]]
            return f"⭐ Here are our highest-rated products with excellent customer reviews: {', '.join(product_names)}. These are customer favorites! Would you like to see more highly rated items or get detailed reviews?"
        else:
            return "⭐ I'm finding the best-rated products with top customer reviews for you! Let me show you what our customers love the most. What type of products are you interested in?"
    
    def _generate_alternatives_response(self, entities: Dict, recommendations: List[Dict], sentiment: str) -> str:
        """Generate AI-powered alternatives response"""
        if recommendations:
            product_names = [rec.get('name') for rec in recommendations[:3]]
            return f"🔄 Here are some great alternatives: {', '.join(product_names)}. These offer similar quality and features. Would you like me to compare them or show you more options?"
        else:
            return "🔄 I'm finding excellent alternatives for you! Let me show you similar products that might be even better. What specific features are you looking for?"
    
    def _generate_context_response(self, entities: Dict, recommendations: List[Dict], sentiment: str) -> str:
        """Generate AI-powered contextual response"""
        if recommendations:
            product_names = [rec.get('name') for rec in recommendations[:2]]
            return f"💡 Based on our conversation, here are some relevant options: {', '.join(product_names)}. These match your preferences perfectly! Would you like more details or to see other options?"
        else:
            return "💡 I'm here to help you find exactly what you need! Let me understand your preferences better. What specific features or qualities are you looking for?"
    
    def _generate_general_response(self, intent: str, entities: Dict, recommendations: List[Dict], sentiment: str) -> str:
        """Generate general AI-powered response, always friendly and proactive"""
        import random
        intent_clean = intent.replace('_', ' ').title()
        if intent == 'greeting':
            greetings = [
                "Hello! 👋 I'm your AI shopping assistant. What can I help you find today?",
                "Hi there! 🛍️ I'm here to help you discover amazing products. What are you interested in?",
                "Welcome! 😊 Let me know what you're looking for, and I'll find the best options for you.",
                "Greetings! ✨ Ready to shop? Tell me what you need and I'll do the rest!"
            ]
            return random.choice(greetings)
        elif intent == 'trending_request':
            return "🔥 I'd love to show you what's trending! Let me find the most popular and hot-selling products for you. Would you like to see trending items in specific categories?"
        elif intent == 'rating_inquiry':
            return "⭐ I can help you find the best-rated products! Let me show you items with the highest customer ratings and reviews. What type of products are you interested in?"
        elif intent == 'variant_inquiry':
            return self._generate_variant_inquiry_response(entities, recommendations, sentiment)
        elif intent == 'size_inquiry':
            return self._generate_size_inquiry_response(entities, recommendations, sentiment)
        elif intent == 'general' or intent == 'unknown' or not intent:
            # Always be proactive and helpful
            general_responses = [
                "I'm here to help you find exactly what you need! You can ask me for product recommendations, trending items, or help with comparisons. What would you like to do today?",
                "Not sure where to start? I can show you our best-sellers, trending products, or help you narrow down your choices. What are you interested in?",
                "Let me know what you're looking for—brand, category, price range, or anything else—and I'll find the best options for you!"
            ]
            return random.choice(general_responses)
        else:
            # For any other intent, always offer to help further
            return f"I understand you're interested in {intent_clean}. Let me help you find the perfect products that match your needs! What specific requirements do you have, or would you like to see some recommendations?"
    
    def _track_interaction(self, session: ChatSession, message: str, intent: str, entities: Dict, sentiment: str):
        """Track interaction for continuous learning"""
        try:
            # Store interaction data for model improvement
            interaction_data = {
                'message': message,
                'intent': intent,
                'entities': entities,
                'sentiment': sentiment,
                'timestamp': timezone.now(),
                'session_id': session.session_id
            }
            
            # In a production system, you'd store this in a database
            # and use it for model retraining
            print(f"📝 Tracked interaction: {intent} with {sentiment} sentiment")
            
        except Exception as e:
            print(f"Error tracking interaction: {e}")
    
    def _get_fallback_response(self, message: str) -> Dict:
        """Get fallback response when AI processing fails"""
        return {
            'intent': 'product_search',
            'confidence': 0.5,
            'entities': {'keywords': [], 'brands': [], 'categories': [], 'colors': [], 'price_range': None, 'quantity': None, 'sentiment': 'neutral'},
            'sentiment': 'neutral',
            'response': "I'm here to help you find great products! What are you looking for today?",
            'ai_model': 'fallback'
        }
    
    def get_model_performance(self) -> Dict:
        """Get comprehensive model performance metrics"""
        try:
            # Get recent interactions for evaluation
            recent_views = SessionProductView.objects.filter(
                timestamp__gte=timezone.now() - timedelta(days=7)
            )
            
            metrics = {
                'model_type': 'RandomForest',
                'intent_labels': len(self.intent_labels),
                'training_samples': 'comprehensive_dataset',
                'accuracy': 'evaluated_on_test_set',
                'last_training': datetime.now().isoformat(),
                'ai_components': ['intent_classification', 'entity_extraction', 'sentiment_analysis', 'semantic_similarity'],
                'total_interactions': recent_views.count()
            }
            
            return metrics
            
        except Exception as e:
            print(f"Error getting metrics: {e}")
            return {'error': str(e)}

    def train_models(self):
        """Retrain all AI models with latest data"""
        try:
            print("🔄 Starting model retraining...")
            
            # Generate new training data
            training_data = self._generate_comprehensive_training_data()
            train_data, test_data = self._split_data(training_data, test_size=0.2)
            
            # Retrain intent classifier
            self._train_intent_classifier(train_data, test_data)
            
            # Save the retrained models
            self._save_models()
            
            # Evaluate the new models
            self._evaluate_models(test_data)
            
            print("✅ Model retraining completed successfully!")
            
        except Exception as e:
            print(f"❌ Error training models: {e}")
            raise

    def _extract_brands_simple(self, message: str) -> List[str]:
        """Extract brands using simple pattern matching"""
        brands = []
        message_lower = message.lower()
        
        # Common brand patterns
        brand_patterns = ['nike', 'adidas', 'apple', 'samsung', 'sony', 'lg', 'hp', 'dell', 'lenovo', 'puma', 'reebok']
        for brand in brand_patterns:
            if brand in message_lower:
                brands.append(brand)
        
        return brands
    
    def _extract_categories_simple(self, message: str) -> List[str]:
        """Extract categories using simple pattern matching"""
        categories = []
        message_lower = message.lower()
        
        # Enhanced category patterns with synonyms
        category_patterns = {
            'shoes': ['shoes', 'shoe', 'footwear', 'sneakers', 'boots', 'sandals'],
            'clothing': ['clothing', 'clothes', 'apparel', 'shirt', 'pants', 'dress', 'jacket'],
            'electronics': ['electronics', 'electronic', 'phone', 'laptop', 'computer', 'device'],
            'books': ['books', 'book', 'reading', 'novel', 'textbook'],
            'beauty': ['beauty', 'cosmetics', 'makeup', 'skincare', 'lipstick'],
            'sports': ['sports', 'sport', 'fitness', 'exercise', 'gym'],
            'home': ['home', 'house', 'kitchen', 'furniture', 'decor']
        }
        
        for category, patterns in category_patterns.items():
            for pattern in patterns:
                if pattern in message_lower:
                    categories.append(category)
                    break  # Only add each category once
        
        return categories 