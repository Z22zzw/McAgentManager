# MC AI Manager 新会话交接文档

> 交接日期：2026-08-30
> 项目目录：`/home/nero/workspace/Zzw_workspace`
> 目标：在新 session 中继续把 MC AI Manager Demo 补全到可交付，并保持真实 MCSManager + DeepSeek Harness 联调链路可验证。

## 1. 给新 session 的第一条指令

可以直接复制下面这段作为新 session 的开场消息：

> 继续 `/home/nero/workspace/Zzw_workspace` 中的 MC AI Manager 项目。请先阅读 `docs/HANDOFF-NEW-SESSION.md`，再读取与当前任务相关的 PRD/TDD/API 文档。不要重建已删除的 React 前端，`docs/prototype/index.html` 是当前唯一 UI 基线。先检查正在运行的服务和仓库状态，再继续实现未完成项。当前优先级是：确认 DSH 中的嵌入式 MC 任务进度条能显示并随真实任务更新；然后补齐 Agent 写工具的受控桥接、真实 ZIP 部署/EULA/审计/恢复链路。所有修改继续采用 TDD/BDD，并在交付前运行 typecheck、Vitest、BDD 校验和 Web 构建。涉及 Cordis Plugin 时必须先使用 `cordis-plugin-development` skill、Inspect Provider 和 `cordis_inspect_self`，不要创建替代 Plugin。

## 2. 产品目标与冻结边界

这是面向非技术 Minecraft 管理者的单主机、单租户、单管理员工具：用自然语言完成部署、启停、诊断、备份/恢复和 KubeJS 辅助，同时让每个高风险动作都有可理解的确认、风险、审计和事实验证。

当前边界已经冻结：

- MCSManager 继续承担实例、进程、监控和高级管理；MC AI Manager 是易用控制面和 Agent 编排层。
- 首个认证目标为 Ubuntu Server 24.04 LTS、x86_64、本地 ext4/xfs、MCSManager v10.18.3。
- Minecraft 1.20.1：Vanilla/Paper/Fabric/Forge，Java 17。
- Minecraft 1.21.1：Vanilla/Paper/Fabric/NeoForge，Java 21。
- Forge/NeoForge 只接受完整、可运行的服务端 ZIP；禁止执行 ZIP 内任意脚本或安装器。
- ZIP 限制：压缩包不超过 4 GiB，解压不超过 24 GiB，条目不超过 100,000，压缩比不超过 200:1。
- 默认离线登录保留，但必须由用户显式提交，并在卡片中展示风险。
- 删除必须精确指定目标、二次确认、审计并验证；磁盘压力清理不强制先备份。
- 游戏进程应通过 `mc-runner` 低权限隔离边界运行；Agent 能力必须经过受控 Gateway，不能给模型任意 shell/文件权限。

完整依据：

- [PRD](./prd/MC-AI-Manager-PRD-v0.1.md)
- [边界决策](./prd/MC-AI-Manager-P0-Boundary-Decisions-v0.1.md)
- [支持矩阵](./prd/MC-AI-Manager-P0-Support-Matrix-v0.1.md)
- [Golden Samples](./prd/MC-AI-Manager-P0-Golden-Samples-v0.1.md)
- [业务流程](./prd/MC-AI-Manager-Business-Flows-v0.1.md)

## 3. 当前代码真实状态

### 后端

后端是 Node.js + TypeScript + Fastify，入口为 [`src/server.ts`](../src/server.ts)。当前接口包括：

- `GET /healthz`
- `GET /api/v1/agent/status`
- `GET /api/v1/auth/session`
- `GET /api/v1/instances`
- `GET /api/v1/instances/:instanceId`
- `POST /api/v1/instances/:instanceId/actions`，支持 `START`、`STOP`、`RESTART`
- `GET /api/v1/tasks/latest`
- `GET /api/v1/tasks/:taskId`
- `POST /api/v1/deployments/demo`
- `GET /api/v1/audit-events`

`src/server.ts` 根据以下四个变量是否同时存在选择 real/demo 模式：

