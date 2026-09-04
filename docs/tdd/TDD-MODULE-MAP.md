# BDD → TDD 模块拆分

> 状态：TDD Input Frozen（2026-08-29；模块接口在测试先行阶段细化）  
> 目的：把业务场景映射为可单元测试的领域模块；不在此确定最终仓库目录或框架封装。

## 1. 总体策略

- BDD 验证跨模块业务结果。
- TDD 验证确定性规则、状态转换和安全不变量。
- MCSManager 使用契约测试，不通过 mock 猜测外部 API。
- 真实服务端启动使用 L2 集成测试，不塞进每次提交的单元测试。
- Agent 负责理解和建议，领域模块决定权限、状态和可执行性。

## 2. 模块地图

| 模块 | 职责 | 主要 BDD | TDD 核心不变量 |
|---|---|---|---|
| EnvironmentPolicy | OS、架构、文件系统、账号和权限自检 | ENV | 非 Ubuntu 24.04/x86_64 拒绝；MC root 进程拒绝 |
| McsmVersionPolicy | `certifiedVersions` 和准入 | ENV/AUD | 未认证版本禁止写操作 |
| McsmAdapter | MCSManager API 适配 | ENV/DEP/CTL | schema、错误、超时与幂等关联不丢失 |
| ArchiveBudget | 上传、条目和峰值磁盘预算 | ARC/DSK | 任一限额超出即拒绝；计算不溢出 |
| ArchivePathPolicy | 路径、链接、编码和冲突校验 | ARC | 任何条目都不能逃出隔离根 |
| ArchiveExtractor | 受预算隔离解压 | ARC | 失败只清理本任务目录；不跟随链接 |
| ServerClassifier | 世界、客户端包、核心和版本识别 | CLS/DEP | 低确定性不进入自动启动 |
| LaunchLayoutPolicy | Vanilla/Paper/Fabric/Forge/NeoForge 入口谓词 | DEP | 核心、版本和唯一入口必须一致 |
| JvmArgumentPolicy | Forge/NeoForge 参数白名单 | DEP/ARC | 禁止 agent、嵌套 argfile、外部路径和超预算内存 |
| JavaInventory | 发现 Java 绝对路径和版本 | JVA | 不依赖 PATH；版本映射唯一 |
| JavaInstaller | 受控 APT 安装 | JVA | 只允许两个包；不 update/upgrade/换源；中断先对账 |
| PortLeaseService | 端口池、租约和绑定验证 | DEP/CTL | 并发不重复分配；监听事实优先 |
| ServerPropertiesPolicy | 登录模式与允许字段写入 | AUT | 用户选择、落盘值、回读值一致 |
| EulaWorkflow | 确认、原子写入和恢复 | AUT/REC | 未确认不写 true、不注册实例、不启动 |
| TaskStateMachine | 任务和步骤状态转换 | 全部 | 非法转换拒绝；终态不可回退 |
| IdempotencyService | task/operation 幂等 | DEP/CTL/REC/DSK | 重试不重复产生外部副作用 |
| ResourceLockService | 实例锁、磁盘锁和租约 | CTL/REC/DSK | 同一资源最多一个写持有者 |
| OperationGateway | 高权限动作入口 | 全部写场景 | 目标、权限、模板、审计和验证缺一不可 |
| ConfirmationPolicy | 高风险确认令牌 | AUT/DSK/CTL | operation/影响/版本变化立即失效 |
| InstanceControl | 目标状态启停重启 | CTL | 重启只有停止验证成功后才能启动 |
| ReadinessVerifier | 进程、就绪、观察窗口和端口 | DEP/CTL/DIA | 不把命令发送或进程存在当最终成功 |
| RecoveryReconciler | Host/MCS/浏览器中断事实对账 | REC | 未知破坏性动作进入 RecoveryRequired |
| CleanupPlanner | 低风险清理排序与空间复测 | DSK | 清理意图不升级为实例删除 |
| DeletionPlanner | 删除清单、目标和前置检查 | DSK | 只按不可变 ID；共享/链接/挂载异常拒绝 |
| AuditService | 追加事件、脱敏和关联 | AUD | L3 审计写入失败时动作不开始 |
| DiagnosticEvidence | 事实、推断、证据和建议 | DIA | 推断不能覆盖事实；低证据不触发高风险动作 |
| DegradedModePolicy | 模型/MCS 不可用降级 | DIA/REC | 模型不可用不影响确定性读操作；无 MCS 禁止写 |

## 3. TDD 测试模板

每个领域规则优先使用表驱动测试：

```text
Given: 最小领域输入与前置状态
When: 调用一个确定性领域动作
Then: 返回结果/错误码
And: 状态变化符合约束
And: 未授权副作用没有发生
```

示例：

```text
ArchivePathPolicy
- rejects ../outside
- rejects absolute Unix path
- rejects Windows drive path
- rejects symlink and hardlink
- rejects Unicode-normalized duplicate
- accepts normal relative path
```

```text
TaskStateMachine
- Created -> Inspecting is allowed
- WaitingUser -> Executing without confirmation is rejected
- Executing -> Verifying is allowed
- Succeeded -> Executing is rejected
- Interrupted destructive operation -> RecoveryRequired
```

## 4. 契约测试范围

MCSManager v10.18.3 必须固定：

- 认证输入、响应和过期行为。
- 实例列表/详情 schema。
- 创建请求、返回 ID 和重复请求行为。
- 启动/停止请求和中间状态。
- 日志读取/流格式。
- 错误码、HTTP 状态、超时和连接中断。
- 删除/解除注册行为。
- 高级入口深链格式。

`certifiedVersions` 中每个版本必须保存完整契约报告。只更新版本字符串不视为兼容。

## 5. 推荐实现顺序

### T0：测试基础设施

1. Gherkin parser 与场景 ID 检查。
2. Fixture Registry 和 manifest schema。
3. 隔离测试目录与测试 MCSManager 生命周期。
4. 事实 Probe 与统一证据输出。

### T1：纯领域安全内核

1. ArchiveBudget。
2. ArchivePathPolicy。
3. ServerClassifier。
4. LaunchLayoutPolicy。
5. JvmArgumentPolicy。
6. TaskStateMachine。
7. ConfirmationPolicy。

### T2：受控执行基础

1. OperationGateway。
2. IdempotencyService。
3. ResourceLockService。
4. AuditService。
5. RecoveryReconciler。

### T3：外部适配

1. McsmAdapter 与契约测试。
2. JavaInventory/Installer。
3. PortLeaseService。
4. ReadinessVerifier。

### T4：业务闭环

1. EulaWorkflow。
2. ServerPropertiesPolicy。
3. InstanceControl。
4. CleanupPlanner/DeletionPlanner。
5. DiagnosticEvidence/DegradedModePolicy。

### T5：L2 真实启动

按 GS-POS-001 至 GS-POS-008 逐个接入，不并行扩大版本范围。

## 6. 模块完成定义

一个模块只有同时满足以下条件才算完成：

- 规则的失败测试先建立。
- 正向、边界和拒绝测试通过。
- 错误使用稳定错误码，不依赖自然语言文本断言。
- 状态和副作用可被独立 Probe 验证。
- 关联 BDD 场景通过对应执行层级。
- 安全不变量进入回归套件。
- 无跳过、仅本地通过或依赖固定 sleep 的测试。
