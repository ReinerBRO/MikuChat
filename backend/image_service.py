import requests
import random
import sys
from typing import Optional, Dict

class ImageService:
    def __init__(self):
        self.safebooru_url = "https://safebooru.org/index.php"
        
    def get_random_miku_image(self) -> Optional[Dict]:
        """
        Fetch a random Hatsune Miku image from Safebooru
        Returns dict with image_url, source_url, and tags
        """
        proxies_list = [
            None, # Try direct connection first
            {'http': 'http://127.0.0.1:7897', 'https': 'http://127.0.0.1:7897'},
            {'http': 'http://127.0.0.1:7890', 'https': 'http://127.0.0.1:7890'}
        ]

        for proxy in proxies_list:
            try:
                proxy_name = proxy['http'] if proxy else "Direct"
                sys.stderr.write(f"Trying connection via {proxy_name}...\n")
                sys.stderr.flush()
                
                params = {
                    "page": "dapi",
                    "s": "post",
                    "q": "index",
                    "tags": "hatsune_miku rating:safe",
                    "limit": 20,
                    "json": 1
                }
                
                response = requests.get(
                    self.safebooru_url, 
                    params=params, 
                    timeout=3,
                    proxies=proxy
                )
                
                if response.status_code != 200:
                    sys.stderr.write(f"Failed with status {response.status_code}\n")
                    continue
                    
                images = response.json()
                if not images:
                    continue
                
                # Filter out images with 'demon' in tags
                filtered_images = [
                    img for img in images 
                    if 'demon' not in img.get('tags', '').lower()
                ]
                
                if not filtered_images:
                    sys.stderr.write("No images after filtering 'demon' tags\n")
                    continue
                
                # Randomly select one image from filtered list
                image = random.choice(filtered_images)
                
                # Construct the full image URL
                if 'file_url' in image:
                    image_url = image['file_url']
                else:
                    image_url = f"https://safebooru.org/images/{image.get('directory', '')}/{image.get('image', '')}"
                
                result = {
                    "image_url": image_url,
                    "source_url": f"https://safebooru.org/index.php?page=post&s=view&id={image.get('id', '')}",
                    "tags": image.get('tags', '').split()[:10],
                    "width": image.get('width', 0),
                    "height": image.get('height', 0),
                    "rating": image.get('rating', 'safe')
                }
                sys.stderr.write(f"Success via {proxy_name}\n")
                return result

            except Exception as e:
                sys.stderr.write(f"Error via {proxy_name}: {str(e)}\n")
                continue
        
        sys.stderr.write("All connection attempts failed\n")
        return None
