# TDD T2 持久化与外部适配边界报告

> 状态：完成  
> 日期：2026-08-29  
> 范围：本地持久化、外部适配契约和事实 Probe 接口；未连接真实生产系统

## 已实现

- `TaskRepository`：本地 JSON 任务/步骤仓储，首次创建、重新打开、schema 校验和原子临时文件替换。
- `McsmAdapter`：MCSManager 实例列表、详情、创建、启停、日志和删除的接口契约。
- `FakeMcsmAdapter`：用于 TDD 和后续 Cucumber L1 的可观察契约 fake，记录调用顺序。
- `fact-probes`：文件、进程、端口和 Java 事实 Probe 接口及统一事实类型。

## 可靠性规则

- 不认识的任务仓储 schema 会阻断打开，不静默丢弃数据。
- 任务列表和步骤列表返回副本，调用方不能直接修改内部状态。
- 写入先进入任务专属临时文件，再原子替换目标文件。
- MCSManager 外部数据通过运行时断言校验实例 ID、名称、目录和状态。
- Fake adapter 可验证创建、启动、停止的调用顺序和幂等上下文。

## 验证结果

```text
npm run typecheck     passed
npm test              4 files / 50 tests passed
npm run bdd:validate  11 files / 98 scenarios / 0 errors
npm run bdd:parse     146 scenarios parsed; 0 syntax errors
```

Cucumber 仍显示 undefined steps，因为真实 Step Definitions 尚未实现；这不影响 Gherkin 解析结果。

## 当前边界

本阶段没有：

- 连接真实 MCSManager。
- 执行真实文件删除、APT 或服务端启动。
- 提供跨进程锁或数据库事务。
- 完成任务重启恢复编排器。
- 建立 HTTP API 或 WebSocket 状态推送。

下一阶段 T3 应实现：真实 MCSManager v10.18.3 contract adapter、文件/进程/端口/Java probe 的默认实现，以及可跨 Host 重启恢复的任务执行器。