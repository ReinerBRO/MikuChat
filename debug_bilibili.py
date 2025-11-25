import requests

def test_bilibili_search(q):
    url = "https://api.bilibili.com/x/web-interface/search/type"
    params = {
        "search_type": "video",
        "keyword": q,
        "page": 1,
        "page_size": 10
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Referer": "https://www.bilibili.com/"
    }
    
    print(f"Testing search for: {q}")
    try:
        response = requests.get(url, params=params, headers=headers, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Content Type: {response.headers.get('Content-Type')}")
        print(f"Response Text Preview: {response.text[:500]}")
        
        data = response.json()
        print("JSON Decode Success")
        if data['code'] == 0:
            print(f"Found {len(data['data']['result'])} results")
        else:
            print(f"API Error Code: {data['code']}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_bilibili_search("千本樱")
