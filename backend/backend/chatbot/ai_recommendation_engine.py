import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import NMF, TruncatedSVD
from sklearn.preprocessing import StandardScaler, LabelEncoder
import implicit
from implicit.als import AlternatingLeastSquares
from scipy.sparse import csr_matrix
import joblib
import os
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
import json

from django.utils import timezone
from django.db.models import Count, Avg, Q, F, Case, When
from .models import ChatSession, SessionProductView, SessionProductClick, CustomerBehaviorProfile
from products.models import Product, Category


class AIRecommendationEngine:
    """Advanced AI-powered recommendation engine using multiple ML approaches"""
    
    def __init__(self):
        self.models_dir = 'chatbot/ai_models'
        os.makedirs(self.models_dir, exist_ok=True)
        
        # Initialize models
        self.collaborative_model = None
        self.content_model = None
        self.hybrid_model = None
        self.product_embeddings = None
        self.user_embeddings = None
        self.product_vectorizer = None
        self.user_encoder = None
        self.product_encoder = None
        
        # Model parameters
        self.n_components = 50
        self.learning_rate = 0.05
        self.loss = 'warp'
        
        # Load or train models
        self._load_or_train_models()
    
    def _load_or_train_models(self):
        """Load existing models or train new ones"""
        try:
            # Try to load existing models
            self.collaborative_model = joblib.load(f'{self.models_dir}/collaborative_model.pkl')
            self.content_model = joblib.load(f'{self.models_dir}/content_model.pkl')
            self.product_embeddings = joblib.load(f'{self.models_dir}/product_embeddings.pkl')
            self.user_embeddings = joblib.load(f'{self.models_dir}/user_embeddings.pkl')
            self.product_vectorizer = joblib.load(f'{self.models_dir}/product_vectorizer.pkl')
            self.user_encoder = joblib.load(f'{self.models_dir}/user_encoder.pkl')
            self.product_encoder = joblib.load(f'{self.models_dir}/product_encoder.pkl')
            self.hybrid_model = joblib.load(f'{self.models_dir}/hybrid_model.pkl')
            print("✅ Loaded existing AI recommendation models")
        except FileNotFoundError:
            print("🔄 Training new AI recommendation models...")
            self._train_models()
    
    def _train_models(self):
        """Train all recommendation models with comprehensive data"""
        print("📊 Preparing training data...")
        
        # Generate comprehensive training data
        training_data = self._generate_training_data()
        
        # Split data for training and testing (80/20)
        train_data, test_data = self._split_data(training_data, test_size=0.2)
        
        print(f"📈 Training with {len(train_data)} samples, testing with {len(test_data)} samples")
        
        # Train collaborative filtering model
        self._train_collaborative_model(train_data, test_data)
        
        # Train content-based model
        self._train_content_model(train_data)
        
        # Train hybrid model
        self._train_hybrid_model(train_data, test_data)
        
        # Save models
        self._save_models()
        
        # Evaluate models
        self._evaluate_models(test_data)
        
        print("✅ AI recommendation models trained and saved")
    
    def _generate_training_data(self) -> List[Dict]:
        """Generate comprehensive training data from user interactions"""
        training_data = []
        
        # Get real user interactions
        views = SessionProductView.objects.select_related('session__user', 'product').all()
        clicks = SessionProductClick.objects.select_related('session__user', 'product').all()
        
        # Convert views to training data
        for view in views:
            if view.session.user and view.product:
                training_data.append({
                    'user_id': view.session.user.id,
                    'product_id': view.product.id,
                    'interaction_type': 'view',
                    'rating': 1.0,
                    'timestamp': view.viewed_at,
                    'category': view.product.category.name if view.product.category else 'unknown',
                    'price': float(view.product.price),
                    'brand': self._extract_brand(view.product.name, view.product.description)
                })
        
        # Convert clicks to training data (higher weight)
        for click in clicks:
            if click.session.user and click.product:
                training_data.append({
                    'user_id': click.session.user.id,
                    'product_id': click.product.id,
                    'interaction_type': 'click',
                    'rating': 2.0,
                    'timestamp': click.clicked_at,
                    'category': click.product.category.name if click.product.category else 'unknown',
                    'price': float(click.product.price),
                    'brand': self._extract_brand(click.product.name, click.product.description)
                })
        
        # Generate synthetic data for better coverage
        synthetic_data = self._generate_synthetic_data()
        training_data.extend(synthetic_data)
        
        print(f"📊 Generated {len(training_data)} training samples")
        return training_data
    
    def _generate_synthetic_data(self) -> List[Dict]:
        """Generate synthetic training data for better model coverage"""
        synthetic_data = []
        
        # Get all products and users
        products = Product.objects.filter(is_active=True)
        users = list(set([view.session.user for view in SessionProductView.objects.select_related('session__user').all() if view.session.user]))
        
        # Generate synthetic interactions based on patterns
        for user in users[:100]:  # Limit to first 100 users for performance
            # Get user's preferred categories
            user_views = SessionProductView.objects.filter(session__user=user)
            user_categories = [view.product.category.name for view in user_views if view.product.category]
            
            if user_categories:
                # Generate synthetic interactions in preferred categories
                preferred_category = max(set(user_categories), key=user_categories.count)
                category_products = products.filter(category__name=preferred_category)
                
                for product in category_products[:5]:  # Top 5 products in category
                    synthetic_data.append({
                        'user_id': user.id,
                        'product_id': product.id,
                        'interaction_type': 'synthetic',
                        'rating': 1.5,
                        'timestamp': timezone.now() - timedelta(days=np.random.randint(1, 30)),
                        'category': product.category.name if product.category else 'unknown',
                        'price': float(product.price),
                        'brand': self._extract_brand(product.name, product.description)
                    })
        
        # Generate cross-category recommendations
        for user in users[:50]:
            user_views = SessionProductView.objects.filter(session__user=user)
            if user_views.exists():
                # Find complementary categories
                viewed_categories = [view.product.category.name for view in user_views if view.product.category]
                if viewed_categories:
                    # Generate synthetic interactions in complementary categories
                    complementary_categories = self._get_complementary_categories(viewed_categories[0])
                    for category in complementary_categories:
                        category_products = products.filter(category__name=category)
                        for product in category_products[:3]:
                            synthetic_data.append({
                                'user_id': user.id,
                                'product_id': product.id,
                                'interaction_type': 'synthetic_complementary',
                                'rating': 1.2,
                                'timestamp': timezone.now() - timedelta(days=np.random.randint(1, 30)),
                                'category': product.category.name if product.category else 'unknown',
                                'price': float(product.price),
                                'brand': self._extract_brand(product.name, product.description)
                            })
        
        print(f"🎲 Generated {len(synthetic_data)} synthetic training samples")
        return synthetic_data
    
    def _get_complementary_categories(self, category: str) -> List[str]:
        """Get complementary categories for cross-selling"""
        complementary_map = {
            'electronics': ['accessories', 'cases', 'chargers'],
            'clothing': ['shoes', 'accessories', 'bags'],
            'shoes': ['clothing', 'accessories', 'socks'],
            'home': ['decor', 'kitchen', 'furniture'],
            'sports': ['fitness', 'outdoor', 'accessories']
        }
        
        for main_cat, comp_cats in complementary_map.items():
            if main_cat in category.lower():
                return comp_cats
        
        return []
    
    def _extract_brand(self, name: str, description: str) -> str:
        """Extract brand from product name/description"""
        text = f"{name} {description}".lower()
        
        brand_patterns = ['nike', 'adidas', 'apple', 'samsung', 'sony', 'lg', 'hp', 'dell', 'lenovo']
        for brand in brand_patterns:
            if brand in text:
                return brand
        
        return 'unknown'
    
    def _split_data(self, data: List[Dict], test_size: float = 0.2) -> Tuple[List[Dict], List[Dict]]:
        """Split data into training and testing sets"""
        # Sort by timestamp to maintain temporal order
        data.sort(key=lambda x: x['timestamp'])
        
        split_index = int(len(data) * (1 - test_size))
        train_data = data[:split_index]
        test_data = data[split_index:]
        
        return train_data, test_data
    
    def _train_collaborative_model(self, train_data: List[Dict], test_data: List[Dict]):
        """Train collaborative filtering model using Implicit ALS"""
        print("🤝 Training collaborative filtering model...")
        
        # Create user and product encoders
        self.user_encoder = LabelEncoder()
        self.product_encoder = LabelEncoder()
        
        # Prepare data
        user_ids = [item['user_id'] for item in train_data]
        product_ids = [item['product_id'] for item in train_data]
        ratings = [item['rating'] for item in train_data]
        
        # Fit encoders
        self.user_encoder.fit(user_ids)
        self.product_encoder.fit(product_ids)
        
        # Transform to indices
        user_indices = self.user_encoder.transform(user_ids)
        product_indices = self.product_encoder.transform(product_ids)
        
        # Create interaction matrix
        n_users = len(self.user_encoder.classes_)
        n_products = len(self.product_encoder.classes_)
        
        interaction_matrix = csr_matrix((ratings, (user_indices, product_indices)), 
                                      shape=(n_users, n_products))
        
        # Train Implicit ALS model
        self.collaborative_model = AlternatingLeastSquares(
            factors=self.n_components,
            random_state=42
        )
        
        self.collaborative_model.fit(interaction_matrix)
        
        # Create embeddings
        self.user_embeddings = self.collaborative_model.user_factors
        self.product_embeddings = self.collaborative_model.item_factors
        
        print("✅ Collaborative filtering model trained")
    
    def _train_content_model(self, train_data: List[Dict]):
        """Train content-based model using product features"""
        print("📝 Training content-based model...")
        
        # Get product features
        products = Product.objects.filter(is_active=True)
        product_texts = []
        product_ids = []
        
        for product in products:
            text = f"{product.name} {product.description} {product.category.name if product.category else ''}"
            product_texts.append(text)
            product_ids.append(product.id)
        
        # Create TF-IDF vectorizer
        self.product_vectorizer = TfidfVectorizer(
            max_features=1000,
            ngram_range=(1, 3),
            stop_words='english',
            min_df=2
        )
        
        # Fit and transform
        product_features = self.product_vectorizer.fit_transform(product_texts)
        
        # Create content similarity matrix
        self.content_model = cosine_similarity(product_features)
        
        # Create product ID to index mapping
        self.product_id_to_index = {pid: idx for idx, pid in enumerate(product_ids)}
        
        print("✅ Content-based model trained")
    
    def _train_hybrid_model(self, train_data: List[Dict], test_data: List[Dict]):
        """Train hybrid model combining collaborative and content-based approaches"""
        print("🔄 Training hybrid model...")
        
        # For now, we'll use a simple weighted combination
        # In production, you might want to use more sophisticated ensemble methods
        self.hybrid_model = {
            'collaborative_weight': 0.6,
            'content_weight': 0.4
        }
        
        print("✅ Hybrid model configured")
    
    def _save_models(self):
        """Save all trained models"""
        joblib.dump(self.collaborative_model, f'{self.models_dir}/collaborative_model.pkl')
        joblib.dump(self.content_model, f'{self.models_dir}/content_model.pkl')
        joblib.dump(self.product_embeddings, f'{self.models_dir}/product_embeddings.pkl')
        joblib.dump(self.user_embeddings, f'{self.models_dir}/user_embeddings.pkl')
        joblib.dump(self.product_vectorizer, f'{self.models_dir}/product_vectorizer.pkl')
        joblib.dump(self.user_encoder, f'{self.models_dir}/user_encoder.pkl')
        joblib.dump(self.product_encoder, f'{self.models_dir}/product_encoder.pkl')
        joblib.dump(self.hybrid_model, f'{self.models_dir}/hybrid_model.pkl')
    
    def _evaluate_models(self, test_data: List[Dict]):
        """Evaluate model performance on test data"""
        print("📊 Evaluating model performance...")
        
        if not test_data:
            print("⚠️ No test data available for evaluation")
            return
        
        # Prepare test data
        user_ids = [item['user_id'] for item in test_data]
        product_ids = [item['product_id'] for item in test_data]
        actual_ratings = [item['rating'] for item in test_data]
        
        # Transform to indices
        try:
            user_indices = self.user_encoder.transform(user_ids)
            product_indices = self.product_encoder.transform(product_ids)
        except ValueError:
            print("⚠️ Some test data contains unseen users/products")
            return
        
        # Create test interaction matrix
        n_users = len(self.user_encoder.classes_)
        n_products = len(self.product_encoder.classes_)
        test_matrix = csr_matrix((actual_ratings, (user_indices, product_indices)), 
                               shape=(n_users, n_products))
        
        # Evaluate collaborative model
        # Note: implicit library doesn't have built-in precision_at_k and recall_at_k
        # We'll calculate a simplified evaluation metric
        try:
            # Calculate predictions for test users
            test_user_indices = list(set(user_indices))
            total_precision = 0
            total_recall = 0
            valid_users = 0
            
            for user_idx in test_user_indices[:10]:  # Sample for performance
                # Get recommendations for this user
                recommendations = self.collaborative_model.recommend(user_idx, interaction_matrix[user_idx], N=10)
                
                if len(recommendations) > 0:
                    # Get actual interactions for this user
                    actual_items = test_matrix[user_idx].nonzero()[1]
                    
                    if len(actual_items) > 0:
                        # Calculate precision and recall
                        recommended_items = [rec[0] for rec in recommendations]
                        hits = len(set(recommended_items) & set(actual_items))
                        
                        precision = hits / len(recommended_items) if len(recommended_items) > 0 else 0
                        recall = hits / len(actual_items) if len(actual_items) > 0 else 0
                        
                        total_precision += precision
                        total_recall += recall
                        valid_users += 1
            
            avg_precision = total_precision / valid_users if valid_users > 0 else 0
            avg_recall = total_recall / valid_users if valid_users > 0 else 0
            
            print(f"🤝 Collaborative Model Performance:")
            print(f"   Precision@10: {avg_precision:.4f}")
            print(f"   Recall@10: {avg_recall:.4f}")
            
        except Exception as e:
            print(f"⚠️ Evaluation error: {e}")
            print(f"🤝 Collaborative Model: Training completed successfully")
        
        # Calculate content model performance (simplified)
        content_accuracy = self._evaluate_content_model(test_data)
        print(f"📝 Content Model Performance:")
        print(f"   Accuracy: {content_accuracy:.4f}")
    
    def _evaluate_content_model(self, test_data: List[Dict]) -> float:
        """Evaluate content-based model performance"""
        correct_predictions = 0
        total_predictions = 0
        
        for item in test_data[:100]:  # Sample for performance
            user_id = item['user_id']
            product_id = item['product_id']
            actual_rating = item['rating']
            
            # Get user's preferred categories
            user_views = SessionProductView.objects.filter(session__user_id=user_id)
            user_categories = [view.product.category.name for view in user_views if view.product.category]
            
            if user_categories and product_id in self.product_id_to_index:
                # Predict based on category preference
                preferred_category = max(set(user_categories), key=user_categories.count)
                product = Product.objects.get(id=product_id)
                
                if product.category and product.category.name == preferred_category:
                    predicted_rating = 2.0  # High rating for preferred category
                else:
                    predicted_rating = 1.0  # Lower rating for other categories
                
                # Simple accuracy calculation
                if (predicted_rating >= 1.5 and actual_rating >= 1.5) or (predicted_rating < 1.5 and actual_rating < 1.5):
                    correct_predictions += 1
                total_predictions += 1
        
        return correct_predictions / total_predictions if total_predictions > 0 else 0.0
    
    def get_personalized_recommendations(self, user_id: int, limit: int = 10, 
                                       context: Dict = None) -> List[Dict]:
        """Get AI-powered personalized recommendations"""
        try:
            recommendations = []
            
            # Get collaborative filtering recommendations
            cf_recommendations = self._get_collaborative_recommendations(user_id, limit)
            recommendations.extend(cf_recommendations)
            
            # Get content-based recommendations
            cb_recommendations = self._get_content_recommendations(user_id, limit, context)
            recommendations.extend(cb_recommendations)
            
            # Get hybrid recommendations
            hybrid_recommendations = self._get_hybrid_recommendations(user_id, limit, context)
            recommendations.extend(hybrid_recommendations)
            
            # Remove duplicates and sort by score
            unique_recommendations = self._remove_duplicates(recommendations)
            unique_recommendations.sort(key=lambda x: x['score'], reverse=True)
            
            print(f"🤖 AI RECOMMENDATIONS: {len(unique_recommendations)} items for user {user_id}")
            return unique_recommendations[:limit]
            
        except Exception as e:
            print(f"❌ AI Recommendation error: {e}")
            return self._get_fallback_recommendations(limit)
    
    def _get_collaborative_recommendations(self, user_id: int, limit: int) -> List[Dict]:
        """Get collaborative filtering recommendations using Implicit ALS"""
        try:
            # Get user index
            user_index = self.user_encoder.transform([user_id])[0]
            
            # Create a sparse matrix for this user's interactions
            user_interactions = csr_matrix((1, len(self.product_encoder.classes_)))
            
            # Get recommendations using implicit library
            recommendations = self.collaborative_model.recommend(user_index, user_interactions, N=limit*2)
            
            recommendations_list = []
            for item_idx, score in recommendations:
                try:
                    product_id = self.product_encoder.inverse_transform([item_idx])[0]
                    product = Product.objects.get(id=product_id, is_active=True)
                    recommendations_list.append({
                        'product': product,
                        'score': float(score),
                        'type': 'collaborative_filtering',
                        'recommendation_type': 'collaborative_filtering',
                        'reason': "\U0001f91d Based on similar users' preferences",
                        'model': 'collaborative'
                    })
                except (Product.DoesNotExist, IndexError):
                    continue
            
            return recommendations_list
            
        except Exception as e:
            print(f"Collaborative filtering error: {e}")
            return []
    
    def _get_content_recommendations(self, user_id: int, limit: int, context: Dict = None) -> List[Dict]:
        """Get content-based recommendations"""
        try:
            # Get user's preferred categories
            user_views = SessionProductView.objects.filter(session__user_id=user_id)
            user_categories = [view.product.category.name for view in user_views if view.product.category]
            
            if not user_categories:
                return []
            
            # Get products in preferred categories
            preferred_category = max(set(user_categories), key=user_categories.count)
            products = Product.objects.filter(
                category__name=preferred_category,
                is_active=True
            ).exclude(
                id__in=user_views.values_list('product_id', flat=True)
            )[:limit]
            
            recommendations = []
            for product in products:
                recommendations.append({
                    'product': product,
                    'score': 0.8,
                    'type': 'content_based',
                    'recommendation_type': 'content_based',
                    'reason': f"\U0001f4dd Similar to your {preferred_category} interests",
                    'model': 'content'
                })
            
            return recommendations
            
        except Exception as e:
            print(f"Content-based recommendation error: {e}")
            return []
    
    def _get_hybrid_recommendations(self, user_id: int, limit: int, context: Dict = None) -> List[Dict]:
        """Get hybrid recommendations combining multiple approaches"""
        try:
            # Get recommendations from both models
            cf_recs = self._get_collaborative_recommendations(user_id, limit // 2)
            cb_recs = self._get_content_recommendations(user_id, limit // 2, context)
            
            # Combine with weights
            hybrid_recommendations = []
            
            for rec in cf_recs:
                rec['score'] *= self.hybrid_model['collaborative_weight']
                rec['type'] = 'hybrid'
                rec['recommendation_type'] = 'hybrid'
                rec['reason'] = "\U0001f504 AI-powered recommendation combining multiple approaches"
                hybrid_recommendations.append(rec)
            
            for rec in cb_recs:
                rec['score'] *= self.hybrid_model['content_weight']
                rec['type'] = 'hybrid'
                rec['recommendation_type'] = 'hybrid'
                rec['reason'] = "\U0001f504 AI-powered recommendation combining multiple approaches"
                hybrid_recommendations.append(rec)
            
            return hybrid_recommendations
            
        except Exception as e:
            print(f"Hybrid recommendation error: {e}")
            return []
    
    def _remove_duplicates(self, recommendations: List[Dict]) -> List[Dict]:
        """Remove duplicate products from recommendations"""
        seen_products = set()
        unique_recommendations = []
        
        for rec in recommendations:
            product_id = rec['product'].id
            if product_id not in seen_products:
                seen_products.add(product_id)
                unique_recommendations.append(rec)
        
        return unique_recommendations
    
    def _get_fallback_recommendations(self, limit: int) -> List[Dict]:
        """Get fallback recommendations when AI models fail"""
        products = Product.objects.filter(is_active=True).order_by('-created_at')[:limit]
        
        recommendations = []
        for product in products:
            recommendations.append({
                'product': product,
                'score': 0.5,
                'type': 'fallback',
                'recommendation_type': 'fallback',
                'reason': "\U0001f525 Trending products",
                'model': 'fallback'
            })
        
        return recommendations
    
    def update_user_preferences(self, user_id: int, product_id: int, interaction_type: str):
        """Update user preferences based on new interactions"""
        try:
            # This would typically involve retraining or updating the model
            # For now, we'll just log the interaction
            print(f"📝 Updating preferences: User {user_id} {interaction_type} product {product_id}")
            
            # In a production system, you might:
            # 1. Add the interaction to a queue for batch retraining
            # 2. Use online learning to update embeddings
            # 3. Update user profiles for real-time recommendations
            
        except Exception as e:
            print(f"Error updating preferences: {e}")
    
    def get_model_performance_metrics(self) -> Dict:
        """Get comprehensive model performance metrics"""
        try:
            # Get recent interactions for evaluation
            recent_views = SessionProductView.objects.filter(
                timestamp__gte=timezone.now() - timedelta(days=7)
            )
            
            metrics = {
                'total_interactions': recent_views.count(),
                'unique_users': recent_views.values('session__user').distinct().count(),
                'unique_products': recent_views.values('product').distinct().count(),
                'model_status': 'trained',
                'last_training': datetime.now().isoformat(),
                'collaborative_weight': self.hybrid_model['collaborative_weight'],
                'content_weight': self.hybrid_model['content_weight']
            }
            
            return metrics
            
        except Exception as e:
            print(f"Error getting metrics: {e}")
            return {'error': str(e)} 