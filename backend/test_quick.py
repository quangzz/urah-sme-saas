from ai_service import ai_manager
import traceback

print(f"Keys loaded: {len(ai_manager.keys)}")
print(f"Current key index: {ai_manager.current_index}")
print(f"Current key (first 10 chars): {ai_manager.get_current_key()[:10]}...")

prompt = 'Return pure JSON: {"primaryColor": "#FF5733", "secondaryColor": "#C70039"}'

try:
    result = ai_manager.generate_brandkit(prompt)
    print(f"SUCCESS: {result}")
except Exception as e:
    print(f"FAILED: {e}")
    traceback.print_exc()
