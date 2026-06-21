import sys
import os

# Add the backend path so app module can be found
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + "/backend")

from app.ai.llms.provider_factory import get_llm

if __name__ == "__main__":
    print("Testing get_llm('engineering')...")
    try:
        llm = get_llm("engineering")
        print(f"Success! Acquired model: {llm.model}")
        print("Invoking model...")
        response = llm.invoke("Say hello world")
        print(f"Response: {response.content}")
    except Exception as e:
        print(f"Failed: {e}")
