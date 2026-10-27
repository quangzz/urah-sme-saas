import traceback
from ai_service import GeminiKeyManager

try:
    ai = GeminiKeyManager()
    print("KEYS:", ai.keys)
    result = ai.generate_brandkit("test prompt")
    print("RESULT OK:")
    print(result)
except Exception as e:
    print("CRASH:", str(e))
    traceback.print_exc()