- `MCSM_BASE_URL`
- `MCSM_DAEMON_ID`
- `MCSM_TOKEN`
- `MCSM_COOKIE`

真实模式使用 [`src/adapters/mcsm-http-adapter.ts`](../src/adapters/mcsm-http-adapter.ts) 和 [`src/adapters/http-transport.ts`](../src/adapters/http-transport.ts)。认证要求已验证为登录 Cookie、`token` query 参数和 `X-Requested-With: XMLHttpRequest`。不要把 token、Cookie 或密码写入仓库、文档或最终回复。

当前任务和审计仍主要保存在进程内 Map；正式目标是 SQLite + WAL。JSON repository 目前是测试实现，见 [`src/persistence/task-repository.ts`](../src/persistence/task-repository.ts)。

### 前端

React 前端 `web/` 和 `dist/web/` 已按用户要求删除。当前唯一前端入口是 [`docs/prototype/index.html`](./prototype/index.html)，根部 Vite 配置是 [`vite.config.ts`](../vite.config.ts)。

- `npm run dev:web`：Vite，监听 `127.0.0.1:5174`
- `npm run build:web`：输出 `dist/prototype`
- 原型包含服务器总览、部署、登录方式/EULA、任务进度、Java 诊断、磁盘清理、无备份删除、审计和高级管理入口。
- 原型中的大多数流程仍是浏览器模拟；真实实例列表已接入 `GET /api/v1/instances`，会显示真实 MCSManager 空列表或实例列表。
- 后续视觉工作必须在原型上增量进行；不要只做颜色替换，也不要未经确认重新引入 React UI。正式视觉迭代需使用 `frontend-design` skill。

相关说明：[前端重置报告](./tdd/FRONTEND-RESET-REPORT.md)。旧的 [`T6-DEV-REPORT.md`](./tdd/T6-DEV-REPORT.md) 记录的是已废弃的 React 初始骨架，不能当作当前前端状态。

## 4. 已完成并实际验证的链路

真实隔离运行环境位于：

- MCSManager checkout：`.runtime/mcsmanager`
- 测试实例：`.runtime/mc-test/vanilla-1.21.1`
- MCSManager v10.18.3 Panel：`http://127.0.0.1:23333`
- MCSManager v4.18.3 Daemon：`ws://127.0.0.1:24444`

已经实际跑通：

1. 修复并补齐官方 `file_zip_linux_x64`、`pty_linux_x64` 运行依赖。
2. Panel 与 Daemon 连接成功。
3. 创建本地 `demo-admin` 并完成登录。
4. 通过真实 MCSManager API 读取实例。
5. 创建 Vanilla 1.21.1 隔离测试实例。
6. 通过 MC AI Manager real API 启动 Minecraft。
7. Java 进程监听 `127.0.0.1:25569`，`latest.log` 出现 `Done`。
8. 通过 MC AI Manager real API 停止 Minecraft，最终状态为 STOPPED，25569 端口关闭。

注意：本次联调用的是主机 Java 25，不代表 Java 17/21 P0 矩阵已经完成。真实 ZIP 部署、EULA 写入、Java 自动安装、真实删除和完整恢复链路仍未完成。

## 5. 当前运行服务

不要重复启动替代服务器；先检查已有进程。当前已知地址：

| 服务 | 地址 | 作用 |
|---|---|---|
| MC AI Manager Web | `http://127.0.0.1:5174` | 当前原型 UI |
| MC AI Manager API | `http://127.0.0.1:8787` | Fastify API，real mode |
| MCSManager 原始前端 | `http://127.0.0.1:5173` | 原始开发前端 |
| MCSManager Panel | `http://127.0.0.1:23333` | 隔离 Panel |
| MCSManager Daemon | `ws://127.0.0.1:24444` | 隔离 Daemon |
| DeepSeek Harness | `http://127.0.0.1:3080` | 当前 DSH GUI |

已知后台作业：

