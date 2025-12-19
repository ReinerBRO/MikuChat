import os
from PIL import Image

SHOP_DIR = '../frontend/public/shop'

def remove_background(filename):
    path = os.path.join(SHOP_DIR, filename)
    if not os.path.exists(path):
        print(f"File not found: {path}")
        return

    print(f"Processing {filename}...")
    try:
        img = Image.open(path).convert("RGBA")
        width, height = img.size
        pixels = img.load()

        # Identify potential background colors by scanning the perimeter
        perimeter_colors = set()
        
        # Top and Bottom edges
        for x in range(width):
            perimeter_colors.add(pixels[x, 0])
            perimeter_colors.add(pixels[x, height-1])
            
        # Left and Right edges
        for y in range(height):
            perimeter_colors.add(pixels[0, y])
            perimeter_colors.add(pixels[width-1, y])

        # Heuristic: If there are too many colors on the border, it might not be a simple background
        # But for checkerboards (2 colors) or solid (1 color), this is small.
        # If it's a complex image touching borders, this might delete parts of it.
        # However, these are icons 'floating' in a frame, so this should be safe.
        print(f"  Found {len(perimeter_colors)} unique colors on perimeter.")

        # Flood fill from all border pixels if their color is in perimeter_colors
        # We need a visited set to avoid loops
        visited = set()
        queue = []

        # Initialize queue with all border pixels
        for x in range(width):
            queue.append((x, 0))
            queue.append((x, height-1))
        for y in range(height):
            queue.append((0, y))
            queue.append((width-1, y))

        # BFS
        while queue:
            x, y = queue.pop(0)
            
            if (x, y) in visited:
                continue
            
            if x < 0 or x >= width or y < 0 or y >= height:
                continue

            current_color = pixels[x, y]
            
            # If this pixel's color is one of the known 'background' colors from the perimeter, remove it
            if current_color in perimeter_colors:
                pixels[x, y] = (0, 0, 0, 0) # Transparent
                visited.add((x, y))
                
                # Add neighbors
                queue.append((x+1, y))
                queue.append((x-1, y))
                queue.append((x, y+1))
                queue.append((x, y-1))

        # Save back
        img.save(path)
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
    remove_background(f)
