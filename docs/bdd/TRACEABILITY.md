# P0 需求追踪矩阵

> 状态：BDD Baseline Frozen（2026-08-29）  
> 追踪链：PRD / Boundary → Support Matrix → Golden Sample / Fixture → BDD → TDD Module

## 1. 产品需求追踪

| 需求/决策 | BDD Feature | 场景前缀 | 测试数据 | 主要 TDD 模块 |
|---|---|---|---|---|
| P0 环境自检 | 00 | BDD-ENV | GS-ENV-001、GS-MCS | EnvironmentPolicy、McsmVersionPolicy |
| MCSManager 认证版本 | 00 | BDD-ENV | GS-MCS-001/009/010 | McsmVersionPolicy、McsmAdapter |
| MC 进程低权限隔离 | 00 | BDD-ENV | GS-ENV-005 | EnvironmentPolicy、OperationGateway |
| 不支持 OS/架构/文件系统拒绝 | 00 | BDD-ENV | GS-ENV-002～004 | EnvironmentPolicy |
| 支持矩阵内 ZIP 部署 | 01 | BDD-DEPLOY | GS-POS-001～008 | ServerClassifier、LaunchLayoutPolicy、ReadinessVerifier |
| 部署成功事实判定 | 01 | BDD-DEPLOY | GS-POS | ReadinessVerifier、PortLeaseService |
| 端口租约与实际绑定失败 | 01 | BDD-DEPLOY | GS-PORT-001～003 | PortLeaseService、ReadinessVerifier |
| 实例创建后启动前失败 | 01/07 | BDD-DEPLOY / BDD-REC | MCS/任务故障 fixture | IdempotencyService、RecoveryReconciler |
| 非服务端和范围外输入 | 02 | BDD-CLASS | GS-NEG-001～013 | ServerClassifier |
| ZIP 限额和安全解压 | 03 | BDD-SEC | GS-SEC-001～014 | ArchiveBudget、ArchivePathPolicy、ArchiveExtractor |
| 不可信内容不获得执行权 | 03/10 | BDD-SEC / BDD-DIAG | GS-PI-001～006 | OperationGateway、DiagnosticEvidence |
| Java 发现与自动安装 | 04 | BDD-JAVA | GS-JAVA-001～015 | JavaInventory、JavaInstaller |
| 默认离线登录显式提交 | 05 | BDD-AUTH | GS-AUTH-001～003 | ServerPropertiesPolicy、ConfirmationPolicy |
| EULA 独立确认 | 05 | BDD-EULA | GS-AUTH-004～007 | EulaWorkflow、ConfirmationPolicy |
| 实例启动/停止/重启 | 06 | BDD-CTRL | GS-TASK-006/007 | InstanceControl、ResourceLockService |
| 幂等与并发控制 | 06/07 | BDD-CTRL / BDD-REC | GS-TASK-003～009 | IdempotencyService、ResourceLockService |
| 浏览器/Host 中断恢复 | 07 | BDD-REC | GS-TASK-001～005 | TaskStateMachine、RecoveryReconciler |
| 模型不可用降级 | 07/10 | BDD-REC / BDD-DIAG | GS-TASK-010 | DegradedModePolicy |
| 低风险磁盘清理 | 08 | BDD-DISK | GS-DISK-001～004 | CleanupPlanner、ArchiveBudget |
| 无备份永久删除 | 08 | BDD-DEL | GS-DEL-001～008 | DeletionPlanner、ConfirmationPolicy |
| 玩家摘要与技术证据 | 09 | BDD-AUDIT | 审计 fixture | AuditService |
| 审计失败阻断破坏动作 | 08/09 | BDD-DEL / BDD-AUDIT | GS-DEL-008 | AuditService、OperationGateway |
| 高级管理安全跳转 | 09 | BDD-ADV | GS-MCS-008 | McsmAdapter、RecoveryReconciler |
| 证据型失败诊断 | 10 | BDD-DIAG | GS-JAVA、GS-MCS、GS-PI | DiagnosticEvidence |
| MCSManager 离线降级 | 10 | BDD-DIAG | GS-MCS-003/004/007 | DegradedModePolicy、McsmAdapter |

## 2. 支持组合追踪

| 组合 | Golden Sample | BDD 覆盖要求 | L2 状态 |
|---|---|---|---|
| Vanilla 1.20.1 / Java 17 | GS-POS-001 | DEP Scenario Outline | Fixture Pending |
| Vanilla 1.21.1 / Java 21 | GS-POS-002 | DEP Scenario Outline | Fixture Pending |
| Paper 1.20.1 / Java 17 | GS-POS-003 | DEP + Demo smoke | Fixture Pending |
| Paper 1.21.1 / Java 21 | GS-POS-004 | DEP + fallback smoke | Fixture Pending |
| Fabric 1.20.1 / Java 17 | GS-POS-005 | DEP | Fixture Pending |
| Fabric 1.21.1 / Java 21 | GS-POS-006 | DEP | Fixture Pending |
| Forge 1.20.1 / Java 17 | GS-POS-007 | DEP + JVM 参数边界 | Fixture Pending |
| NeoForge 1.21.1 / Java 21 | GS-POS-008 | DEP + JVM 参数边界 | Fixture Pending |

## 3. 发布门槛追踪

| 门槛 | 必须通过 |
|---|---|
| 每次提交 | 全部 @L0 |
| 合并前 | @L0 + @L1，零未解释失败 |
| 夜间 | 认证 MCSManager 上的 @L2 |
| 发布候选 | 8 个支持组合全部 L2 通过；所有 @destructive 在隔离环境通过 |
| 对外承诺 | Golden Sample manifest、许可复核和证据完整 |

## 4. 未覆盖处理

发现 P0 需求没有 BDD 场景时：

1. 不允许以“后续补测试”直接进入实现。
2. 先补场景和样本/fixture 引用。
3. 判断该需求属于 P0 还是应移出边界。
4. 更新本矩阵和 TDD 模块映射。

发现 BDD 场景没有上游需求时：

1. 判断是否是必要安全不变量。
2. 若是，补充 Boundary Decision。
3. 若不是，删除或移到探索测试，不扩大 P0。