- `bash-5`：MC AI Manager Web
- `bash-9`：MCSManager 原始前端
- `bash-12`：隔离 MCSManager Panel
- `bash-14`：隔离 MCSManager Daemon
- `bash-18`：MC AI Manager API real mode

新 session 应先用 `job_list` 查看这些作业，不要靠假设。若作业已结束，按实际输出判断是否重启；涉及重启时不要打印认证信息。

## 6. 当前 Cordis Plugin 状态

当前 session 中动态 Plugin：

- Plugin：`mcai-1`
- Package：`pkg-3`
- Run：`run-3`
- 状态：running
- `currentPackageId`：`pkg-3`

`pkg-3` 已成功修复并运行，Host 使用已验证的 `subprocess` Service 调用固定参数 `curl` 访问本地 API，不使用本 session 中不可用的 `web` provider。Host handlers：

- `mc-read-latest-task`
- `mc-read-instances`
- `mc-read-task`

只读 Agent Tools：

- `mc_server_status`
- `mc_task_status`

Client 已注册到已核验的 `conversation.input.dock` Slot：

- registration id：`mcai-task-progress`
- order：`15`
- 每秒轮询 `/api/v1/tasks/latest` 对应的 Host RPC
- 显示待命、执行中、成功、失败、部分成功、需核对和 API 不可用状态

关键限制：动态 Cordis Plugin 是 session-local，不保证跨 new session 或进程重启保留。新 session 不要假定 `mcai-1` 仍存在；先 `cordis_inspect_self`。如果丢失，需要重新走 `cordis-plugin-development` skill → `cordis_inspect_list` → 精确查询 Provider/Slot → 定义并运行新的 session-local Plugin。不要在当前 Plugin 出现故障时偷偷创建替代 Plugin；应读取 package source/diagnostics，沿同一 Plugin 修复更新。

当前只读桥接不等于完整 Agent：启动、停止、部署、删除、备份/恢复等写工具尚未注册到 Cordis。

## 7. 本次交付前的首要验证

优先验证任务进度 Dock 的真实可见性和实时变化：

1. 打开 `http://127.0.0.1:3080`，必要时刷新页面。
2. 确认对话输入区域附近出现“MC 任务”进度条，初始应为“MC 任务待命”。
3. 通过真实 API 对当前 STOPPED 测试实例发起一次 `START`，保存返回的 `taskId`；不要把认证参数写进命令历史或回复。
4. 在 DSH 对话框观察进度条从执行中变化到“MC 任务已完成”。
5. 用 `GET /api/v1/tasks/:taskId` 和 MCSManager 实例状态确认结果；再发起 STOP，复测停止路径。
6. 若 UI 没有出现，先检查 `mcai-1` runtime/client 状态、Slot 注册和浏览器 Console；不要马上重写 UI。

如果只读 Tool 可以被 Agent 调用，分别验证 `mc_server_status` 和 `mc_task_status` 返回的是最小 JSON/文本，而不是序列化 Cordis live object。

## 8. 明确未完成工作与推荐顺序

### P0：Agent 受控写闭环

- 增加 `create_deployment_task`、`control_instance` 等写工具。
- Tool 参数必须使用固定 JSON Schema、幂等键和目标资源绑定。
- 高风险操作必须先返回卡片/confirmation，绑定 actor、resource、operation、expiry 和 nonce；确认后才能执行。
- 所有动作经过 Application Service → Task Executor → Operation Gateway → MCSManager/Host/Probe。
- 任务必须持久化、可恢复、可查询，不能只依赖进程内 Map。

### P0：真实 ZIP 部署

- ZIP 安全预算、路径穿越、符号链接、压缩炸弹和条目布局检查。
- 只允许声明支持的服务端布局和版本矩阵。
- 完整 runnable ZIP 与任意脚本/安装器必须严格区分。
- 工作区隔离、临时目录清理、端口租约、EULA 文件写入和事实验证。
- 失败时保留证据并进入 `RECOVERY_REQUIRED`，不伪报成功。

### P0：持久化与恢复

