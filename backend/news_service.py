import requests
from datetime import datetime
import json
import asyncio

class NewsService:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Referer": "https://www.bilibili.com/"
        }
        # Hatsune Miku Official Bilibili UID
        self.miku_uid = "1749343"
        
        self.categories = {
            "演唱会/活动": ["演唱会", "live", "magical mirai", "雪miku", "活动", "展会"],
            "新曲发布": ["新曲", "新歌", "投稿", "殿堂", "发布"],
            "周边商品": ["手办", "周边", "预售", "发售", "特典"],
            "游戏更新": ["project diva", "project sekai", "更新", "联动"],
            "社区动态": ["粉丝", "同人", "创作", "感谢"]
        }

    def _classify_news(self, text):
        """Classify news based on keywords"""
        text_lower = text.lower()
        for category, keywords in self.categories.items():
            if any(kw in text_lower for kw in keywords):
                return category
        return "社区动态"  # Default category

    def get_latest_news(self):
        """Fetch latest news from Piapro Blog RSS"""
        url = "https://blog.piapro.net/feed"
        
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            if response.status_code != 200:
                print(f"RSS Fetch Error: {response.status_code}")
                return []
                
            content = response.text
            import re
            
            # Simple regex for RSS parsing
            items = re.findall(r'<item>(.*?)</item>', content, re.DOTALL)
            news_items = []
            
            for item in items:
                try:
                    # Extract title
                    title_match = re.search(r'<title>(.*?)</title>', item)
                    title = title_match.group(1) if title_match else "No Title"
                    title = title.replace('<![CDATA[', '').replace(']]>', '')
                    
                    # Extract link
                    link_match = re.search(r'<link>(.*?)</link>', item)
                    link = link_match.group(1) if link_match else ""
                    
                    # Extract date
                    date_match = re.search(r'<pubDate>(.*?)</pubDate>', item)
                    pub_date = date_match.group(1) if date_match else ""
                    # Format date: Thu, 27 Nov 2025 08:00:02 +0000 -> 2025-11-27 08:00
                    try:
                        dt = datetime.strptime(pub_date, "%a, %d %b %Y %H:%M:%S %z")
                        pub_date = dt.strftime("%Y-%m-%d %H:%M")
                    except:
                        pass
                    
                    # Extract content/description for thumbnail and snippet
                    desc_match = re.search(r'<content:encoded>(.*?)</content:encoded>', item, re.DOTALL)
                    if not desc_match:
                        desc_match = re.search(r'<description>(.*?)</description>', item, re.DOTALL)
                    
                    desc = desc_match.group(1) if desc_match else ""
                    desc_clean = re.sub(r'<[^>]+>', '', desc).replace('<![CDATA[', '').replace(']]>', '').strip()
                    
                    # Find image in description
                    img_match = re.search(r'<img.*?src="([^"]+)".*?>', desc)
                    thumbnail = img_match.group(1) if img_match else None
                    
                    # Filter out emoji images (wp-includes/images/smilies or s.w.org)
                    if thumbnail and ('s.w.org' in thumbnail or 'emoji' in thumbnail):
                        thumbnail = None
                        
                    # Fallback to finding image in the article content if possible (not available in RSS usually)
                    
                    news_items.append({
                        "id": link, # Use link as ID
                        "title": title,
                        "content": desc_clean[:200] + "...",
                        "category": self._classify_news(title + " " + desc_clean),
                        "source": "Piapro官方博客",
                        "publishTime": pub_date,
                        "url": link,
                        "thumbnail": thumbnail
                    })
                except Exception as e:
                    print(f"Error parsing RSS item: {e}")
                    continue
                    
            return news_items
            
        except Exception as e:
            print(f"News fetch error: {e}")
            return []

if __name__ == "__main__":
    service = NewsService()
    news = service.get_latest_news()
    print(json.dumps(news, indent=2, ensure_ascii=False))
