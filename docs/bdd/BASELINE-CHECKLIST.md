# BDD Baseline 冻结检查表

## 结构

- [x] 11 个计划 Feature 均存在。
- [x] 标准 Cucumber parser 无语法错误。
- [x] 每个场景拥有唯一 `@BDD-<DOMAIN>-NNN`。
- [x] 每个场景拥有 `@p0`。
- [x] 每个场景归入 L0、L1 或 L2。
- [x] 破坏性场景带 `@destructive`。

## 测试数据

- [x] 所有 `@GS-*` 均存在于测试目录。
- [x] 每个 Scenario Outline 的 Examples 含 `case_id`。
- [x] 使用多个样本的 Outline 含 `sample_id`，每行恰好映射一个 fixture。
- [x] 8 个正式支持组合均有独立 Examples 行。
- [x] 真实大二进制仅用于 L2，规则分支优先使用小型 fixture。

## 业务结果

- [x] 每个完成型场景只有一个任务终态。
- [x] `RecoveryRequired` 与实例 `Unknown` 没有混用。
- [x] 成功场景验证外部事实，不只验证产品自身返回。
- [x] 拒绝场景验证关键副作用没有发生。
- [x] 超时不直接断言成功或失败事实。
- [x] 不存在“继续、失败或需要核对”之类任选 Then。

## 边界一致性

- [x] 只承诺 Ubuntu 24.04、x86_64、ext4/xfs。
- [x] 只有认证 MCSManager 版本允许自动写操作。
- [x] MC 上传内容不以 root 运行。
- [x] 只覆盖冻结的 8 个核心/版本组合。
- [x] Forge/NeoForge 不执行任意上传脚本或危险 JVM 参数。
- [x] Java 安装不更换软件源、不修改系统默认 Java。
- [x] 默认离线登录仍需显式提交。
- [x] EULA 确认前不注册实例、不启动。
- [x] 永久删除不强制备份，但确认绑定精确资源和影响清单。
- [x] 不把本机就绪表述为公网可达。

## 可维护性

- [x] 一个业务不变量只有一个主 E2E 场景。
- [x] 其他 Feature 只验证各自领域的特有后果。
- [x] 步骤不包含组件名、CSS、数据库表或内部类名。
- [x] 时间策略通过配置/策略名称表达，不依赖固定 sleep。
- [x] 模型自然语言不使用全文相等断言。
- [x] TRACEABILITY 中没有未覆盖 P0 需求。
- [x] TDD-MODULE-MAP 中每个 P0 模块至少关联一个 BDD 领域。

## 冻结签署

- 产品：用户已确认冻结
- 测试：独立场景审查完成；阻断项已修订
- 工程：自定义校验与标准 Cucumber 解析通过；Step Definitions 待 TDD 阶段实现
- 冻结日期：2026-08-29
