import os
import sys
import uuid
import torch
import soundfile as sf
import re

# Add GPT-SoVITS paths
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
GSV_CORE_DIR = os.path.join(BACKEND_DIR, "gpt_sovits_core")
GSV_SUB_DIR = os.path.join(GSV_CORE_DIR, "GPT_SoVITS")

sys.path.insert(0, GSV_CORE_DIR)
sys.path.insert(0, GSV_SUB_DIR)

# Constants for Miku Weights
GPT_WEIGHTS = os.path.join(BACKEND_DIR, "models/gpt_sovits/miku/weights/MikuEX-e15.ckpt")
SOVITS_WEIGHTS = os.path.join(BACKEND_DIR, "models/gpt_sovits/miku/weights/MikuEX_e8_s200.pth")
REF_AUDIO_DIR = os.path.join(BACKEND_DIR, "models/gpt_sovits/miku/reference")

# Default reference (Hello message)
DEFAULT_REF_AUDIO = os.path.join(REF_AUDIO_DIR, "こんにちは、はずねみくです。こんばんは、はずねみくです。 .wav")
DEFAULT_REF_TEXT = "こんにちは、初音ミクです。こんばんは、初音ミクです。"
DEFAULT_REF_LANG = "日文"

AUDIO_DIR = os.path.join(BACKEND_DIR, "static/audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

# Device configuration (MPS for Mac, CUDA for Windows, CPU fallback)
def get_device():
    if torch.cuda.is_available():
        return "cuda"
    elif torch.backends.mps.is_available():
        return "mps"
    return "cpu"

DEVICE = get_device()
print(f"TTS Service using device: {DEVICE}")

# Pre-set environment variables...
os.environ["gpt_path"] = GPT_WEIGHTS
os.environ["sovits_path"] = SOVITS_WEIGHTS
os.environ["is_half"] = "False" 
os.environ["device"] = DEVICE

# Set BERT and CNHubert paths dynamically (relative to project structure)
PRETRAINED_MODELS_DIR = os.path.join(GSV_SUB_DIR, "pretrained_models")
os.environ["bert_path"] = os.path.join(PRETRAINED_MODELS_DIR, "chinese-roberta-wwm-ext-large")
os.environ["cnhubert_base_path"] = os.path.join(PRETRAINED_MODELS_DIR, "chinese-hubert-base")

_initialized = False

def init_gsv():
    global _initialized
    if _initialized:
        return
    
    try:
        # We need to change directory to GSV_CORE_DIR for its internal relative imports
        os.chdir(GSV_CORE_DIR)
        
        # Now import
        import GPT_SoVITS.inference_webui as gsv_webui
        
        # Force define the variables that cause UnboundLocalError in their UI-centric code
        # This is a hack to make their generator function work in a script environment
        dummy_update = {"__type__": "update", "value": ""}
        
        # Load GPT weights
        gsv_webui.change_gpt_weights(gpt_path=GPT_WEIGHTS)
        
        # Manually trigger the weight loading part of the generator
        # We need to avoid the yields that use undefined UI variables
        # The easiest way is to use a simplified version of their logic or 
        # just handle the specific error during the yield
        
        print(f"Loading SoVITS weights from {SOVITS_WEIGHTS}...")
        
        # We use a loop to consume the generator until weights are loaded
        # The variables it complains about are only used in the YIELD expressions
        gen = gsv_webui.change_sovits_weights(sovits_path=SOVITS_WEIGHTS, prompt_language="日文", text_language="日文")
        try:
            next(gen) # Hits first yield
        except (UnboundLocalError, NameError, StopIteration):
            pass
        except Exception as e:
            print(f"Non-critical yield error: {e}")
            
        os.chdir(BACKEND_DIR)
        _initialized = True
        print("GPT-SoVITS Model loaded successfully!")
    except Exception as e:
        os.chdir(BACKEND_DIR)
        print(f"Failed to load GPT-SoVITS: {e}")
        import traceback
        traceback.print_exc()

# Emotion Mapping to Reference Audios
EMOTION_MAP = {
    "NORMAL": {
        "wav": "こんにちは、はずねみくです。こんばんは、はずねみくです。 .wav",
        "text": "こんにちは、初音ミクです。こんばんは、初音ミクです。"
    },
    "HAPPY": {
        "wav": "うれしい。いってきます。おじゃまします。 .wav",
        "text": "うれしい。いってきます。おじゃまします。"
    },
    "SURPRISED": {
        "wav": "お疲れさま。信じられない。あ。 .wav",
        "text": "お疲れさま。信じられない。あ。"
    },
    "ANGRY": {
        "wav": "冗談を言わないでください。关系ないでしょう。.wav",
        "text": "冗谈を言わないでください。関系ないでしょう。"
    },
    "MOTIVATED": {
        "wav": "がんばります。いただきます。どういたしまして。 .wav",
        "text": "がんばります。いただきます。どういたしまして。"
    },
    "EMPATHY": {
        "wav": "なるほど。たいへん。おかえり。 .wav",
        "text": "なるほど。大変。おかえり。"
    },
    "POLITE": {
        "wav": "おやすみなさい。初めまして。ごめんなさい。 .wav",
        "text": "おやすみなさい。初めまして。ごめんなさい。"
    }
}

async def generate_tts(text: str) -> str | None:
    """
    Generates TTS audio using local GPT-SoVITS with dynamic emotion switching.
    """
    init_gsv()
    if not _initialized:
        return None

    # Default emotion
    emotion = "NORMAL"
    clean_text = text
    
    # Extract emotion tag like [HAPPY]
    tag_match = re.search(r'\[([A-Z]+)\]', text)
    if tag_match:
        found_tag = tag_match.group(1)
        if found_tag in EMOTION_MAP:
            emotion = found_tag
            # Remove tag from the text to be spoken
            clean_text = text.replace(f"[{found_tag}]", "").strip()

    ref_config = EMOTION_MAP.get(emotion, EMOTION_MAP["NORMAL"])
    ref_wav_path = os.path.join(REF_AUDIO_DIR, ref_config["wav"])
    ref_text = ref_config["text"]

    filename = f"{uuid.uuid4()}.wav"
    filepath = os.path.join(AUDIO_DIR, filename)

    try:
        # Import inside to ensure init_gsv has run
        import GPT_SoVITS.inference_webui as gsv_webui
        
        # Helper to find the dynamic key (e.g., "中文" or "Chinese") from the internal code ("zh")
        def get_lang_key(internal_code):
            for k, v in gsv_webui.dict_language.items():
                if v == internal_code:
                    return k
            return list(gsv_webui.dict_language.keys())[0]

        # Lock to Chinese-English Mixed mode as decided in Option A
        target_internal = "zh"
        
        # We still use "all_ja" for the reference audio since the Miku ref is Japanese
        ref_lang_key = get_lang_key("all_ja") 
        target_lang_key = get_lang_key(target_internal)
        
        # Change dir for inference
        os.chdir(GSV_CORE_DIR)
        
        synthesis_result = gsv_webui.get_tts_wav(
            ref_wav_path=ref_wav_path,
            prompt_text=ref_text,
            prompt_language=ref_lang_key,
            text=clean_text,
            text_language=target_lang_key,
            top_p=1,
            temperature=1,
            how_to_cut="凑四句一切", 
        )
        
        result_list = list(synthesis_result)
        os.chdir(BACKEND_DIR)

        if result_list:
            sampling_rate, audio_data = result_list[-1]
            sf.write(filepath, audio_data, sampling_rate)
            return f"/static/audio/{filename}"
            
    except Exception as e:
        os.chdir(BACKEND_DIR)
        print(f"GPT-SoVITS inference failed: {e}")
        import traceback
        traceback.print_exc()
        return None
    
    return None
