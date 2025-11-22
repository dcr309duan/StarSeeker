# 摘星搜题 · 系统架构说明（基于当前代码库）

- 生成日期：2025-11-22
- 代码根目录：`/Users/dcr/Documents/trae_projects/StarSeeker`
- 版本信息：当前工作副本（未检出为 Git 仓库，无提交哈希）

## 总览
- 前端：`static/` 目录，使用原生 JS 页面（选择图片、调用后端、展示解析与历史/收藏）。
- Node/Express 服务：`server.js`，端口 `3000`，提供图片识别/解析入口、历史与收藏、静态托管；在解析阶段优先委派到 Python 后端。
- Python/FastAPI 服务：`py_backend/`，端口 `8000`，提供 `/api/solve` 与 `/health`，采用分层（路由/服务/数据），预留 LangChain 集成。
 - 题库与索引：Node 使用 `lunr` 内存索引；Python 侧为内存示例题，后续可迁移至 FTS/向量检索。

![架构图](./architecture.svg)

## 运行时组件与职责
- 前端（静态页面）
  - 文件：`static/index.html`、`static/app.js`、`static/style.css`
  - 交互：选择图片并 `POST /api/solve`；展示返回的答案与解析；管理历史与收藏。
  - 代码参考：`static/app.js:1` 调用识别接口；错误处理与提示。
 - Node/Express
  - 入口：`server.js:131-133` 启动服务与端口日志；静态托管 `server.js:119`。
  - 识别主流程：`server.js:24-99`（上传→OCR→解析→检索→委派 Python → 回退本地生成→写入历史→返回响应）。
  - 历史与收藏：`server.js:74-87`。
  - 错误处理：`server.js:91-97`（上传错误与统一 500）。
  - OCR：`src/ocr/ocr.js:5-9` 使用 `tesseract.js`。
  - 题目解析：`src/ocr/parser.js:3-26` 解析 A/B/C/D 选项与主题粗分类。
  - 题库与索引：`src/db/index.js:10-13` 初始化；`src/db/index.js:44-51` 构建 `lunr` 索引；`src/db/index.js:53-68` 检索逻辑；`src/db/index.js:70-83` 历史与收藏。
  - 解析生成：`src/analysis/analysis.js:18-42` 基于知识图谱与规则生成解析与建议答案。
  - Python 集成调用：`server.js:49-63` 使用 `PY_API_URL` 调用 `POST /api/solve`（`application/x-www-form-urlencoded`）。
 - Python/FastAPI
  - 入口：`py_backend/app/main.py`（`/health` 健康检查，Prometheus 指标）。
  - 路由：`py_backend/app/routers/api.py`（`POST /api/solve` 支持 `board/force_text`）。
  - 服务：`py_backend/app/services/analysis_service.py`（类型提示与规则化解析，LangChain 接入预留）。
  - 数据：`py_backend/app/data/repository.py`（内存题库示例）。
  - 测试：`py_backend/tests/test_api.py`（健康与解析端到端测试，覆盖率阈值≥90%）。



## 模块调用与依赖关系
- Node/Express
  - `server.js` 依赖 `src/db/index.js`（题库/索引/历史收藏）、`src/ocr/ocr.js`（OCR）、`src/ocr/parser.js`（题目解析）、`src/analysis/analysis.js`（解析生成）。
  - `src/db/index.js` 依赖 `lunr`；维护内存数组（`QUESTIONS/HISTORY/FAVORITES`）。
  - `src/ocr/ocr.js` 依赖 `tesseract.js`。
 - Python/FastAPI
  - `api.py` 依赖 `AnalysisService` 与 `QuestionRepository`。
  - `AnalysisService` 依赖 `QuestionRepository`。

## 数据流与通信协议
- 前端 → Node
  - `POST /api/solve`：`multipart/form-data`（字段：`image`、可选 `board`）或 `application/x-www-form-urlencoded`（字段：`force_text/board`）。
  - 响应 JSON 字段：`board/question/choices/matched/answer/explanation/knowledge_points/duration_ms`（`server.js:50-59`）。
  - `GET /api/history`、`POST /api/favorite`、`GET /api/favorites`。

 - Node → Python
   - `POST {PY_API_URL}/api/solve`：`application/x-www-form-urlencoded`，字段：`board/force_text`；优先使用 Python 的解析结果（`server.js:49-63`）。

## 核心类的类图（文字版说明）
 - 路由层（Python）：`api.py` → 服务层 `AnalysisService` → 数据层 `QuestionRepository`
 - 服务层（Python）：`AnalysisService`（规则与知识点）
 - 数据层（Python）：`QuestionRepository`（内存数据，匹配逻辑）

> 可视类图建议参考 `docs/architecture.drawio`（UML 组件/类图）。

## 关键代码片段引用
- Node 识别主流程：`/Users/dcr/Documents/trae_projects/StarSeeker/server.js:22-72`
- Node 检索：`/Users/dcr/Documents/trae_projects/StarSeeker/src/db/index.js:53-68`
- Node 解析生成：`/Users/dcr/Documents/trae_projects/StarSeeker/src/analysis/analysis.js:18-42`
 - Python 路由：`/Users/dcr/Documents/trae_projects/StarSeeker/py_backend/app/routers/api.py`
 - Python 服务：`/Users/dcr/Documents/trae_projects/StarSeeker/py_backend/app/services/analysis_service.py`
 - Python 数据：`/Users/dcr/Documents/trae_projects/StarSeeker/py_backend/app/data/repository.py`

## 包/命名空间说明
- Node：以功能模块划分 `src/db`、`src/ocr`、`src/analysis`，入口 `server.js`。
 - Python：`py_backend/app` 下分层：`routers`（路由）、`services`（服务）、`data`（数据）。

## 异常处理与日志
- Node：`MulterError` 文件大小与上传错误（`server.js:91-97`）；其他错误返回 `{ error, detail }`。日志：启动信息 `console.log`。
 - Python：中间件记录错误并返回统一 JSON；使用 `structlog` 输出结构化日志，Prometheus 采集指标（`main.py`）。

## 已知架构缺陷与改进建议
 - Spring Kotlin 后端已移除，当前以 Node + Python 为主；建议逐步将 OCR 前移到前端或统一到 Python 服务。
 - 存储与索引：Node `lunr` 与内存数组不具备生产可扩展性；建议迁移至 SQLite FTS5/PG+pgvector/向量数据库，并统一至 Python 服务。
 - LangChain 集成：补齐 Agent/Tools/Memory 组件，形成可扩展 AI 能力层。
 - 安全：建议为 Python 服务接入认证与权限控制；统一请求ID贯穿日志链路。
 - 可观测性：完善 Prometheus 指标、OpenTelemetry 分布式追踪与告警。

---
本文件完全依据当前代码库静态分析结果编写，架构图元素与组件一一对应源代码实现。
