"""Test script to verify Zhipu AI GLM-5 integration."""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from app.llm import get_chat_model

print("Testing Zhipu AI GLM-5 integration...")
print("=" * 50)

# Get the model
model = get_chat_model()
print(f"Model type: {type(model)}")
print(f"Model class: {model.__class__.__name__}")
print(f"Model name: {getattr(model, 'model', 'N/A')}")

# Test a simple invocation
print("\nInvoking model with test message...")
try:
    response = model.invoke("Hello! Please respond with just one sentence about who you are.")
    print(f"\nResponse: {response.content}")
    print("\n✅ Zhipu AI GLM-5 is working!")
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
