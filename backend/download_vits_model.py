from huggingface_hub import hf_hub_download
import os

os.makedirs('backend/models/miku', exist_ok=True)

try:
    print("Downloading config.json...")
    hf_hub_download(repo_id="zomehwh/vits-models", filename="pretrained_models/hatsune/config.json", local_dir="backend/models/miku", local_dir_use_symlinks=False)
    
    print("Downloading miku.pth...")
    hf_hub_download(repo_id="zomehwh/vits-models", filename="pretrained_models/hatsune/hatsune.pth", local_dir="backend/models/miku", local_dir_use_symlinks=False)
    
    # Move files from subdirectories to backend/models/miku root if needed
    # hf_hub_download keeps the directory structure "pretrained_models/hatsune/..."
except Exception as e:
    print(f"Error: {e}")
