# Contributor
<table>
  <tr>
    <td align="center">
      <a href="https://github.com/ReinerBRO">
        <img src="https://github.com/ReinerBRO.png" width="80px;" /><br />
        <sub><b>ReinerBRO</b></sub>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/JWLLQ">
        <img src="https://github.com/JWLLQ.png" width="80px;" /><br />
        <sub><b>JWLLQ</b></sub>
      </a>
    </td>
  </tr>
</table>


# MikuChat 🎵

![MikuChat Main](./docs/images/showcase_chat_main.png)
> *与 Miku 在赛博空间中共度美好时光，支持多场景切换与情感互动。*

一个美观、功能丰富的聊天应用，由 Qwen VL 驱动，以初音未来作为你的 AI 伴侣。采用现代 Web 技术构建，拥有令人惊艳的 ACG 风格界面，并集成了本地 **GPT-SoVITS** 语音合成系统。

## ✨ 核心特性

### 🎨 沉浸式 ACG 体验
- **多场景切换系统**：内置 "温馨卧室"、"赛博舞台" 和 "和风茶室" 等多种高画质背景，支持随心切换。
- **Live2D 深度集成**：支持 Live2D 模型，Miku 可以在 3D 空间中与你互动，支持实时缩放比例调整。
- **动态情感反馈**：聊天气泡会自动隐藏情感标签（如 `[HAPPY]`），但 Miku 的表情和动作会根据情感实时变化，仿佛拥有灵魂。
- **8-Bit 粒子特效**：背景融合了复古与未来的 8-Bit 粒子系统，随音乐和输入律动。

### 🛍️ 葱葱商店与货币系统
- **经济系统**：通过聊天、摸头互动赚取 "葱葱币" (NegiCoin)。
- **虚拟商城**：使用葱葱币购买新的 **背景房间**（如赛博公寓、日式庭院）或 **限定服装**。
- **好感度机制**：随着互动加深，解锁更多 "初音的秘密日记" 和隐藏语音。

### 🔊 本地 GPT-SoVITS 语音合成
- **真实 Miku 音色**：集成本地 GPT-SoVITS 引擎，生成纯正、高质量的初音未来中文语音。
- **情感驱动语音**：AI 自动分析对话情感，实时切换开心、惊讶、温柔等多种语调。

### 📰 生活化功能
- **Miku News**：实时抓取 Piapro 官方动态，不错过任何 Miku 周边和演唱会信息。
- **秘密日记**：记录你们的点滴回忆，随着好感度提升，Miku 会写下关于你的私密日记。
- **Qwen VL 视觉**：支持发送图片，Miku 能看懂你分享的照片并进行互动。

## 📸 精彩预览

| 👗 葱葱商店 (Shop) | 📰 Miku News (资讯) | 📔 秘密日记 (Diary) |
| :---: | :---: | :---: |
| ![Shop](./docs/images/showcase_shop.png) | ![News](./docs/images/showcase_news_feed.png) | ![Diary](./docs/images/showcase_secret_diary.png) |
| *购买新背景和服装* | *获取最新 Miku 资讯* | *解锁你们的专属回忆* |

## 🚀 快速开始

### 前置要求
- Python 3.10+ (推荐使用 Conda 建立 `mikuchat` 环境)
- Node.js 16+
- DashScope API 密钥（用于 Qwen VL）
- 显存/内存要求：建议至少 16GB RAM (Mac M 系列表现优异)

### 首次设置

1. **配置后端环境**
   ```bash
   cd backend
   conda create -n mikuchat python=3.10
   conda activate mikuchat
   pip install -r requirements.txt
   ```

2. **配置 API 密钥**
   在 `backend` 目录下创建 `.env` 文件：
   ```env
   DASHSCOPE_API_KEY=your-api-key-here
   ```

3. **模型下载**
   项目需要 GPT-SoVITS 底模和 Miku 权重文件，请确保将其放置在 `backend/models/gpt_sovits/miku/weights/`。

### 🖥️ Windows 部署指南

1. **环境准备**
   - 安装 [Miniconda](https://docs.conda.io/en/latest/miniconda.html) 或 Anaconda。
   - 安装 [Node.js](https://nodejs.org/) (推荐 LTS 版本)。
   - 安装 [Git](https://git-scm.com/download/win)。

2. **克隆与安装**
   打开 CMD 或 PowerShell：
   ```bash
   git clone https://github.com/ReinerBRO/MikuChat.git
   cd MikuChat/backend
   conda create -n mikuchat python=3.10
   conda activate mikuchat
   pip install -r requirements.txt
   ```

3. **下载模型**
   
   **方式 A：自动下载基础模型**
   使用内置脚本下载 GPT-SoVITS 基础通用模型：
   ```bash
   python download_base_models_v2.py
   ```

   **方式 B：下载 Miku 专属权重 (必需)**
   由于模型文件较大，请从网盘下载 Miku 的微调权重文件：
   
   > 🔗 **百度网盘下载**: [链接占位符] (提取码: xxxx)
   
   下载后请解压并覆盖到项目目录：
   - 将 `weights` 文件夹内的文件放入 `backend/models/gpt_sovits/miku/weights/` 目录下。
   - (参考音频 `reference` 已包含在项目中，无需下载)

4. **启动应用**
   回到根目录，双击 `start.bat` 即可一键启动前后端。同时会自动尝试激活 `mikuchat` conda 环境。

### 启动应用

只需运行根目录下的启动脚本：

- **Windows**: 双击运行 `start.bat`
- **Linux/Mac**: 运行 `./start.sh`

## 🛠️ 技术栈

### 后端
- **FastAPI**: 高性能异步 Python Web 框架
- **GPT-SoVITS**: 强大的本地语音克隆与合成系统
- **Qwen VL**: 领先的视觉语言大模型
- **SQLAlchemy/File storage**: 灵活的会话管理

### 前端
- **React 18** / **Vite** / **Tailwind CSS**
- **Framer Motion**: 动画引擎
- **PixiJS & Live2D SDK**: 虚拟伴侣渲染引擎

## 📁 项目结构

```
MikuChat/
├── backend/                 # 后端逻辑 (API, TTS, LLM)
├── frontend/                # 前端 React 项目
├── docs/                    # 项目文档与截图
├── start.sh                 # Mac/Linux 一键启动
└── README.md                # 项目文档
```

## 📝 许可证

本项目仅供学习交流使用，请勿用于商业用途。

---

用 💙 制作，献给 Miku 粉丝
