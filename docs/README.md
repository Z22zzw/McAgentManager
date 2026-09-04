# MC AI Manager 文档中心

> 文档版本：v0.1  
> 文档状态：T5 接口契约设计阶段

## 按职能进入

| 职能 | 首要入口 | 主要关注内容 |
|---|---|---|
| 产品经理 | [`prd/README.md`](prd/README.md) | 产品目标、范围、业务流程、验收和版本优先级 |
| 架构师/后端 | [`api/README.md`](api/README.md)、[`architecture/README.md`](architecture/README.md) | Web API、数据模型、MCSManager 适配、系统边界 |
| 测试工程师 | [`bdd/README.md`](bdd/README.md) | Gherkin、追踪矩阵、Golden Sample、BDD 运行方式 |
| TDD/领域工程师 | [`tdd/README.md`](tdd/README.md) | TDD 模块、不变量、测试层级和当前实现状态 |
| Agent 工程师 | [`api/agent-tools.md`](api/agent-tools.md)、[`api/schemas/`](api/schemas/) | 工具输入输出、风险、确认和任务状态 |
| 前端工程师 | [`api/openapi.yaml`](api/openapi.yaml)、[`prototype/README.md`](prototype/README.md) | Web API、任务事件、功能原型区域参考 |
| 部署/运维人员 | [`architecture/deployment-boundary.md`](architecture/deployment-boundary.md) | Ubuntu、权限、工作区、MCSManager、Java 和网络要求 |

## 按文档类型

- [`prd/`](prd/)：产品需求、业务流程、P0 边界、支持矩阵和样本目录。
- [`bdd/`](bdd/)：BDD 设计、场景追踪和冻结检查。
- [`tdd/`](tdd/)：TDD 设计、模块映射和阶段报告。
- [`api/`](api/)：OpenAPI、JSON Schema、错误码、Agent 工具和外部适配契约。
- [`architecture/`](architecture/)：系统边界、部署约束和组件职责。
- [`prototype/`](prototype/)：功能原型及其演示说明，不代表正式视觉设计。

## 版本规则

1. 产品边界、接口模型、BDD 和 TDD 映射必须一起变更。
2. 兼容性扩大前先增加支持矩阵和 Golden Sample。
3. 接口字段只新增不复用旧语义；破坏性变更升级 API major 或版本化 schema。
4. API 文档是外部契约，代码接口不能单独替代它。
5. 文档中的 `Draft`、`Candidate`、`Frozen`、`Evidence Pending` 状态必须如实标注。
