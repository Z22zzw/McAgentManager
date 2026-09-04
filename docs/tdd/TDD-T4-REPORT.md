# TDD T4 可恢复部署任务报告

> 状态：完成  
> 日期：2026-08-30  
> 范围：首个部署任务编排器；使用 TaskRepository、McsmAdapter、ReadinessVerifier 和 AuditService

## 已实现

- `DeployTaskExecutor`：创建并持久化部署任务。
- 阶段状态：`Created → Inspecting → Queued → Executing → Verifying → Succeeded/Partial`。
- 创建实例、启动实例和独立就绪验证串联。
- 每个阶段写入任务或步骤记录。
- 通过 MCSManager、进程、服务就绪和端口事实决定成功。
- 外部调用响应丢失或副作用未知时进入 `RecoveryRequired`。
- 审计记录包含任务请求和验证结果。
- 任务结果可从持久化仓储读取，而不依赖对话过程。

## 已验证场景

- 正常创建、启动并通过就绪验证。
- 实例创建成功但服务未就绪，任务为 `Partial`。
- 启动动作产生副作用但响应丢失，任务为 `RecoveryRequired`，不重复请求。
- 创建响应格式异常，任务不会报告成功。
- 任务和步骤在仓储中可回查。

## 验证结果

```text
npm run typecheck     passed
npm test              6 files / 59 tests passed
npm run bdd:validate  11 files / 98 scenarios / 0 errors
```

## 当前限制

- 目前是单进程编排器；TaskRepository 已持久化，但尚未实现跨多个执行器进程的文件锁/事务。
- `McsmHttpAdapter` 的真实认证和 response envelope 仍需隔离 MCSManager v10.18.3 contract suite 验证。
- 当前部署执行器假定上传识别、EULA 和 Java 预检已经完成；尚未将这些步骤接入一个完整任务。
- Cucumber Step Definitions 尚未实现。
- 没有在本阶段启动真实 MC 服务端或执行真实删除/APT。

下一阶段建议：T5 先创建 Cucumber World/Step Definitions 的最小实现，并以 FakeMcsmAdapter 跑通 `BDD-DEPLOY-001`；同时为真实 v10.18.3 环境准备 contract suite。