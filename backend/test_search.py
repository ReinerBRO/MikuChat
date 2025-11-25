import yt_dlp
import json

def search_music(q):
    print(f"Searching for: {q}")
    ydl_opts = {
        'format': 'bestaudio/best',
        'noplaylist': True,
        'quiet': False, # Enable output to see errors
        'extract_flat': True,
        'default_search': 'ytsearch5'
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f"ytsearch5:{q}", download=False)
            print("Search finished.")
            
            results = []
            if 'entries' in info:
                for entry in info['entries']:
                    print(f"Found: {entry.get('title')} ({entry.get('id')})")
                    results.append({
                        "id": entry['id'],
                        "title": entry['title'],
                        "duration": entry.get('duration', 0),
                        "uploader": entry.get('uploader', 'Unknown'),
                        "type": "online"
                    })
            return results
    except Exception as e:
        print(f"Search error: {e}")
        return []

if __name__ == "__main__":
    results = search_music("Miku World is Mine")
    print(json.dumps(results, indent=2))
