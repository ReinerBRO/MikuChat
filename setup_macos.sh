#!/bin/bash

echo "========================================"
echo "   MikuChat macOS 一键环境搭建"
echo "========================================"
echo ""

# 切换到脚本所在目录
cd "$(dirname "$0")"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 检查 Homebrew
echo "[1/5] 正在检查 Homebrew..."
if ! command -v brew &> /dev/null; then
    echo ""
    echo -e "${YELLOW}[提示] 未检测到 Homebrew，正在自动安装...${NC}"
    echo ""
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # 添加 Homebrew 到 PATH (Apple Silicon)
    if [[ -f "/opt/homebrew/bin/brew" ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
    fi
fi
echo -e "${GREEN}[√] Homebrew 已就绪${NC}"

# 2. 检查 Conda
echo ""
echo "[2/5] 正在检查 Conda 环境..."
CONDA_PATH=""

# 检查常见的 Conda 安装路径
if [[ -f "$HOME/miniconda3/bin/conda" ]]; then
    CONDA_PATH="$HOME/miniconda3"
elif [[ -f "$HOME/anaconda3/bin/conda" ]]; then
    CONDA_PATH="$HOME/anaconda3"
elif [[ -f "/opt/homebrew/Caskroom/miniconda/base/bin/conda" ]]; then
    CONDA_PATH="/opt/homebrew/Caskroom/miniconda/base"
elif [[ -f "/usr/local/Caskroom/miniconda/base/bin/conda" ]]; then
    CONDA_PATH="/usr/local/Caskroom/miniconda/base"
fi

if [[ -z "$CONDA_PATH" ]]; then
    echo ""
    echo -e "${YELLOW}[提示] 未检测到 Conda 环境，正在通过 Homebrew 安装 Miniconda...${NC}"
    echo ""
    brew install --cask miniconda
    
    # 重新检测
    if [[ -f "/opt/homebrew/Caskroom/miniconda/base/bin/conda" ]]; then
        CONDA_PATH="/opt/homebrew/Caskroom/miniconda/base"
    elif [[ -f "/usr/local/Caskroom/miniconda/base/bin/conda" ]]; then
        CONDA_PATH="/usr/local/Caskroom/miniconda/base"
    fi
    
    if [[ -z "$CONDA_PATH" ]]; then
        echo -e "${RED}[错误] Miniconda 安装失败。${NC}"
        exit 1
    fi
    
    # 初始化 conda
    "$CONDA_PATH/bin/conda" init zsh bash
fi

echo -e "${GREEN}[√] Conda 环境已就绪: $CONDA_PATH${NC}"

# 激活 conda
source "$CONDA_PATH/etc/profile.d/conda.sh"

# 3. 创建并配置 Python 环境
echo ""
echo "[3/5] 正在配置 Python 环境 (mikuchat)..."

# 检查环境是否已存在
if conda info --envs | grep -q "mikuchat"; then
    echo -e "${YELLOW}[提示] mikuchat 环境已存在，跳过创建步骤...${NC}"
else
    conda create -n mikuchat python=3.10 -y
fi

conda activate mikuchat

echo ""
echo "正在安装后端依赖 (这可能需要几分钟)..."
cd backend
pip install numpy==1.26.4
pip install psutil==7.1.3
pip install gradio==6.1.0
pip install x_transformers==2.11.24
pip install pytorch_lightning==2.6.0
pip install matplotlib==3.10.0
pip install peft==0.18.0
pip install wordsegment==1.3.1
pip install g2p_en==2.1.0
echo "正在下载 NLTK 数据包..."
python -c "import nltk; nltk.download('averaged_perceptron_tagger_eng')"
pip install -r requirements.txt

if [[ $? -ne 0 ]]; then
    echo -e "${RED}[错误] 后端依赖安装失败。${NC}"
    exit 1
fi
cd ..

# 4. 检查 Node.js
echo ""
echo "[4/5] 正在检查 Node.js 环境..."
if ! command -v node &> /dev/null; then
    echo ""
    echo -e "${YELLOW}[提示] 未检测到 Node.js，正在通过 Homebrew 安装...${NC}"
    echo ""
    brew install node
fi
echo -e "${GREEN}[√] Node.js 环境已就绪: $(node -v)${NC}"

# 5. 安装前端依赖并构建
echo ""
echo "[5/5] 正在安装前端依赖并构建..."
cd frontend
npm install

if [[ $? -ne 0 ]]; then
    echo -e "${RED}[错误] 前端依赖安装失败。${NC}"
    exit 1
fi

echo "正在构建前端静态资源..."
npx vite build

if [[ $? -ne 0 ]]; then
    echo -e "${YELLOW}[警告] 前端构建遇到错误，但可能已生成部分资源。${NC}"
fi
cd ..

echo ""
echo "========================================"
echo -e "   ${GREEN}✨ 环境搭建完成！ ✨${NC}"
echo "========================================"
echo ""
echo "现在你可以："
echo "1. 运行 ./start.sh 启动服务 (浏览器模式)"
echo "2. 双击 MikuChat.command 启动桌面模式"
echo ""
echo "提示：首次运行需要下载模型权重文件，"
echo "请参考 README.md 中的百度网盘链接。"
echo ""
