import os
from huggingface_hub import hf_hub_download

# Set mirror
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

repo_id = "lj1995/GPT-SoVITS"
local_dir = "backend/gpt_sovits_core/GPT_SoVITS/pretrained_models"
os.makedirs(local_dir, exist_ok=True)

files = [
    "chinese-hubert-base/config.json",
    "chinese-hubert-base/pretrain_250k.pth",
    "chinese-roberta-wwm-ext-large/config.json",
    "chinese-roberta-wwm-ext-large/pytorch_model.bin",
    "s1bert250k.ckpt",
    "s2G431k.pth"
]

print(f"Downloading base models to {local_dir}...")
for f in files:
    try:
        print(f"Downloading {f}...")
        hf_hub_download(repo_id=repo_id, filename=f, local_dir=local_dir, local_dir_use_symlinks=False)
    except Exception as e:
        print(f"Failed to download {f}: {e}")

print("Done!")
