# 摘星搜题（StarSeeker）

摘星搜题是面向 A-Level 教师的试题识别与解析应用。当前代码库包含：
- 前端静态页面（上传图片，查看答案与解析，历史与收藏）
- Node/Express 服务（图片 OCR、题目解析、题库检索、解析生成，静态托管）
- Kotlin/Spring Boot 服务（版本化 REST API `/v1/api`，JWT 登录与 Swagger 文档）

## 快速开始

### 前端 + Node 服务
- 安装依赖：`npm install`
- 启动服务：`npm start`
- 访问页面：`http://localhost:3000/`
- 端到端文本测试（无需图片/OCR）：`npm test`

接口（Node）：
- `POST /api/solve`（支持 `multipart/form-data` 上传 `image`；或 `application/x-www-form-urlencoded` 传 `force_text`）
- `GET /api/history`
- `POST /api/favorite`
- `GET /api/favorites`

### Kotlin/Spring Boot 后端（前后端分离 API）
- 进入目录：`cd backend`
- 构建：`gradle build`
- 启动：`java -jar build/libs/starseeker-backend-0.1.0.jar`
- Swagger 文档：`http://localhost:8080/swagger-ui.html`

鉴权流程（Spring）：
- 登录获取令牌：
  - `curl -X POST 'http://localhost:8080/v1/api/auth/login' -d 'username=teacher&password=starseeker'`
- 识别与解析（文本模式）：
  - `curl -X POST 'http://localhost:8080/v1/api/solve' -H 'Authorization: Bearer <token>' -H 'Content-Type: application/x-www-form-urlencoded' -d 'board=CIE&force_text=Which graph shows the displacement-time relationship for constant non-zero velocity? A. A straight line with positive gradient B. A horizontal line C. A curve with increasing gradient D. A sine wave'`

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
- Spring Boot：`backend/`
  - 控制器：`api/`（`AuthController`、`QuestionController`）
  - 服务：`service/`（`QuestionService`、`AnalysisService`、`OcrService` 占位）
  - 仓库：`repo/QuestionRepository`
  - 安全：`security/`（`JwtService`、`JwtAuthFilter`）与 `config/SecurityConfig`
  - 异常：`exception/GlobalExceptionHandler`

## 开发与部署建议
- 前后端分离：生产环境建议使用 Spring Boot 提供 `/v1/api`，前端独立打包与部署（Nginx 静态 + 反向代理）
- OCR 与题库：
  - Spring OCR 当前为占位；可接入 tess4j 或云 OCR 服务
  - 题库索引建议迁移至 SQLite FTS5 / PostgreSQL + pgvector，统一到 Spring 数据源
- 安全：JWT 秘钥配置化与刷新策略；接口权限分级控制
- 监控与测试：补充 MockMvc 单测与集成测试；接入 Prometheus/Grafana 与 APM

## 许可证
本项目暂未声明许可证。如需开放使用，请补充 LICENSE 文件。
