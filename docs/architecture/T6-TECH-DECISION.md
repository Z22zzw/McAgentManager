# T6 前后端技术选型决策

> 状态：Frozen（2026-08-30 用户确认）  
> 适用范围：v0.1 P0 开发

## 1. 选型结论

| 层 | 决策 |
|---|---|
| 运行时 | Node.js + TypeScript |
| 后端 | Fastify |
| 前端 | React + TypeScript + Vite |
| API | REST JSON + OpenAPI 3.1 |
| Schema | JSON Schema 2020-12 |
| 数据库 | SQLite + WAL；当前 JSON 仓储保留作测试 fake |
| 前端数据请求 | TanStack Query |
| 实时任务 | P0 先 HTTP 轮询，后续评估 SSE |
| 测试 | Vitest + Cucumber.js |
| Agent 接入 | Tool Adapter → Application Service，不直连底层 Adapter |
| 部署 | Ubuntu 24.04 systemd 单机 |
| MCSManager | Adapter 隔离，首个认证版本 v10.18.3 |
| 视觉设计 | `frontend-design` skill；不沿用功能原型的中性视觉 |

## 2. 进程边界

```text
Web API / Worker
  → Application Service
    → TaskRepository / OperationGateway
      → MCSManager Adapter / Host Probes

React Web
  → REST /api/v1
```

初期 Web API 和 Worker 可以同一 Node 进程运行，但任务状态必须落盘；后续拆分进程不改变业务 API。

## 3. 认证与安全

- Web 使用 HttpOnly 会话 Cookie；不在 URL 暴露凭证。
- 所有写操作带 `taskId`、`operationId`、`actorId`、`idempotencyKey`。
- Agent 与 Web 共享 Application Service，不共享绕过业务规则的底层权限。
- MCSManager 长期凭证只存在服务端 transport/secret store。
- MC 实例使用低权限 `mc-runner`，控制面提权只经操作网关。

## 4. 实施顺序

1. 后端健康检查、实例列表、任务查询。
2. 前端服务器主页和任务状态区。
3. OpenAPI request/response 校验。
4. 持久化任务 Worker 与 Cucumber Step Definitions。
5. MCSManager v10.18.3 真实契约联调。
6. AI 管家、文件上传和部署流程。

## 5. 非选型承诺

- 不在 P0 引入 Next.js SSR。
- 不在 P0 依赖 WebSocket。
- 不把 MCSManager 原始响应直接暴露给前端。
- 不在正式实现中继续使用 JSON 文件替代事务型 SQLite。
- 不将功能原型颜色、字体和组件直接视为正式视觉规范。
