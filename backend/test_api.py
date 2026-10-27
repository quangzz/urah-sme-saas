import requests
payload = {
    "businessName": "Test Business",
    "industry": "Tech",
    "colorStyle": "Modern",
    "slogan": "We do tech"
}
try:
    r = requests.post("http://localhost:8000/api/generate-brandkit", json=payload)
    print("Status:", r.status_code)
    print("Response:", r.text)
except Exception as e:
    print("Error:", e)
