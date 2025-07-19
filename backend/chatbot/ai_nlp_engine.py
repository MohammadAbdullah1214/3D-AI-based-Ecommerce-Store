import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sentence_transformers import SentenceTransformer
from transformers import pipeline
import torch
import joblib
import os
from typing import Dict, List, Tuple, Optional
import json
from datetime import datetime

from .models import ChatSession, SearchQuery
from products.models import Product, Category


class AINLPEngine:
    """Real AI-powered NLP engine using machine learning models"""
    
    def __init__(self):
        self.models_dir = 'chatbot/ai_models'
        os.makedirs(self.models_dir, exist_ok=True)
        
        # Initialize models
        self.intent_classifier = None
        self.sentiment_analyzer = None
        self.sentence_encoder = None
        self.vectorizer = None
        
        # Load or train models
        self._load_or_train_models()
        
        # Intent labels
        self.intent_labels = [
            'product_search', 'brand_search', 'category_browse', 'price_inquiry',
            'variant_inquiry', 'trending_request', 'rating_inquiry', 'comparison_request',
            'recommendation_request', 'cart_inquiry', 'greeting', 'goodbye',
            'context_question', 'follow_up_price', 'follow_up_performance',
            'follow_up_style', 'follow_up_features', 'positive_response',
            'show_more_request', 'brand_comparison'
        ]
    
    def _load_or_train_models(self):
        """Load existing models or train new ones"""
        try:
            # Try to load existing models
            self.intent_classifier = joblib.load(f'{self.models_dir}/intent_classifier.pkl')
            self.vectorizer = joblib.load(f'{self.models_dir}/vectorizer.pkl')
            self.sentence_encoder = SentenceTransformer('all-MiniLM-L6-v2')
            self.sentiment_analyzer = pipeline('sentiment-analysis', model='cardiffnlp/twitter-roberta-base-sentiment')
            print("✅ Loaded existing AI models")
        except FileNotFoundError:
            print("🔄 Training new AI models...")
            self._train_models()
    
    def _train_models(self):
        """Train the AI models with synthetic and real data"""
        # Generate training data
        training_data = self._generate_training_data()
        
        # Prepare features and labels
        texts = [item['text'] for item in training_data]
        intents = [item['intent'] for item in training_data]
        
        # Train TF-IDF vectorizer
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 3),
            stop_words='english',
            min_df=2
        )
        
        # Transform text to features
        X = self.vectorizer.fit_transform(texts)
        
        # Train intent classifier
        self.intent_classifier = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42
        )
        self.intent_classifier.fit(X, intents)
        
        # Initialize sentence encoder
        self.sentence_encoder = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize sentiment analyzer
        self.sentiment_analyzer = pipeline('sentiment-analysis', model='cardiffnlp/twitter-roberta-base-sentiment')
        
        # Save models
        joblib.dump(self.intent_classifier, f'{self.models_dir}/intent_classifier.pkl')
        joblib.dump(self.vectorizer, f'{self.models_dir}/vectorizer.pkl')
        
        print("✅ AI models trained and saved")
    
    def _generate_training_data(self) -> List[Dict]:
        """Generate comprehensive training data for intent classification"""
        training_data = []
        
        # Product search patterns - EXPANDED
        product_patterns = [
            "show me shoes", "I want to buy a phone", "looking for laptops",
            "find me some clothes", "search for electronics", "show products",
            "I need a new dress", "where can I find shoes", "show me options",
            "search products", "find items", "browse products", "show me shoes",
            "find red shoes", "5 blue shirts", "white hoodies", "red shoes",
            "under $100", "expensive items", "cheap products", "budget friendly",
            "show me electronics", "shoes category", "electronics section",
            "clothing department", "show categories", "what categories do you have",
            "browse by category", "trending products", "popular items", "what's hot",
            "best sellers", "trending now", "popular choices", "hot products",
            "trending items", "what's popular", "best rated", "highest rated",
            "top rated products", "customer reviews", "rating comparison",
            "best reviews", "highly rated", "top reviews", "best rated items"
        ]
        for pattern in product_patterns:
            training_data.append({'text': pattern, 'intent': 'product_search'})
        
        # Brand search patterns - EXPANDED
        brand_patterns = [
            "show me nike products", "adidas shoes", "apple phones",
            "samsung products", "nike shoes", "adidas clothing",
            "brand products", "nike only", "adidas collection",
            "nike", "adidas", "apple", "samsung", "nike products",
            "adidas products", "apple products", "samsung products",
            "nike shoes", "adidas shoes", "apple phones", "samsung phones"
        ]
        for pattern in brand_patterns:
            training_data.append({'text': pattern, 'intent': 'brand_search'})
        
        # Category browse patterns - EXPANDED
        category_patterns = [
            "show me electronics", "browse clothing", "shoes category",
            "electronics section", "clothing department", "show categories",
            "what categories do you have", "browse by category",
            "electronics", "clothing", "shoes", "books", "sports",
            "beauty", "home", "garden", "toys", "automotive",
            "show electronics", "show clothing", "show shoes",
            "electronics category", "clothing category", "shoes category"
        ]
        for pattern in category_patterns:
            training_data.append({'text': pattern, 'intent': 'category_browse'})
        
        # Price inquiry patterns - EXPANDED
        price_patterns = [
            "what's the price", "how much does it cost", "price range",
            "expensive items", "cheap products", "budget friendly",
            "under $100", "over $500", "price comparison",
            "price", "cost", "how much", "expensive", "cheap",
            "budget", "affordable", "price range", "cost range",
            "what's the cost", "how much is it", "price info",
            "cost information", "pricing", "price details"
        ]
        for pattern in price_patterns:
            training_data.append({'text': pattern, 'intent': 'price_inquiry'})
        
        # Variant inquiry patterns - EXPANDED
        variant_patterns = [
            "do you have red shoes", "blue color available", "size options",
            "different colors", "available sizes", "color variants",
            "size chart", "color options", "variants available",
            "red", "blue", "green", "black", "white", "yellow",
            "small", "medium", "large", "xl", "xxl", "size",
            "color", "variant", "option", "available", "in stock",
            "do you have", "is available", "color available", "size available"
        ]
        for pattern in variant_patterns:
            training_data.append({'text': pattern, 'intent': 'variant_inquiry'})
        
        # Trending patterns - EXPANDED
        trending_patterns = [
            "trending products", "popular items", "what's hot",
            "best sellers", "trending now", "popular choices",
            "hot products", "trending items", "what's popular",
            "trending", "popular", "hot", "best", "trending now",
            "what's trending", "popular products", "hot items",
            "trending items", "popular choices", "hot products",
            "what's hot right now", "trending products", "popular items"
        ]
        for pattern in trending_patterns:
            training_data.append({'text': pattern, 'intent': 'trending_request'})
        
        # Rating patterns - EXPANDED
        rating_patterns = [
            "best rated", "highest rated", "top rated products",
            "customer reviews", "rating comparison", "best reviews",
            "highly rated", "top reviews", "best rated items",
            "rating", "review", "rated", "best rated", "top rated",
            "highest rated", "customer review", "user review",
            "rating comparison", "review comparison", "best reviews",
            "top reviews", "highly rated", "well rated", "good rating"
        ]
        for pattern in rating_patterns:
            training_data.append({'text': pattern, 'intent': 'rating_inquiry'})
        
        # Comparison patterns - EXPANDED
        comparison_patterns = [
            "compare products", "which is better", "product comparison",
            "compare prices", "which one should I buy", "compare features",
            "difference between", "vs comparison", "which is best",
            "compare", "comparison", "which", "better", "best",
            "difference", "vs", "versus", "compare this", "compare that",
            "which one", "which product", "compare items", "compare options",
            "which should I buy", "which is better", "what's the difference"
        ]
        for pattern in comparison_patterns:
            training_data.append({'text': pattern, 'intent': 'comparison_request'})
        
        # Recommendation patterns - EXPANDED
        recommendation_patterns = [
            "recommend me", "what should I buy", "suggestions",
            "recommendations", "what do you recommend", "best choice",
            "recommend products", "suggest items", "what's good",
            "recommend", "suggestion", "recommendation", "suggest",
            "what should I", "what do you", "recommend me", "suggest me",
            "best choice", "good choice", "what's good", "what's best",
            "recommend products", "suggest products", "recommend items",
            "suggest items", "what do you recommend", "what should I buy"
        ]
        for pattern in recommendation_patterns:
            training_data.append({'text': pattern, 'intent': 'recommendation_request'})
        
        # Cart patterns - EXPANDED
        cart_patterns = [
            "my cart", "shopping cart", "what's in my cart",
            "cart items", "add to cart", "cart contents",
            "view cart", "check cart", "cart summary",
            "cart", "shopping cart", "my cart", "add to cart",
            "cart items", "cart contents", "view cart", "check cart",
            "cart summary", "shopping basket", "basket", "my basket",
            "add item", "add product", "cart total", "cart price"
        ]
        for pattern in cart_patterns:
            training_data.append({'text': pattern, 'intent': 'cart_inquiry'})
        
        # Greeting patterns - EXPANDED
        greeting_patterns = [
            "hello", "hi", "hey", "good morning", "good afternoon",
            "good evening", "greetings", "how are you", "start shopping",
            "hello", "hi", "hey", "hey there", "good morning",
            "good afternoon", "good evening", "greetings", "how are you",
            "start shopping", "begin shopping", "start", "begin",
            "hello there", "hi there", "hey there", "good day",
            "morning", "afternoon", "evening", "greeting"
        ]
        for pattern in greeting_patterns:
            training_data.append({'text': pattern, 'intent': 'greeting'})
        
        # Goodbye patterns - EXPANDED
        goodbye_patterns = [
            "bye", "goodbye", "see you", "thank you", "thanks",
            "goodbye", "bye", "see you", "see you later", "goodbye",
            "bye bye", "see ya", "thank you", "thanks", "thank you",
            "thanks a lot", "thank you very much", "appreciate it",
            "goodbye", "bye", "see you", "see you later", "goodbye",
            "bye bye", "see ya", "take care", "have a good day",
            "have a nice day", "goodbye", "bye", "see you"
        ]
        for pattern in goodbye_patterns:
            training_data.append({'text': pattern, 'intent': 'goodbye'})
        
        # Context question patterns
        context_patterns = [
            "what about", "tell me more", "more details", "explain",
            "what else", "other options", "more information", "details",
            "tell me more about", "what about this", "more details",
            "explain more", "what else do you have", "other options",
            "more information", "more details", "explain this",
            "what about that", "tell me more", "more info"
        ]
        for pattern in context_patterns:
            training_data.append({'text': pattern, 'intent': 'context_question'})
        
        # Follow-up patterns
        follow_up_patterns = [
            "how much is it", "what's the price", "is it available",
            "do you have it", "is it in stock", "what colors",
            "what sizes", "how does it look", "what's it like",
            "price", "cost", "available", "in stock", "colors",
            "sizes", "look", "like", "how much", "what's the cost",
            "is available", "do you have", "in stock", "what colors",
            "what sizes", "how does it look", "what's it like"
        ]
        for pattern in follow_up_patterns:
            training_data.append({'text': pattern, 'intent': 'follow_up_price'})
        
        # Positive response patterns
        positive_patterns = [
            "yes", "yeah", "sure", "okay", "ok", "good", "great",
            "perfect", "excellent", "amazing", "wonderful", "fantastic",
            "yes", "yeah", "sure", "okay", "ok", "good", "great",
            "perfect", "excellent", "amazing", "wonderful", "fantastic",
            "yes please", "yeah sure", "okay", "sure", "good",
            "great", "perfect", "excellent", "amazing", "wonderful"
        ]
        for pattern in positive_patterns:
            training_data.append({'text': pattern, 'intent': 'positive_response'})
        
        # Show more patterns
        show_more_patterns = [
            "show more", "more products", "next page", "load more",
            "more items", "show more products", "more options",
            "next", "more", "show more", "load more", "more products",
            "more items", "next page", "more options", "show more",
            "load more products", "more items", "next", "more"
        ]
        for pattern in show_more_patterns:
            training_data.append({'text': pattern, 'intent': 'show_more_request'})
        
        # Brand comparison patterns
        brand_comparison_patterns = [
            "nike vs adidas", "apple vs samsung", "compare brands",
            "brand comparison", "which brand", "nike or adidas",
            "apple or samsung", "brand vs brand", "compare nike adidas",
            "nike vs", "adidas vs", "apple vs", "samsung vs",
            "compare nike", "compare adidas", "compare apple",
            "compare samsung", "which brand is better", "brand comparison"
        ]
        for pattern in brand_comparison_patterns:
            training_data.append({'text': pattern, 'intent': 'brand_comparison'})
        
        return training_data
    
    def detect_intent(self, message: str, session_context: Optional[Dict] = None) -> Tuple[str, float]:
        """Use AI to detect intent with confidence score"""
        try:
            # Preprocess message
            processed_message = self._preprocess_text(message)
            
            # Transform to features
            features = self.vectorizer.transform([processed_message])
            
            # Predict intent
            intent = self.intent_classifier.predict(features)[0]
            
            # Get confidence score
            confidence_scores = self.intent_classifier.predict_proba(features)[0]
            confidence = max(confidence_scores)
            
            # Apply context-aware adjustments
            if session_context:
                confidence = self._apply_context_adjustments(message, intent, confidence, session_context)
            
            print(f"🤖 AI INTENT DETECTION: '{message}' → {intent} (confidence: {confidence:.3f})")
            
            return intent, confidence
            
        except Exception as e:
            print(f"❌ AI Intent detection error: {e}")
            return 'product_search', 0.5  # Fallback
    
    def extract_entities(self, message: str, session_context: Optional[Dict] = None) -> Dict:
        """Use AI to extract entities with semantic understanding"""
        try:
            entities = {
                'keywords': [],
                'brands': [],
                'categories': [],
                'colors': [],
                'price_range': None,
                'quantity': None,
                'sentiment': 'neutral'
            }
            
            # Get sentence embeddings for semantic search
            message_embedding = self.sentence_encoder.encode(message)
            
            # Extract brands using semantic similarity
            entities['brands'] = self._extract_brands_semantic(message, message_embedding)
            
            # Extract categories using semantic similarity
            entities['categories'] = self._extract_categories_semantic(message, message_embedding)
            
            # Extract colors using pattern matching + semantic understanding
            entities['colors'] = self._extract_colors_ai(message)
            
            # Extract price range using NLP
            entities['price_range'] = self._extract_price_range_ai(message)
            
            # Extract quantity
            entities['quantity'] = self._extract_quantity_ai(message)
            
            # Extract keywords using TF-IDF
            entities['keywords'] = self._extract_keywords_ai(message)
            
            # Analyze sentiment
            entities['sentiment'] = self._analyze_sentiment(message)
            
            print(f"🤖 AI ENTITY EXTRACTION: {entities}")
            return entities
            
        except Exception as e:
            print(f"❌ AI Entity extraction error: {e}")
            return {'keywords': [], 'brands': [], 'categories': [], 'colors': [], 'price_range': None, 'quantity': None, 'sentiment': 'neutral'}
    
    def _preprocess_text(self, text: str) -> str:
        """Preprocess text for AI models"""
        import re
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove special characters but keep spaces
        text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
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
        import re
        
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
        import re
        
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
        """Extract keywords using TF-IDF analysis"""
        # Get product vocabulary
        products = Product.objects.filter(is_active=True)
        product_texts = []
        
        for product in products:
            product_text = f"{product.name} {product.description}"
            product_texts.append(self._preprocess_text(product_text))
        
        # Create TF-IDF vectorizer for keyword extraction
        keyword_vectorizer = TfidfVectorizer(
            max_features=1000,
            ngram_range=(1, 2),
            stop_words='english',
            min_df=2
        )
        
        try:
            keyword_vectorizer.fit(product_texts)
            
            # Transform message
            message_features = keyword_vectorizer.transform([self._preprocess_text(message)])
            
            # Get feature names and scores
            feature_names = keyword_vectorizer.get_feature_names_out()
            scores = message_features.toarray()[0]
            
            # Get top keywords
            keyword_scores = list(zip(feature_names, scores))
            keyword_scores.sort(key=lambda x: x[1], reverse=True)
            
            # Return top keywords with score > 0
            keywords = [kw for kw, score in keyword_scores if score > 0][:5]
            
            return keywords
            
        except Exception as e:
            print(f"Keyword extraction error: {e}")
            return []
    
    def _analyze_sentiment(self, message: str) -> str:
        """Analyze sentiment using AI"""
        try:
            result = self.sentiment_analyzer(message)
            sentiment = result[0]['label'].lower()
            
            # Map to our sentiment categories
            if sentiment in ['positive', 'pos']:
                return 'positive'
            elif sentiment in ['negative', 'neg']:
                return 'negative'
            else:
                return 'neutral'
                
        except Exception as e:
            print(f"Sentiment analysis error: {e}")
            return 'neutral'
    
    def _apply_context_adjustments(self, message: str, intent: str, confidence: float, session_context: Dict) -> float:
        """Apply context-aware adjustments to confidence score"""
        adjusted_confidence = confidence
        
        # Boost confidence for context-appropriate intents
        if session_context.get('last_products_shown', 0) > 0:
            if intent in ['context_question', 'recommendation_request', 'comparison_request']:
                adjusted_confidence *= 1.2
            
            if intent == 'show_more_request':
                adjusted_confidence *= 1.3
        
        # Boost confidence for follow-up questions after brand comparison
        if session_context.get('last_intent') == 'brand_comparison':
            if intent in ['follow_up_price', 'follow_up_performance', 'follow_up_style', 'follow_up_features']:
                adjusted_confidence *= 1.4
        
        # Reduce confidence for conflicting intents
        if session_context.get('last_intent') == 'greeting' and intent == 'goodbye':
            adjusted_confidence *= 0.7
        
        return min(adjusted_confidence, 1.0)
    
    def get_semantic_similarity(self, text1: str, text2: str) -> float:
        """Get semantic similarity between two texts"""
        try:
            embedding1 = self.sentence_encoder.encode(text1)
            embedding2 = self.sentence_encoder.encode(text2)
            
            similarity = np.dot(embedding1, embedding2) / (np.linalg.norm(embedding1) * np.linalg.norm(embedding2))
            return float(similarity)
            
        except Exception as e:
            print(f"Semantic similarity error: {e}")
            return 0.0 