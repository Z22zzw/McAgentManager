# TDD T5 接口契约与文档治理报告

> 状态：完成  
> 日期：2026-08-30

## 接口文档

- `docs/api/openapi.yaml`：16 个 Web API 路径，覆盖认证、实例、部署、任务、磁盘、审计和高级入口。
- `docs/api/schemas/task.schema.json`：任务、状态、步骤和进度。
- `docs/api/schemas/confirmation.schema.json`：资源、操作、操作者、清单哈希、文案版本和有效期绑定。
- `docs/api/schemas/audit-event.schema.json`：请求、确认、执行、验证、阻断和外部变更事件。
- `docs/api/schemas/server-classification.schema.json`：上传内容分类、核心、版本、Java、入口和证据。
- `docs/api/errors.md`：统一错误码、可重试性和恢复核对语义。
- `docs/api/agent-tools.md`：Agent 工具边界、风险、副作用和删除确认要求。
- `docs/api/mcsm-v10.18.3.md`：MCSManager v10.18.3 源码核对的路由和字段映射。

## 文档归档

```text
docs/
├── README.md                 文档中心和职能入口
├── prd/                      产品经理
├── bdd/                      测试工程师
├── tdd/                      领域/TDD 工程师
├── api/                      架构师、后端、Agent 工程师
├── architecture/             架构师、部署运维
└── prototype/                 前端功能区域参考
```

原有根目录文档已迁移，项目根目录不再保留产品 Markdown 副本。可执行 Gherkin 仍在 `specs/bdd/features/`，领域和适配代码仍在 `src/`。

## 验证结果

```text
TypeScript typecheck       passed
Vitest                     6 files / 59 tests passed
BDD validator              11 files / 98 scenarios / 0 errors
Cucumber parser            146 scenarios / 0 syntax errors
JSON Schema JSON parse     4 schemas valid
OpenAPI YAML parse         16 paths loaded
```

## 契约状态

T5 已完成内部接口设计，但 MCSManager 真实 response envelope、认证 Cookie/API Key 形态和高级入口会话仍需测试环境确认。因此 `openapi.yaml` 和 MCSManager 适配说明是可实现的契约候选，T6 联调后再标记为 `Evidence Complete`。
