# OnlineOCR

一个基于 Python 的轻量级在线 OCR 平台，使用 Flask 提供 API 与界面，并基于 EasyOCR 引擎进行文本识别。前后端均由 Python 提供服务，
前端页面采用现代化设计，支持拖拽上传和即时预览。

## 功能特性

- 🎯 拖拽或选择图片即可完成上传
- 🧠 集成 EasyOCR，支持多行文字识别，并返回识别置信度
- ⚡ 即时展示识别结果与平均置信度
- 🖥️ 响应式现代界面设计

## 本地运行

1. 创建并激活虚拟环境（可选）：

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows 使用 .venv\Scripts\activate
   ```

2. 安装依赖：

   ```bash
   pip install -r requirements.txt
   ```

3. 启动应用：

   ```bash
   flask --app app run

   macos使用：python -m flask --app app run
   ```

4. 打开浏览器访问 [http://localhost:5000](http://localhost:5000)。

上传图片后即可查看识别出的文本与平均置信度。

## 开放到公网访问

如果希望将服务临时暴露到公网，最简单的方式是使用内网穿透工具（例如 [ngrok](https://ngrok.com/) 或 [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/))，它们会为本地运行的服务创建一个安全的公网 URL。

以下示例演示如何通过 ngrok 公开本地 5000 端口：

```bash
# 1. 下载并安装 ngrok（参考 https://ngrok.com/download）
# 2. 启动本地 Flask 服务
flask --app app run --host 0.0.0.0 --port 5000

# 3. 另开终端，启动 ngrok
ngrok http 5000
```

终端会输出一个形如 `https://xxxx.ngrok.io` 的公网地址，分享该地址即可让他人访问。若在云服务器上部署，可以直接将 Flask 监听到 `0.0.0.0`，并在安全组或防火墙中开放对应端口（默认 5000）即可。

## Docker 打包与部署

项目已包含 `requirements.txt`，可使用 Docker 快速构建镜像并部署：

1. 在项目根目录创建并保存以下 `Dockerfile`（如果尚未存在）：

   ```dockerfile
   FROM python:3.10-slim

   WORKDIR /app

   # 安装系统依赖（EasyOCR 依赖）
   RUN apt-get update && apt-get install -y \
       libglib2.0-0 \
       libsm6 \
       libxrender1 \
       libxext6 \
       && rm -rf /var/lib/apt/lists/*

   COPY requirements.txt ./
   RUN pip install --no-cache-dir -r requirements.txt

   COPY . .

   ENV FLASK_APP=app.py
   ENV FLASK_RUN_HOST=0.0.0.0
   ENV FLASK_RUN_PORT=5000

   CMD ["flask", "run"]
   ```

2. 构建镜像：

   ```bash
   docker build -t online-ocr:latest .
   ```

3. 运行容器并映射端口：

   ```bash
   docker run -p 5000:5000 --name online-ocr online-ocr:latest
   ```

之后即可通过宿主机的 `http://localhost:5000`（或公网 IP + 端口）访问应用。若要在服务器上常驻运行，可结合 `docker-compose` 或容器编排工具进行管理。
