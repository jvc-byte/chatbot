import google.generativeai as genai
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Configure Google Gemini API
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# List available models
for m in genai.list_models():
    print(f"Model name: {m.name}")
    print(f"Display name: {m.display_name}")
    print(f"Description: {m.description}")
    print("Supported generation methods:", m.supported_generation_methods)
    print("-" * 80)
