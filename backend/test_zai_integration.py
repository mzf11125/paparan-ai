"""Test script to verify Z.AI GLM integration.

This script tests:
1. Z.AI model initialization
2. Basic chat completion
3. Thinking mode (if enabled)
4. Streaming responses

Run with: python test_zai_integration.py
"""
import asyncio
import os
import sys

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app.llm import create_zai_model, get_chat_model, get_agent_model
from app.config import settings


async def test_zai_basic():
    """Test basic Z.AI model initialization and chat."""
    print("=" * 60)
    print("Testing Z.AI GLM Integration")
    print("=" * 60)

    print(f"\n📋 Configuration:")
    print(f"  LLM_PROVIDER: {settings.LLM_PROVIDER}")
    print(f"  ZAI_MODEL: {settings.ZAI_MODEL}")
    print(f"  ZAI_BASE_URL: {settings.ZAI_BASE_URL}")
    print(f"  ZAI_MAX_TOKENS: {settings.ZAI_MAX_TOKENS}")
    print(f"  ZAI_TEMPERATURE: {settings.ZAI_TEMPERATURE}")
    print(f"  ZAI_ENABLE_THINKING: {settings.ZAI_ENABLE_THINKING}")

    if not settings.ZAI_API_KEY:
        print("\n❌ ERROR: ZAI_API_KEY not set. Please set ZAI_API_KEY in .env file.")
        return False

    print(f"\n  ZAI_API_KEY: {'*' * (len(settings.ZAI_API_KEY) - 4)}{settings.ZAI_API_KEY[-4:]}")

    try:
        # Test 1: Create Z.AI model
        print("\n" + "=" * 60)
        print("Test 1: Creating Z.AI Model")
        print("=" * 60)

        model = create_zai_model(
            model=settings.ZAI_MODEL,
            base_url=settings.ZAI_BASE_URL,
            api_key=settings.ZAI_API_KEY,
            max_tokens=100,  # Short for testing
            temperature=0.7,
            enable_thinking=False,  # Test without thinking first
        )
        print(f"✅ Model created: {model.model_name}")
        print(f"   Max Tokens: {model.max_tokens}")
        print(f"   Temperature: {model.temperature}")

        # Test 2: Simple chat completion
        print("\n" + "=" * 60)
        print("Test 2: Simple Chat Completion")
        print("=" * 60)

        response = model.invoke([
            {"role": "system", "content": "You are a helpful assistant for ASEAN policy intelligence."},
            {"role": "user", "content": "What is the capital of Indonesia? Answer in one sentence."}
        ])

        print(f"✅ Response received:")
        print(f"   {response.content}")

        # Test 3: Chat completion with thinking mode
        if settings.ZAI_ENABLE_THINKING:
            print("\n" + "=" * 60)
            print("Test 3: Chat Completion with Thinking Mode")
            print("=" * 60)

            model_thinking = create_zai_model(
                model=settings.ZAI_MODEL,
                base_url=settings.ZAI_BASE_URL,
                api_key=settings.ZAI_API_KEY,
                max_tokens=200,
                enable_thinking=True,
            )
            print(f"✅ Thinking model created with model_kwargs: {model_thinking.model_kwargs}")

            response_thinking = model_thinking.invoke([
                {"role": "system", "content": "You are a policy analyst."},
                {"role": "user", "content": "List 3 key ASEAN member states in alphabetical order."}
            ])

            print(f"✅ Response received:")
            print(f"   {response_thinking.content}")

        # Test 4: Streaming
        print("\n" + "=" * 60)
        print("Test 4: Streaming Response")
        print("=" * 60)

        print("Streaming (first 5 chunks):")
        chunk_count = 0
        for chunk in model.stream([
            {"role": "user", "content": "Count from 1 to 3."}
        ]):
            if chunk_count < 5:
                print(f"   Chunk {chunk_count + 1}: {chunk.content[:50]}...")
            chunk_count += 1
        print(f"✅ Total chunks received: {chunk_count}")

        # Test 5: Factory functions
        print("\n" + "=" * 60)
        print("Test 5: Factory Functions")
        print("=" * 60)

        chat_model = get_chat_model()
        print(f"✅ get_chat_model() returned: {type(chat_model).__name__}")
        print(f"   Model: {chat_model.model_name}")

        agent_model = get_agent_model()
        print(f"✅ get_agent_model() returned: {type(agent_model).__name__}")
        if hasattr(agent_model, 'model_name'):
            print(f"   Model: {agent_model.model_name}")
        else:
            print(f"   Model: {agent_model}")

        print("\n" + "=" * 60)
        print("✅ All tests passed!")
        print("=" * 60)
        return True

    except Exception as e:
        print(f"\n❌ ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    asyncio.run(test_zai_basic())
