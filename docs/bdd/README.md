# MC AI Manager P0 BDD 基线

> 状态：BDD Baseline Frozen（2026-08-29 用户确认）  
> 输入：已冻结的 P0 边界、支持矩阵和测试目录  
> 推荐执行器：Cucumber.js + TypeScript  
> 单元测试推荐：Vitest
> 测试职能入口：可执行 Feature 文件位于项目 `specs/bdd/features/`；校验脚本位于 `specs/bdd/validate-bdd.mjs`。

## 1. 目的

本目录把产品边界转化为业务可观察、可自动执行的验收场景。BDD 描述“系统在什么条件下必须表现成什么样”，不规定具体页面组件、数据库、类名或内部算法。

业务事实优先级：

1. MCSManager 实际状态。
2. 主机进程、端口和文件事实。
3. 服务端就绪证据。
4. 规则和 Agent 推断。
5. 对话历史。

场景断言不得只验证 AI 文案、HTTP 200 或按钮已点击。

## 2. Feature 目录

| 文件 | 领域 | 场景 ID 前缀 |
|---|---|---|
| `00_environment_and_mcsm.feature` | 环境、自检、MCSManager 认证版本 | BDD-ENV |
| `01_supported_zip_deployment.feature` | 支持矩阵内 ZIP 部署闭环 | BDD-DEPLOY |
| `02_upload_classification.feature` | 世界、客户端包、安装器和不支持版本分类 | BDD-CLASS |
| `03_archive_security.feature` | ZIP 预算、路径和提示注入 | BDD-SEC |
| `04_java_runtime.feature` | Java 发现、自动安装和失败恢复 | BDD-JAVA |
| `05_login_and_eula.feature` | 离线登录、正版验证和 EULA | BDD-AUTH / BDD-EULA |
| `06_instance_control.feature` | 启动、停止、重启和实例锁 | BDD-CTRL |
| `07_task_recovery.feature` | 浏览器、Host、模型和外部状态恢复 | BDD-REC |
| `08_disk_cleanup_and_delete.feature` | 磁盘预算、低风险清理和永久删除 | BDD-DISK / BDD-DEL |
| `09_audit_and_advanced_management.feature` | 审计、高级入口和事实同步 | BDD-AUDIT / BDD-ADV |
| `10_diagnostics_and_degradation.feature` | 证据型诊断和降级 | BDD-DIAG |

## 3. 编写规则

### 3.1 语言

使用 Cucumber 通用英文关键字，步骤和描述使用中文：

```gherkin
Feature: 支持矩阵内服务端部署

  @p0 @BDD-DEPLOY-001 @GS-POS-003
  Scenario: 部署 Paper 1.20.1 完整服务端
    Given 环境通过 P0 自检
    When 管理员提交完整服务端 ZIP 并完成必要确认
    Then 实例应达到“服务已在本机准备完成”状态
```

### 3.2 场景 ID

- 每个场景必须有唯一业务 ID，例如 `@BDD-DEPLOY-001`。
- ID 一经进入 Baseline Frozen 不重新编号。
- 删除场景时保留 tombstone 记录，避免测试报告错配。
- `Scenario Outline` 只有一个业务 ID；Examples 行使用 `case_id` 区分。

### 3.3 标签

| 标签 | 用途 |
|---|---|
| `@p0` | P0 发布门槛 |
| `@smoke` | 每次部署后的最小冒烟集 |
| `@L0` | 纯领域/解析/网关 fixture，每次提交 |
| `@L1` | 故障注入和服务集成，合并前或每日 |
| `@L2` | 真实 MCSManager 与真实服务端启动，发布前或夜间 |
| `@destructive` | 删除、强制终止等破坏性场景，只能在隔离环境运行 |
| `@requires_mcsm` | 需要认证 MCSManager 实例 |
| `@requires_apt` | 需要隔离 Ubuntu APT 测试环境 |
| `@requires_model` | 需要模型参与，但事实断言不能依赖模型措辞 |
| `@GS-POS-003` | 直接引用测试目录中的样本 ID；Cucumber 标签保留连字符 |

### 3.4 步骤边界

步骤应描述：

- 已知环境与资源状态。
- 用户提交的目标和结构化选择。
- 系统可观察的任务状态变化。
- MCSManager、文件、进程、端口和审计证据。
- 明确没有发生的副作用。

步骤不应描述：

