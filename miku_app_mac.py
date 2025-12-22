import os
import sys
import subprocess
import threading
import time
import socket

# 获取当前脚本所在目录
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR) # 确保能找到 backend 包
sys.path.insert(0, os.path.join(BASE_DIR, "backend")) # 确保能找到 backend 内部的模块

import uvicorn
import webview
import requests
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from backend.main import app

DIST_DIR = os.path.join(BASE_DIR, "frontend", "dist")

def kill_port(port):
    """自动清理占用端口的进程 (Mac/Linux)"""
    try:
        pid = subprocess.check_output(["lsof", "-t", f"-i:{port}"]).decode().strip()
        if pid:
            print(f"检测到端口 {port} 被占用 (PID: {pid})，正在清理...")
            os.system(f"kill -9 {pid}")
            time.sleep(1)
    except:
        pass

def is_server_running(port):
    """检查服务器是否已就绪"""
    try:
        response = requests.get(f"http://127.0.0.1:{port}/api/user", timeout=1)
        return response.status_code == 200
    except:
        return False

# 移除现有的根路由 (如果有)
for route in app.routes:
    if getattr(route, "path", None) == "/" and "GET" in getattr(route, "methods", []):
        app.routes.remove(route)

# --- 动态挂载前端静态资源 ---
if os.path.exists(DIST_DIR):
    # 1. 挂载 dist 目录下的所有子目录
    for item in os.listdir(DIST_DIR):
        item_path = os.path.join(DIST_DIR, item)
        if os.path.isdir(item_path):
            # 虽然后端也有 /static，但前端 dist 里的优先级更高（包含新生成的资源）
            # 我们通过这种方式支持 /live2d, /backgrounds 等路径
            app.mount(f"/{item}", StaticFiles(directory=item_path), name=f"dist_{item}")
    
    # 2. 挂载 dist 根目录下的文件 (如 .js, .png, .svg)
    # 我们不能简单挂载 /，因为会冲突。对于根目录的文件，我们手动添加路由。
    for item in os.listdir(DIST_DIR):
        item_path = os.path.join(DIST_DIR, item)
        if os.path.isfile(item_path) and item != "index.html":
            def make_serve_file(file_path):
                async def serve_file():
                    return FileResponse(file_path)
                return serve_file
            
            app.get(f"/{item}")(make_serve_file(item_path))

# 根路径返回前端入口
@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(DIST_DIR, "index.html"))

# SPA 路由支持：如果没找到，且不是 API 请求，就返回 index.html
@app.exception_handler(404)
async def not_found_exception_handler(request, exc):
    if not request.url.path.startswith("/api"):
        return FileResponse(os.path.join(DIST_DIR, "index.html"))
    return exc

def start_backend():
    # 切换到 backend 目录确保权重路径正确
    os.chdir(os.path.join(BASE_DIR, "backend"))
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="error")

if __name__ == "__main__":
    if not os.path.exists(DIST_DIR):
        print(f"错误: 找不到前端打包文件目录 {DIST_DIR}")
        print("请运行: cd frontend && npm run build")
        sys.exit(1)

    kill_port(8000)

    print("🚀 正在初始化 MikuChat 后端 (包含模型加载)...")
    t = threading.Thread(target=start_backend, daemon=True)
    t.start()
    
    retries = 0
    max_retries = 60 # 增加等待时间，模型加载可能较慢
    while not is_server_running(8000) and retries < max_retries:
        if retries % 5 == 0 and retries > 0:
            print(f"  还在加载中... ({retries}s)")
        time.sleep(1)
        retries += 1

    if retries >= max_retries:
        print("❌ 服务器启动超时。")
        sys.exit(1)
    
    print("✅ 后端已就绪，正在打开 MikuChat App 界面...")
    window = webview.create_window(
        title='MikuChat',
        url='http://127.0.0.1:8000',
        width=1280,
        height=800,
        min_size=(1000, 700),
        background_color='#f0fdfa'
    )
    
    webview.start(debug=True)
