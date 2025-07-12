from django.test import TestCase
from chatbot.ai_chatbot import AIChatbot
from sklearn.metrics import confusion_matrix
  

class TestAIChatbotModelPerformance(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.chatbot = AIChatbot()

    def test_intent_classifier_performance(self):
        """
        Evaluate the intent classifier's accuracy on its test set.
        This test will fail if accuracy is below 80% (adjust as needed).
        """
        # Generate comprehensive training data and split
        data = self.chatbot._generate_comprehensive_training_data()
        train_data, test_data = self.chatbot._split_data(data, test_size=0.2)
        
        # Prepare test features and labels
        test_texts = [item['text'] for item in test_data]
        test_intents = [item['intent'] for item in test_data]
        X_test = self.chatbot.vectorizer.transform(test_texts)
        y_pred = self.chatbot.intent_classifier.predict(X_test)
        
        # Calculate accuracy
        from sklearn.metrics import accuracy_score, classification_report
        accuracy = accuracy_score(test_intents, y_pred)
        print("\nClassification Report:\n", classification_report(test_intents, y_pred))
        print(f"Test accuracy: {accuracy:.4f}")
        print(confusion_matrix(test_intents, y_pred))
        
        # Assert accuracy threshold
        assert accuracy >= 0.80, f"Model accuracy too low: {accuracy:.2%}" 