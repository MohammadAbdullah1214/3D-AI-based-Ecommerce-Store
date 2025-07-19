from django.db import models
from django.conf import settings
from django.utils import timezone
from products.models import Product, Category
from analytics.models import UserActivity
import json

class ChatSession(models.Model):
    """Track individual chat sessions with comprehensive behavior analysis"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    session_id = models.CharField(max_length=255, unique=True)
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    # Behavioral tracking
    products_viewed = models.ManyToManyField(Product, through='SessionProductView', blank=True)
    products_clicked = models.ManyToManyField(Product, through='SessionProductClick', related_name='clicked_in_sessions', blank=True)
    categories_interested = models.ManyToManyField(Category, blank=True)
    search_queries = models.JSONField(default=list, blank=True)  # Store all search queries
    
    # Price behavior analysis
    price_range_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_range_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    average_price_interest = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Interaction patterns
    total_messages = models.IntegerField(default=0)
    total_clicks = models.IntegerField(default=0)
    total_searches = models.IntegerField(default=0)
    session_duration = models.DurationField(null=True, blank=True)
    
    # Learned preferences during session - this includes metadata and context
    preferences = models.JSONField(default=dict, blank=True)
    behavioral_score = models.FloatField(default=0.0)  # Engagement score
    
    # Add metadata property for backward compatibility
    @property
    def metadata(self):
        """Backward compatibility - metadata is stored in preferences"""
        if not self.preferences:
            self.preferences = {}
        if 'metadata' not in self.preferences:
            self.preferences['metadata'] = {}
        return self.preferences
    
    @metadata.setter
    def metadata(self, value):
        """Backward compatibility - set metadata in preferences"""
        if not self.preferences:
            self.preferences = {}
        self.preferences.update(value)
    
    class Meta:
        ordering = ['-started_at']
    
    def __str__(self):
        user_info = self.user.username if self.user else f"Anonymous-{self.session_id[:8]}"
        return f"Chat Session - {user_info} ({self.behavioral_score:.1f} score)"
    
    def update_behavioral_score(self):
        """Calculate and update behavioral engagement score"""
        score = 0
        
        # Message activity (up to 20 points)
        score += min(self.total_messages * 2, 20)
        
        # Product interactions (up to 30 points)
        score += min(self.total_clicks * 3, 30)
        
        # Search activity (up to 25 points)
        score += min(self.total_searches * 5, 25)
        
        # Category diversity (up to 15 points)
        score += min(self.categories_interested.count() * 3, 15)
        
        # Session duration bonus (up to 10 points)
        if self.session_duration:
            minutes = self.session_duration.total_seconds() / 60
            score += min(minutes / 2, 10)  # 1 point per 2 minutes, max 10
        
        self.behavioral_score = min(score, 100)
        self.save(update_fields=['behavioral_score'])
        return self.behavioral_score
    
    def add_search_query(self, query):
        """Add a search query to the session"""
        if not self.search_queries:
            self.search_queries = []
        
        self.search_queries.append({
            'query': query,
            'timestamp': timezone.now().isoformat(),
            'results_count': 0  # Will be updated when results are shown
        })
        self.total_searches += 1
        self.save(update_fields=['search_queries', 'total_searches'])
    
    def analyze_search_patterns(self):
        """Analyze search patterns to understand user intent"""
        if not self.search_queries:
            return {}
        
        # Extract keywords from all searches
        all_keywords = []
        categories_mentioned = []
        price_mentions = []
        
        for search_data in self.search_queries:
            query = search_data['query'].lower()
            words = query.split()
            all_keywords.extend(words)
            
            # Check for category mentions
            category_keywords = {
                'electronics': ['phone', 'laptop', 'computer', 'tablet', 'headphones'],
                'clothing': ['shirt', 'pants', 'dress', 'shoes', 'jacket'],
                'home': ['furniture', 'kitchen', 'bedroom', 'decor'],
                'sports': ['fitness', 'gym', 'sports', 'exercise'],
                'beauty': ['makeup', 'skincare', 'beauty', 'cosmetics']
            }
            
            for category, keywords in category_keywords.items():
                if any(keyword in query for keyword in keywords):
                    categories_mentioned.append(category)
            
            # Check for price mentions
            import re
            price_pattern = r'\$?(\d+(?:\.\d{2})?)'
            prices = re.findall(price_pattern, query)
            price_mentions.extend([float(p) for p in prices])
        
        return {
            'frequent_keywords': self._get_frequent_items(all_keywords),
            'categories_of_interest': list(set(categories_mentioned)),
            'price_range_interest': {
                'min': min(price_mentions) if price_mentions else None,
                'max': max(price_mentions) if price_mentions else None,
                'average': sum(price_mentions) / len(price_mentions) if price_mentions else None
            },
            'search_frequency': len(self.search_queries),
            'search_evolution': self._analyze_search_evolution()
        }
    
    def _get_frequent_items(self, items, min_count=2):
        """Get frequently mentioned items"""
        from collections import Counter
        counter = Counter(items)
        return [item for item, count in counter.items() if count >= min_count and len(item) > 2]
    
    def _analyze_search_evolution(self):
        """Analyze how search queries evolved during the session"""
        if len(self.search_queries) < 2:
            return "insufficient_data"
        
        first_query = self.search_queries[0]['query'].lower()
        last_query = self.search_queries[-1]['query'].lower()
        
        # Simple analysis of query evolution
        if len(last_query) > len(first_query) * 1.5:
            return "becoming_more_specific"
        elif len(last_query) < len(first_query) * 0.7:
            return "becoming_more_general"
        else:
            return "consistent_specificity"


class SessionProductView(models.Model):
    """Track when products are viewed during a session"""
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    viewed_at = models.DateTimeField(auto_now_add=True)
    view_duration = models.DurationField(null=True, blank=True)  # How long they looked
    interest_level = models.IntegerField(default=1)  # 1-5 scale based on behavior
    came_from_search = models.BooleanField(default=False)
    came_from_recommendation = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ('session', 'product')
        ordering = ['-viewed_at']
    
    def calculate_interest_level(self):
        """Calculate interest level based on behavior"""
        score = 1  # Base interest
        
        # Duration bonus
        if self.view_duration:
            seconds = self.view_duration.total_seconds()
            if seconds > 30:
                score += 1
            if seconds > 60:
                score += 1
            if seconds > 120:
                score += 1
        
        # Check if they clicked on the product
        if SessionProductClick.objects.filter(session=self.session, product=self.product).exists():
            score += 1
        
        self.interest_level = min(score, 5)
        self.save(update_fields=['interest_level'])
        return self.interest_level


class SessionProductClick(models.Model):
    """Track when products are clicked during a session"""
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    clicked_at = models.DateTimeField(auto_now_add=True)
    click_source = models.CharField(max_length=100, choices=[
        ('search_result', 'Search Result'),
        ('recommendation', 'Chatbot Recommendation'),
        ('category_browse', 'Category Browse'),
        ('related_product', 'Related Product'),
        ('chat_mention', 'Mentioned in Chat')
    ])
    click_position = models.IntegerField(null=True, blank=True)  # Position in list
    
    # Post-click behavior
    added_to_cart = models.BooleanField(default=False)
    time_on_product_page = models.DurationField(null=True, blank=True)
    
    class Meta:
        ordering = ['-clicked_at']
    
    def __str__(self):
        return f"Click: {self.product.name} from {self.click_source}"


class SearchQuery(models.Model):
    """Detailed tracking of search queries"""
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='detailed_searches')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    
    # Query details
    query_text = models.TextField()
    query_timestamp = models.DateTimeField(auto_now_add=True)
    query_type = models.CharField(max_length=100, choices=[
        ('text_search', 'Text Search'),
        ('voice_search', 'Voice Search'),
        ('filter_search', 'Filter Search'),
        ('category_search', 'Category Search')
    ], default='text_search')
    
    # Results and interaction
    results_count = models.IntegerField(default=0)
    results_clicked = models.IntegerField(default=0)
    first_click_position = models.IntegerField(null=True, blank=True)
    
    # Query analysis
    extracted_keywords = models.JSONField(default=list, blank=True)
    detected_intent = models.CharField(max_length=500, blank=True)
    confidence_score = models.FloatField(null=True, blank=True)
    
    # Filters applied
    price_filter_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_filter_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    category_filters = models.JSONField(default=list, blank=True)
    brand_filters = models.JSONField(default=list, blank=True)
    
    class Meta:
        ordering = ['-query_timestamp']
    
    def __str__(self):
        return f"Search: '{self.query_text[:50]}...' ({self.results_count} results)"


class CustomerBehaviorProfile(models.Model):
    """Comprehensive customer behavior analysis"""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='behavior_profile')
    
    # Search behavior patterns
    total_searches = models.IntegerField(default=0)
    average_search_length = models.FloatField(default=0.0)
    most_searched_keywords = models.JSONField(default=list, blank=True)
    search_to_click_ratio = models.FloatField(default=0.0)
    
    # Product interaction patterns
    total_product_views = models.IntegerField(default=0)
    total_product_clicks = models.IntegerField(default=0)
    average_time_per_product = models.DurationField(null=True, blank=True)
    click_to_cart_ratio = models.FloatField(default=0.0)
    
    # Category preferences (learned from behavior)
    preferred_categories = models.JSONField(default=dict, blank=True)  # {category: score}
    avoided_categories = models.JSONField(default=list, blank=True)
    
    # Price behavior
    average_price_viewed = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_sensitivity_score = models.FloatField(default=0.5)  # 0-1 scale
    preferred_price_range = models.JSONField(default=dict, blank=True)
    
    # Shopping patterns
    preferred_shopping_times = models.JSONField(default=dict, blank=True)  # Hour of day patterns
    session_frequency = models.CharField(max_length=20, default='occasional')
    average_session_duration = models.DurationField(null=True, blank=True)
    
    # Engagement metrics
    engagement_score = models.FloatField(default=0.0)  # Overall engagement
    recommendation_acceptance_rate = models.FloatField(default=0.0)
    chat_responsiveness = models.FloatField(default=0.0)
    
    # Learning metadata
    last_updated = models.DateTimeField(auto_now=True)
    data_points_count = models.IntegerField(default=0)
    confidence_level = models.FloatField(default=0.0)  # How confident we are in the profile
    
    def __str__(self):
        return f"Behavior Profile: {self.user.username} (Engagement: {self.engagement_score:.1f})"
    
    def update_from_session(self, session):
        """Update behavior profile from a completed session"""
        # Update search behavior
        search_analysis = session.analyze_search_patterns()
        self.total_searches += session.total_searches
        
        if session.search_queries:
            total_length = sum(len(q['query']) for q in session.search_queries)
            avg_length = total_length / len(session.search_queries)
            
            # Update average search length
            if self.average_search_length == 0:
                self.average_search_length = avg_length
            else:
                self.average_search_length = (self.average_search_length + avg_length) / 2
        
        # Update keyword preferences
        if search_analysis.get('frequent_keywords'):
            current_keywords = set(self.most_searched_keywords)
            new_keywords = set(search_analysis['frequent_keywords'])
            self.most_searched_keywords = list(current_keywords.union(new_keywords))[:20]  # Keep top 20
        
        # Update category preferences
        for category in session.categories_interested.all():
            if category.name not in self.preferred_categories:
                self.preferred_categories[category.name] = 1
            else:
                self.preferred_categories[category.name] += 1
        
        # Update price behavior
        clicked_products = session.products_clicked.all()
        if clicked_products:
            prices = [float(p.price) for p in clicked_products]
            avg_price = sum(prices) / len(prices)
            
            if self.average_price_viewed is None:
                self.average_price_viewed = avg_price
            else:
                # Weighted average with previous data
                self.average_price_viewed = (float(self.average_price_viewed) + avg_price) / 2
        
        # Update engagement metrics
        self.total_product_views += session.products_viewed.count()
        self.total_product_clicks += session.total_clicks
        
        # Calculate ratios
        if self.total_searches > 0:
            self.search_to_click_ratio = self.total_product_clicks / self.total_searches
        
        # Update engagement score
        self.engagement_score = session.behavioral_score
        
        # Update confidence level based on data points
        self.data_points_count += 1
        self.confidence_level = min(self.data_points_count / 10, 1.0)  # Max confidence at 10 sessions
        
        self.save()
    
    def get_personalized_recommendations_weights(self):
        """Get weights for recommendation algorithm based on behavior"""
        return {
            'category_weight': min(len(self.preferred_categories) / 5, 1.0),
            'price_weight': self.price_sensitivity_score,
            'popularity_weight': 1.0 - self.engagement_score / 100,  # Less engaged users get popular items
            'similarity_weight': self.engagement_score / 100,  # More engaged users get similar items
            'novelty_weight': max(0.3, 1.0 - self.confidence_level)  # Less confident = more exploration
        }


class ChatMessage(models.Model):
    """Enhanced chat messages with behavior tracking"""
    MESSAGE_TYPES = (
        ('user', 'User Message'),
        ('bot', 'Bot Response'),
        ('system', 'System Message'),
    )
    
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    message_type = models.CharField(max_length=10, choices=MESSAGE_TYPES)
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # Enhanced tracking for user messages
    contains_search_intent = models.BooleanField(default=False)
    contains_price_mention = models.BooleanField(default=False)
    contains_category_mention = models.BooleanField(default=False)
    
    # For bot messages
    intent_detected = models.CharField(max_length=100, blank=True)
    confidence_score = models.FloatField(null=True, blank=True)
    products_recommended = models.ManyToManyField(Product, blank=True)
    
    # User response tracking
    user_responded = models.BooleanField(default=False)
    response_time = models.DurationField(null=True, blank=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    
    class Meta:
        ordering = ['timestamp']
    
    def analyze_user_message(self):
        """Analyze user message for behavioral insights"""
        content_lower = self.content.lower()
        
        # Check for search intent
        search_keywords = ['looking for', 'find', 'search', 'show me', 'need', 'want']
        self.contains_search_intent = any(keyword in content_lower for keyword in search_keywords)
        
        # Check for price mentions
        import re
        price_pattern = r'\$\d+|\d+\s*dollars?|cheap|expensive|budget|affordable|price'
        self.contains_price_mention = bool(re.search(price_pattern, content_lower))
        
        # Check for category mentions
        categories = ['electronics', 'clothing', 'home', 'sports', 'beauty', 'books', 'toys']
        self.contains_category_mention = any(cat in content_lower for cat in categories)
        
        self.save(update_fields=['contains_search_intent', 'contains_price_mention', 'contains_category_mention'])


class ProductRecommendation(models.Model):
    """Enhanced product recommendations with detailed tracking"""
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    recommendation_score = models.FloatField()
    recommendation_type = models.CharField(max_length=50, choices=[
        ('content_based', 'Content-Based'),
        ('collaborative', 'Collaborative Filtering'),
        ('popular', 'Popular Items'),
        ('behavioral', 'Behavioral Pattern'),
        ('hybrid', 'Hybrid Approach')
    ])
    reason = models.TextField()
    
    # Detailed tracking
    shown_at = models.DateTimeField(auto_now_add=True)
    position_in_list = models.IntegerField(default=1)
    
    # User interactions
    was_viewed = models.BooleanField(default=False)
    was_clicked = models.BooleanField(default=False)
    was_added_to_cart = models.BooleanField(default=False)
    was_purchased = models.BooleanField(default=False)
    
    # Timing
    time_to_click = models.DurationField(null=True, blank=True)
    time_on_product = models.DurationField(null=True, blank=True)
    
    # Feedback
    user_feedback = models.CharField(max_length=20, choices=[
        ('helpful', 'Helpful'),
        ('not_relevant', 'Not Relevant'),
        ('too_expensive', 'Too Expensive'),
        ('not_interested', 'Not Interested')
    ], blank=True)
    
    class Meta:
        ordering = ['-recommendation_score']
    
    def __str__(self):
        return f"Recommended {self.product.name} (Score: {self.recommendation_score:.2f}, Type: {self.recommendation_type})"
    
    def calculate_effectiveness_score(self):
        """Calculate how effective this recommendation was"""
        score = 0
        
        if self.was_viewed:
            score += 1
        if self.was_clicked:
            score += 3
        if self.was_added_to_cart:
            score += 5
        if self.was_purchased:
            score += 10
        
        # Position penalty (lower positions should perform better)
        position_penalty = max(0, (self.position_in_list - 1) * 0.1)
        score = max(0, score - position_penalty)
        
        return score


class BehaviorAnalytics(models.Model):
    """Aggregate analytics for behavior patterns"""
    date = models.DateField(auto_now_add=True)
    
    # Daily aggregates
    total_sessions = models.IntegerField(default=0)
    total_searches = models.IntegerField(default=0)
    total_clicks = models.IntegerField(default=0)
    total_recommendations = models.IntegerField(default=0)
    
    # Performance metrics
    average_session_duration = models.DurationField(null=True, blank=True)
    search_to_click_ratio = models.FloatField(default=0.0)
    recommendation_click_rate = models.FloatField(default=0.0)
    
    # Popular patterns
    top_search_keywords = models.JSONField(default=list, blank=True)
    top_categories = models.JSONField(default=list, blank=True)
    peak_hours = models.JSONField(default=list, blank=True)
    
    class Meta:
        unique_together = ('date',)
        ordering = ['-date']
    
    def __str__(self):
        return f"Analytics for {self.date}: {self.total_sessions} sessions"
