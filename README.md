# MikuChat 🎵

![MikuChat](./mikuchat.png)

一个美观、功能丰富的聊天应用，由 Qwen VL 驱动，以初音未来作为你的 AI 伴侣。采用现代 Web 技术构建，拥有令人惊艳的 ACG 风格界面。

## ✨ 功能特性

### 🎨 精美界面
- **初音主题设计**：浅蓝绿配色方案，玻璃态效果
- **多种主题**：在 Light、Dark 和 Cyber 主题之间切换
- **可自定义**：调整背景透明度和模糊效果
- **响应式**：由 Framer Motion 驱动的流畅动画和过渡

### 💬 多会话聊天
- **独立对话**：创建和管理多个聊天会话
- **自动命名**：LLM 根据首条消息自动为会话命名
- **会话切换**：轻松在不同对话之间切换
- **持久化历史**：所有会话自动保存和恢复

### 🤖 AI 驱动
- **Qwen VL 集成**：由阿里巴巴的 Qwen 视觉-语言模型驱动
- **对话记忆**：记住最近 3 轮对话
- **图片支持**：上传图片并与 Miku 讨论
- **智能回复**：根据上下文用你的语言回复

### 🎯 用户体验
- **实时聊天**：即时响应，带有打字指示器
- **错误处理**：出错时显示友好的错误消息
- **设置持久化**：主题和偏好设置跨会话保存
- **键盘快捷键**：按 Enter 发送，Shift+Enter 换行

## 🚀 快速开始

### 前置要求
- Python 3.8+ 和 conda
- Node.js 16+
- DashScope API 密钥（用于 Qwen VL）

### 后端设置

1. 创建并激活 conda 环境：
```bash
conda create -n mikuchat python=3.10
conda activate mikuchat
```

2. 安装依赖：
```bash
cd backend
pip install -r requirements.txt
```

3. 创建 `.env` 文件并配置 API 密钥：
```bash
# backend/.env
DASHSCOPE_API_KEY=your-api-key-here
```

4. 启动后端服务器：
```bash
python -m uvicorn main:app --reload --port 8000
```

### 前端设置

1. 安装依赖：
```bash
cd frontend
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 打开浏览器访问 `http://localhost:5173`

## 🎨 主题

MikuChat 提供三种精美主题：

- **Light**（默认）：明亮欢快的 Miku 蓝绿主题
- **Dark**：优雅的深色模式，带有青色点缀
- **Cyber**：霓虹洋红和青色的赛博朋克美学

点击侧边栏的设置图标即可访问主题设置。

## 🛠️ 技术栈

### 后端
- **FastAPI**：现代 Python Web 框架
- **Qwen VL**：通过 DashScope 的视觉-语言 AI 模型
- **Pydantic**：数据验证
- **Python Multipart**：文件上传处理

### 前端
- **React 18**：UI 框架
- **TypeScript**：类型安全开发
- **Vite**：超快的构建工具
- **Tailwind CSS**：实用优先的样式
- **Framer Motion**：流畅动画
- **Lucide React**：精美图标

## 📁 项目结构

```
MikuChat/
├── backend/
│   ├── main.py              # FastAPI 应用
│   ├── llm_service.py       # Qwen VL 集成
│   ├── chat_manager.py      # 会话管理
│   ├── requirements.txt     # Python 依赖
│   ├── .env                 # API 密钥配置
│   └── sessions.json        # 会话存储
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── ChatSessionList.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── DashboardLayout.tsx
│   │   ├── App.tsx
│   │   └── index.css
│   ├── public/
│   │   └── miku_avatar.png
│   └── package.json
└── README.md
```

## 🎵 关于 Miku

初音未来（初音ミク）是一位虚拟歌手，也是世界上最著名的 Vocaloid。在 MikuChat 中，她是你开朗、充满活力的 AI 伴侣，热爱音乐，随时准备帮助你！

## 📝 许可证

本项目仅供教育和个人使用。

## 🙏 致谢

- **阿里云**：提供出色的 Qwen VL 模型
- **Crypton Future Media**：创造了初音未来
- **开源社区**：提供了本项目使用的所有优秀库

---

用 💙 制作，献给 Miku 粉丝
