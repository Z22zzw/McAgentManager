# 接口文档

## 契约目录

- [`openapi.yaml`](openapi.yaml)：MC AI Manager Web 业务 API。
- [`errors.md`](errors.md)：统一错误码、重试和恢复语义。
- [`agent-tools.md`](agent-tools.md)：Agent 工具调用契约。
- [`mcsm-v10.18.3.md`](mcsm-v10.18.3.md)：MCSManager 外部适配契约。
- [`schemas/task.schema.json`](schemas/task.schema.json)：任务和步骤模型。
- [`schemas/confirmation.schema.json`](schemas/confirmation.schema.json)：业务确认模型。
- [`schemas/audit-event.schema.json`](schemas/audit-event.schema.json)：审计事件模型。
- [`schemas/server-classification.schema.json`](schemas/server-classification.schema.json)：上传包识别模型。

## 分层

```text
Web / Client
    ↓ OpenAPI
MC AI Manager 业务服务
    ↓ domain adapter
MCSManager / Host / 文件 / 进程 / 端口 / Java
```

Agent 使用经过风险约束的工具契约，不直接拼接 URL、文件路径或任意 Shell 命令。所有有副作用的请求必须关联 `taskId`、`operationId`、`actorId` 和 `idempotencyKey`。

## 状态原则

- 任务状态由任务服务负责。
- 实例生命周期由 MCSManager 事实负责。
- 进程、端口、文件和 Java 状态由 Probe 事实负责。
- 对话内容只作为用户交互记录，不作为执行状态事实。
