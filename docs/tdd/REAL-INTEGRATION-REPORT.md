# 真实后端联调阶段报告

> 日期：2026-08-30  
> 状态：真实 MCSManager 与真实 Minecraft 生命周期已跑通；Agent 只读 Tool Bridge 已接入

## 已跑通

- 隔离 MCSManager v10.18.3 Panel 启动。
- 隔离 MCSManager v4.18.3 Daemon 启动。
- 官方 `file_zip_linux_x64` 和 `pty_linux_x64` 依赖就位。
- Panel 与本地 Daemon WebSocket 连接成功。
- 创建隔离 `demo-admin` 用户并完成登录。
- 真实调用 `/api/service/remote_service_instances`。
- MC AI Manager API 使用真实 MCSManager adapter 返回真实实例列表。
- 创建隔离 Vanilla 1.21.1 测试实例，并通过 MC AI Manager API 启动成功。
- 真实 Java Minecraft 进程监听 `127.0.0.1:25569`，latest.log 出现 `Done`。
- 通过 MC AI Manager API 停止成功，最终 MCSManager 状态为 STOPPED，25569 端口关闭。
- DeepSeek Harness `127.0.0.1:3080` HTTP 可达。
- 当前 Harness 已运行 `mcai-1/pkg-1`，注册 `mc_server_status` 和 `mc_task_status` 两个只读工具。

## 运行地址

| 服务 | 地址 |
|---|---|
| MC AI Manager Web | `http://127.0.0.1:5174` |
| MC AI Manager API | `http://127.0.0.1:8787` |
| MCSManager Panel | `http://127.0.0.1:23333` |
| MCSManager Daemon | `ws://127.0.0.1:24444` |
| DeepSeek Harness | `http://127.0.0.1:3080` |

## 未完成

- 测试实例使用主机 Java 25 进行联调，尚未完成 P0 Java 17/21 矩阵验证。
- 真实 ZIP 上传、服务端识别、EULA 写入任务和 Java 自动安装尚未接入该实例。
- Agent 当前通过 Cordis 只接入真实状态/任务只读工具；启动、停止、部署等写工具尚未接入 Harness。
- 真实 MCSManager 删除行为、完整日志 envelope 和高级入口会话仍需契约化。

## 结论

本轮全链路事实已验证：真实 MCSManager Panel/Daemon 运行，MC AI Manager real mode 读取真实实例，通过真实 API 启动并停止真实 Minecraft 进程，任务状态经过 MCSManager 状态核验；DeepSeek Harness GUI 可达且已注册 MC 只读工具。

Agent 的写操作仍必须通过后续 Cordis Tool/RPC 受控接入，不能把当前只读桥接描述为完整自动运维 Agent。