- React/Vue 组件名。
- CSS、颜色或视觉布局。
- 数据库表名和内部类名。
- “等待固定 5 秒”这类脆弱时间实现。
- 模型必须输出完全一致的自然语言句子。
- 生产环境路径、账号或凭证。

## 4. 统一业务词汇

| 词汇 | BDD 定义 |
|---|---|
| 工作目录已准备 | ZIP 已在隔离目录安全解压和识别，但尚未注册 MCSManager 实例 |
| 实例已创建 | MCSManager 中存在带任务幂等标识的目标实例 |
| 进程已启动 | MCSManager 和主机事实确认进程存在且未立即退出 |
| 服务已就绪 | 对应核心出现认证就绪证据，观察窗口内无致命退出 |
| 本机可用 | 服务已就绪且配置端口实际监听 |
| 外网未知 | 没有可信外部探测证据，不能承诺公网玩家可连接 |
| 已确认事实 | 可追溯到工具、MCSManager、文件、进程、端口或日志解析器 |
| 可能原因 | 基于事实的规则或模型推断，不能冒充事实 |
| 需要核对 | 无法证明上一步是否完成，禁止自动重放破坏性动作 |
| 明确确认 | 确认绑定操作者、任务、operation ID、影响清单、文案版本和有效期 |

## 5. 状态断言规范

### 5.1 任务终态

每个任务最终必须是以下之一：

- `Succeeded`
- `Partial`
- `Failed`
- `Cancelled`
- `RecoveryRequired`

`Executing`、`Verifying`、`WaitingUser` 不能作为验收终态。Feature 的最终 Then 必须明确一个终态，不能使用“继续、失败或需要核对”等任选结果。

实例观测状态与任务状态分开：

- `Stopped`
- `Starting`
- `Running`
- `Stopping`
- `Abnormal`
- `Unknown`

“需要核对”对应任务终态 `RecoveryRequired`；“未知”对应实例观测状态 `Unknown`。页面中文文案可以变化，但自动化断言使用稳定枚举。

### 5.2 成功证据

ZIP 部署成功至少断言：

1. MCSManager 实例唯一存在。
2. 实例使用预期 Java 绝对路径。
3. 进程运行。
4. 核心就绪证据命中。
5. 观察窗口无致命退出。
6. 本机端口实际监听。
7. 页面/任务结果不宣称公网已验证。
8. 审计链包含用户确认、执行和验证结果。

### 5.3 未发生副作用

拒绝和失败场景至少检查适用项：

- 没有注册 MCSManager 实例。
- 没有启动上传内容。
- 没有写入工作区外。
- 没有修改软件源或系统默认 Java。
- 没有删除实例、世界或备份。
- 没有记录虚假的成功终态。

## 6. 自动化运行档位

```text
PR / 每次提交
└── @L0

合并前 / 每日
├── @L0
└── @L1

夜间 / 发布候选
├── @L0
├── @L1
└── @L2

隔离破坏性环境
└── @destructive
```

破坏性测试必须使用：

- 独立测试 MCSManager。
- 固定测试实例 ID 前缀。
- 独立临时文件系统或临时目录。
- 不含真实玩家数据的测试世界。
- 测试结束后的事实核验和清理报告。

## 7. Step Definition 设计原则

推荐按业务能力提供步骤驱动器，而不是每个场景直接运行 Shell：

```text
World
├── environmentDriver
├── archiveDriver
├── taskDriver
├── gatewayDriver
├── mcsManagerDriver
├── processProbe
├── portProbe
├── auditProbe
└── fixtureRegistry
```

- Driver 调用产品 API 或测试 seam。
- Probe 读取事实，不依赖产品自己报告的结果。
- Fixture Registry 通过样本 ID 获取 manifest，不在步骤中硬编码路径。
- 场景结束后统一输出任务、实例、文件和审计证据。

## 8. BDD 冻结完成条件

- 所有 Feature 可以被 Gherkin parser 解析。
- 每个 Scenario 有唯一 ID。
- 每个 P0 支持组合至少被一个 L2 场景覆盖。
- 每类严重拒绝/恢复路径至少有一个场景。
- 场景引用的 Golden Sample ID 存在。
- 场景没有依赖视觉实现或模型固定措辞。
- 需求追踪矩阵无未覆盖 P0 条目。
- 破坏性场景具有隔离环境标签。
- 产品、测试和工程共同确认后状态改为 `BDD Baseline Frozen`。
