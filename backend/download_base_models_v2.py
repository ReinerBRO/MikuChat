import os
from huggingface_hub import hf_hub_download

# Set mirror
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

repo_id = "lj1995/GPT-SoVITS"
local_dir = "backend/gpt_sovits_core/GPT_SoVITS/pretrained_models"
os.makedirs(local_dir, exist_ok=True)

# Full list of required files for BERT-style models and Hubert
files_to_download = [
    # Hubert
    ("chinese-hubert-base/config.json", "chinese-hubert-base/config.json"),
    ("chinese-hubert-base/preprocessor_config.json", "chinese-hubert-base/preprocessor_config.json"), # MISSING
    ("chinese-hubert-base/pytorch_model.bin", "chinese-hubert-base/pytorch_model.bin"),
    ("chinese-hubert-base/pytorch_model.bin", "chinese-hubert-base/pretrain_250k.pth"),
    
    # RoBERTa
    ("chinese-roberta-wwm-ext-large/config.json", "chinese-roberta-wwm-ext-large/config.json"),
    ("chinese-roberta-wwm-ext-large/pytorch_model.bin", "chinese-roberta-wwm-ext-large/pytorch_model.bin"),
    ("chinese-roberta-wwm-ext-large/tokenizer.json", "chinese-roberta-wwm-ext-large/tokenizer.json"),
    
    # GSV v2 Base Models
    ("gsv-v2final-pretrained/s1bert25hz-5kh-longer-epoch=12-step=369668.ckpt", "s1bert250k.ckpt"),
    ("gsv-v2final-pretrained/s2G2333k.pth", "s2G431k.pth"), 
]

print(f"Downloading/Verifying base models in {local_dir}...")
for remote_path, local_name in files_to_download:
    try:
        dest_path = os.path.join(local_dir, local_name)
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        
        if os.path.exists(dest_path):
            print(f"File {local_name} already exists.")
            continue

        print(f"Downloading {remote_path} -> {local_name}...")
        hf_hub_download(
            repo_id=repo_id, 
            filename=remote_path, 
            local_dir=local_dir, 
            local_dir_use_symlinks=False
        )
        
        downloaded_path = os.path.join(local_dir, remote_path)
        if downloaded_path != dest_path:
            import shutil
            if os.path.exists(downloaded_path):
                shutil.copy2(downloaded_path, dest_path)
            
    except Exception as e:
        print(f"Failed to download {remote_path}: {e}")

print("Done!")
