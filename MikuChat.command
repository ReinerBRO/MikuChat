#!/bin/bash
# 自动切换到项目根目录
cd "$(dirname "$0")"

echo "正在启动 MikuChat..."

# 搜索并激活 conda 环境
# 这里尝试常见的 conda 路径，确保在双击时能加载环境
source ~/miniconda3/bin/activate mikuchat || \
source ~/anaconda3/bin/activate mikuchat || \
source /usr/local/anaconda3/bin/activate mikuchat || \
conda activate mikuchat

# 运行 App 封装脚本
python miku_app_mac.py
