# OnlineOCR

一个基于 Python 的轻量级在线 OCR 平台，使用 Flask 提供 API 与界面，并基于 EasyOCR 引擎进行文本识别。前后端均由 Python 提供服务，前端页面采用现代化设计，支持拖拽上传和即时预览。

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
   ```

4. 打开浏览器访问 [http://localhost:5000](http://localhost:5000)。

上传图片后即可查看识别出的文本与平均置信度。
