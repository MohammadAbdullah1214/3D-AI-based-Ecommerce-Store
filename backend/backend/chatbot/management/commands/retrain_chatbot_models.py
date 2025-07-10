import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from chatbot.ai_chatbot import AIChatbot

if __name__ == "__main__":
    print("[INFO] Initializing AIChatbot for model retraining...")
    bot = AIChatbot()
    print("[INFO] Starting model retraining...")
    bot.train_models()
    print("✅ Chatbot models retrained successfully.") 