import os
from PIL import Image

SHOP_DIR = '../frontend/public/shop'

def make_white_transparent(filename, threshold=240):
    path = os.path.join(SHOP_DIR, filename)
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return

    print(f"Processing {filename}...")
    try:
        img = Image.open(path).convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # If r,g,b are all greater than threshold (close to white)
            if item[0] > threshold and item[1] > threshold and item[2] > threshold:
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)

        img.putdata(newData)
        img.save(path, "PNG")
        print(f"  Saved {filename}")

    except Exception as e:
        print(f"  Error processing {filename}: {e}")

# List of files to process
files = [
    'negi_shake.png',
    'strawberry_cake.png',
    'bg_vaporwave.png',
    'bg_stage.png',
    'outfit_school.png',
    'song_worldismine.png'
]

for f in files:
    make_white_transparent(f)
