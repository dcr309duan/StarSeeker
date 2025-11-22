# 摘星搜题（StarSeeker）

摘星搜题是面向 A-Level 教师的试题识别与解析应用。当前代码库包含：
- 前端静态页面（上传图片，查看答案与解析，历史与收藏）
- Node/Express 服务（图片 OCR、题目解析、题库检索、解析生成，静态托管；解析阶段优先委派到 Python 后端）
- Python/FastAPI 服务（REST API `/api/solve` 与 `/health`，LangChain 接入预留）

## 快速开始

### 前端 + Python 服务
- 启动 Python 后端后，直接访问 `http://localhost:8000/` 即可打开前端页面（由 FastAPI 静态托管）

接口（Node）：
- `POST /api/solve`（支持 `multipart/form-data` 上传 `image`；或 `application/x-www-form-urlencoded` 传 `force_text`）
- `GET /api/history`
- `POST /api/favorite`
- `GET /api/favorites`

### Python/FastAPI 后端（前后端分离 API）
- 进入目录：`cd py_backend`
- 安装依赖：`poetry install`
- 启动：`poetry run uvicorn app.main:app --host 0.0.0.0 --port 8000`
- 健康检查：`http://localhost:8000/health`

与后端交互（文本模式示例）：
- `curl -X POST 'http://localhost:8000/api/solve' -H 'Content-Type: application/x-www-form-urlencoded' -d 'board=CIE&force_text=Which graph shows the displacement-time relationship for constant non-zero velocity? A. A straight line with positive gradient B. A horizontal line C. A curve with increasing gradient D. A sine wave'`

## 架构概览
- 架构文档：`docs/architecture.md`
- 架构图（可编辑）：`docs/architecture.drawio`
- 架构图（SVG）：`docs/architecture.svg`

主要模块：
- 前端：`static/index.html`、`static/app.js`、`static/style.css`
- Node 服务入口：`server.js`
  - OCR：`src/ocr/ocr.js`（tesseract.js）
  - 解析：`src/ocr/parser.js`
  - 题库与索引：`src/db/index.js`（内存 + lunr）
  - 解析生成：`src/analysis/analysis.js`
- Python FastAPI：`py_backend/`
  - 路由：`app/routers/api.py`
  - 服务：`app/services/analysis_service.py`
  - 数据：`app/data/repository.py`
  - 应用：`app/main.py`

## 开发与部署建议
- 前后端分离：生产环境建议使用 Spring Boot 提供 `/v1/api`，前端独立打包与部署（Nginx 静态 + 反向代理）
- OCR 与题库：
  - Spring OCR 当前为占位；可接入 tess4j 或云 OCR 服务
  - 题库索引建议迁移至 SQLite FTS5 / PostgreSQL + pgvector，统一到 Spring 数据源
- 安全：JWT 秘钥配置化与刷新策略；接口权限分级控制
- 监控与测试：补充 MockMvc 单测与集成测试；接入 Prometheus/Grafana 与 APM

## 许可证
本项目暂未声明许可证。如需开放使用，请补充 LICENSE 文件。
