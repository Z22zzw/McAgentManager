# TDD T1 受控执行层报告

> 状态：完成  
> 日期：2026-08-29  
> 范围：纯领域策略与内存控制面，不连接真实主机或 MCSManager

## 已实现模块

- `EnvironmentPolicy`：Ubuntu 24.04、x86_64、ext4/xfs、低权限 MC 进程和目录可用性检查。
- `McsmVersionPolicy`：`certifiedVersions` 准入；首个认证版本为 v10.18.3。
- `IdempotencyService`：相同幂等键只执行一次，后续请求返回原结果。
- `ResourceLockService`：实例级和全局资源锁，拒绝跨任务占用及错误释放。
- `AuditService`：追加式事件、凭证字段脱敏和不可由服务接口编辑历史。
- `OperationGateway`：任务、操作、操作者、风险、资源和认证版本校验；审计失败时释放锁并阻断动作。
- `RecoveryReconciler`：根据 MCSManager、进程和资源事实决定成功、继续恢复或进入 `RecoveryRequired`。

## TDD 覆盖

- 环境不支持、root 进程和文件系统拒绝。
- MCSManager 未认证补丁禁止写操作。
- 幂等重复请求。
- 锁竞争和错误释放。
- 删除风险与动作类型不匹配。
- 审计不可用阻断执行。
- 凭证摘要脱敏。
- 创建、启动和删除响应丢失后的事实对账。
- 未知外部状态不重放破坏性操作。

## 验证结果

```text
npm run typecheck     passed
npm test              3 files / 45 tests passed
npm run bdd:validate  11 files / 98 scenarios / 0 errors
```

Cucumber Feature 仍会显示 undefined steps，这是因为 Step Definitions 尚未实现；Gherkin 语法解析本身已通过。

## 尚未覆盖

- 真实 MCSManager API 契约。
- 真实 Java APT 操作。
- 真实文件系统解压。
- 真实进程和端口探测。
- 数据库或持久化任务存储。
- Cucumber Step Definitions。
- Web 与 Harness 连接。

下一阶段进入 T2：将当前纯领域模块接入持久化任务仓储、文件/进程事实 Probe 和 MCSManager adapter 的契约测试。