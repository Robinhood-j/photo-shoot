# test_analyze.py
import requests, json

url = "http://127.0.0.1:5000/api/analyze"
payload = {"image_url":"https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1600&q=80"}

try:
    r = requests.post(url, json=payload, timeout=20)
    print("status:", r.status_code)
    try:
        print(json.dumps(r.json(), indent=2))
    except Exception:
        print("response text:", r.text)
except Exception as e:
    print("Request failed:", repr(e))
