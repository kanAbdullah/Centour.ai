# llm_service.py
from google import genai
import os
from dotenv import load_dotenv

load_dotenv()

class llm_service:
    def __init__(self):

        load_dotenv()
        
        api_key = os.getenv("GEMINI_API_KEY")
        self.client = genai.Client(api_key=api_key)
        self.model= "gemini-2.5-flash-lite"

    def ask(self, messages):
        """
        messages: [
            {"role": "User", "content": "Hello"},
            {"role": "System", "content": "Hi there!"}
        ]
        """
        if not messages or len(messages) == 0:
            raise ValueError("❌ Empty messages list passed to ask()")

        chat = self.client.chats.create(model=self.model)
        formatted = "\n".join([f"{m['author']}: {m['message']}" for m in messages])
        response = chat.send_message(formatted)

        # Cevabı döndür
        try:
            return response.text
        except:
            return "⚠️ Gemini yanıt oluşturamadı."

    def ask_stream(self, messages):
        """Streaming metodu - Generator döndürür"""
        if not messages or len(messages) == 0:
            raise ValueError("❌ Empty messages list passed to ask_stream()")

        formatted = "\n".join([f"{m['author']}: {m['message']}" for m in messages])
        
        try:
            # Google GenAI streaming API
            for chunk in self.client.models.generate_content_stream(
                model=self.model,
                contents=formatted
            ):
                if chunk.text:
                    yield chunk.text
                    
        except Exception as e:
            print(f"⚠️ Streaming hatası: {str(e)}")
            yield f"⚠️ Streaming hatası: {str(e)}"

llm_service = llm_service()
