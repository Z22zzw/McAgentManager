# T6 前后端开发启动报告

> 状态：骨架完成  
> 日期：2026-08-30

## 已冻结选型

- Node.js + TypeScript
- Fastify 后端
- React + TypeScript + Vite 前端
- REST JSON + OpenAPI 3.1
- JSON Schema 2020-12
- SQLite + WAL 为正式持久化目标；当前 JSON 仓储继续作为测试实现
- HTTP 轮询优先，SSE 后续加入
- Vitest + Cucumber.js

详细决策见 [`T6-TECH-DECISION.md`](T6-TECH-DECISION.md)。

## 已建立骨架

### Backend

- `src/server.ts`
- Fastify 健康检查
- `/api/v1/instances`
- `/api/v1/instances/:instanceId`
- `/api/v1/instances/:instanceId/actions`
- `/api/v1/tasks/:taskId`
- CORS 与 JSON 请求处理

### Frontend

- `web/index.html`
- `web/vite.config.ts`
- `web/tsconfig.json`
- `web/src/main.tsx`
- `web/src/styles.css`

前端首屏已形成：服务器总览、实例卡片、状态、在线人数、登录方式、启动/停止/重启入口、AI 管家入口和操作记录入口。当前页面使用产品化视觉草案，不等同于最终品牌设计。

## 验证结果

```text
npm run typecheck   passed（后端 + 前端）
npm test            7 files / 61 tests passed
npm run build:web   passed
npm run bdd:validate passed
API smoke test      /healthz 与 /api/v1/instances passed
```

## 当前诚实边界

- API 当前使用演示数据，尚未接入 TaskRepository、McsmAdapter 和真实认证。
- 实例控制接口当前创建任务引用，尚未启动真实 Worker。
- 前端使用 REST 直连骨架，尚未接入 TanStack Query、登录、真实任务轮询和 DSH。
- OpenAPI 是接口输入契约，Handler schema 校验和生成式 contract test 待下一步。
- 当前未修改 DSH Web，也未替换现有 `http://127.0.0.1:3080`。

下一步进入 T7/T8：将 Fastify Handler 接入 Application Service 和 SQLite 仓储；前端接入 Query、任务轮询、登录和真实业务状态，再开始 Agent Tool Adapter。