- SQLite + WAL 任务、幂等键、锁、审计事件和 confirmation。
- 进程重启后恢复/对账，处理 MCSManager 已执行但本地状态未知的情况。
- 删除前后的精确目标快照、审计和结果核验。

### P0：环境能力

- Java 17/21 检测与可控安装策略；当前宿主只有 Java 25，不能据此宣称矩阵完成。
- `mc-runner` 低权限运行边界。
- MCSManager 版本/路由/响应 envelope 契约测试。

### P1：Agent 与产品体验

- Agent 诊断、日志摘要、KubeJS 辅助和自然语言任务编排。
- 非可信日志/ZIP/服务器输出的 prompt-injection 隔离。
- SSE 或更高效任务订阅；当前先保持 HTTP 轮询。
- 高级管理入口跳转/会话契约。

## 9. 测试与交付命令

在项目根目录执行：

```bash
npm run typecheck
npm test
npm run bdd:validate
npm run bdd:parse
npm run build:web
```

已知基线：

- TypeScript typecheck：通过。
- Vitest：7 files / 61 tests 通过（最近一次基线；完成新增代码后必须重跑）。
- BDD validator：98 个场景定义、146 个展开场景、0 个自定义校验错误。
- BDD parse：语法解析成功，但 Step Definitions 尚未完整实现，undefined steps 不能误报为业务通过。
- Web build：通过。

BDD/TDD 资料：

- [BDD README](./bdd/README.md)
- [Traceability](./bdd/TRACEABILITY.md)
- [TDD module map](./tdd/TDD-MODULE-MAP.md)
- [API OpenAPI](./api/openapi.yaml)
- [Agent tools contract](./api/agent-tools.md)
- [MCSManager mapping](./api/mcsm-v10.18.3.md)

## 10. 重要操作纪律

- 先读文件再编辑；保留用户已有改动。
- 不要使用仓库中的真实凭据；`.env.example` 只能放变量模板。
- 不要编辑 `.runtime/mcsmanager`，除非明确是在修复隔离 MCSManager 且遵守其中 `AGENTS.md`。
- 不要把主机 Java 25 的结果写成 Java 17/21 已认证。
- 不要把 Demo endpoint 或内存 Map 描述成完整生产实现。
- 不要把当前两个只读 Tool 描述成完整 Agent 运维能力。
- 不要把 Cordis Inspect 查询结果当作业务 Service 数据；运行时代码只能调用已核验的真实 Service/Event/Slot。
- 修改动态 Plugin 前先读 `cordis-plugin-development` skill、Inspect Provider 和目标 Package source；Client 代码必须是纯 JavaScript，React 元素用 `React.createElement`，副作用必须绑定当前 Fiber。
- 前端所有变化先确认是否需要 `pnpm run dev:web` watcher；当前 `npm run dev:web` 对原型入口有效，DSH client HMR 只在 DSH checkout 的 watcher 条件满足时自动更新。否则重建并刷新 `http://127.0.0.1:3080`。
- 用户明确反感只有换颜色的视觉改动；如做 UI，必须改善信息层级、交互、状态反馈或可读性，并保持原型功能区域。

## 11. 现有报告索引

- [PRD 文档入口](./prd/README.md)
- [统一文档入口](./README.md)
- [真实联调报告](./tdd/REAL-INTEGRATION-REPORT.md)
- [前端重置报告](./tdd/FRONTEND-RESET-REPORT.md)
- [T1 控制面报告](./tdd/TDD-T1-REPORT.md)
- [T2 持久化/适配器报告](./tdd/TDD-T2-REPORT.md)
- [T3 适配器/探针报告](./tdd/TDD-T3-REPORT.md)
- [T4 部署执行器报告](./tdd/TDD-T4-REPORT.md)
- [T5 接口/文档治理报告](./tdd/TDD-T5-REPORT.md)
- [T6 开发报告](./tdd/T6-DEV-REPORT.md)

交接原则：新 session 先验证事实，再继续实现；如果旧报告与实际运行态冲突，以当前代码、服务检查和测试结果为准，并更新本文件或对应阶段报告。
