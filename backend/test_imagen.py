import requests
from ai_service import GeminiKeyManager
import json

def test_imagen():
    key_mgr = GeminiKeyManager()
    api_key = key_mgr.get_current_key()
    if not api_key:
        print("No API Key")
        return
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key={api_key}"
    payload = {
        "instances": [{"prompt": "A modern minimalist logo for a tech company"}],
        "parameters": {"sampleCount": 1, "aspectRatio": "1:1"}
    }
    
    headers = {"Content-Type": "application/json"}
    res = requests.post(url, json=payload, headers=headers)
    
    print(f"Status Code: {res.status_code}")
    if res.status_code != 200:
        try:
            print("Response:", res.json())
        except:
            print("Response text:", res.text)
    else:
        print("Success! Got predictions.")
        
test_imagen()
