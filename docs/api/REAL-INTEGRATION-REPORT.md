# 真实服务联调报告

> 日期：2026-08-30  
> 状态：MCSManager、真实 Minecraft 生命周期已联通；Agent 只读 Tool Bridge 已接入；写工具待接入

## MCSManager

已在 `.runtime/mcsmanager` 隔离副本运行 MCSManager v10.18.3：

- Panel：`http://127.0.0.1:23333`
- Daemon：`ws://127.0.0.1:24444`
- Panel 与本地 daemon 已建立连接。
- 已创建隔离 `demo-admin` 用户。
- 已完成真实登录。
- `remote_service_instances` 已由真实 Panel API 返回成功。
- 已创建隔离 Vanilla 1.21.1 测试实例，真实启动并停止回路已完成。

MCSManager v10.18.3 的认证实测要求：

- 登录会话 Cookie。
- `token` 查询参数。
- `X-Requested-With: XMLHttpRequest` 请求头。

这些凭证只存在当前本地临时运行环境，不写入仓库、不进入前端。

## MC AI Manager API

当前 API 使用 real mode 环境变量启动：

```text
MCSM_BASE_URL
MCSM_DAEMON_ID
MCSM_TOKEN
MCSM_COOKIE
```

验证结果：

```json
{
  "ok": true,
  "service": "mc-ai-manager-api",
  "mode": "real"
}
```

真实实例查询结果：

```json
{
  "items": [{ "name": "链路测试服", "lifecycle": "STOPPED", "port": 25569 }],
  "source": "MCSManager"
}
```

这证明 MC AI Manager 已经通过真实 MCSManager Adapter 读取真实服务，而不是读取 Demo 内存列表。该测试实例已在验证后停止，25569 端口已关闭。

## Agent 服务

已检查 DeepSeek Harness：

- GUI：`http://127.0.0.1:3080`，HTTP 200，可达。
- 当前 DSH 可通过 Cordis/Tool 运行时提供 Agent 能力。
- 未发现可直接供独立后端调用的通用 Agent REST API。
- `/api/v1/agent/status` 返回 Harness GUI 可达。
- 当前会话已运行 `mcai-1/pkg-1`，注册 `mc_server_status` 与 `mc_task_status` 两个只读工具；写工具尚未接入。

后续正确接入方式应是：

```text
MC AI Manager 业务 API
    ↕
Agent Tool / Cordis Host RPC
    ↕
DeepSeek Harness Agent Loop
```

不建议为此伪造 `/chat` HTTP 接口，因为那会绕过 DSH 的 Agent 会话、工具、确认卡片和审计机制。

## 当前阻塞与边界

- 主机当前 Java 为 25，不满足 P0 的 Java 17/21 认证矩阵；真实 MC 启动前需要隔离安装或指定 Java 17/21。
- 已从 MCSManager v10.18.3 官方 daemon 发布包取得并安装匹配 Linux x64 的 `pty_linux_x64`；daemon 重启后 PTY 缺失错误已消失。
- Panel 源码依赖通过隔离副本补齐，未修改上游源码。
- 测试实例使用主机 Java 25 完成联调，尚未通过冻结的 Java 17/21 P0 矩阵。
- 真实 ZIP 部署、EULA 写入、Java 自动安装和 Agent 写工具仍待后续接入。

## 运行中的服务

当前保留以下服务方便继续联调：

| 服务 | 地址 | 状态 |
|---|---|---|
| MC AI Manager API | `http://127.0.0.1:8787` | real mode |
| MC AI Manager Web | `http://127.0.0.1:5174` | running |
| MCSManager Panel API | `http://127.0.0.1:23333` | running |
| MCSManager Original Frontend | `http://127.0.0.1:5173` | running |
| MCSManager Daemon | `ws://127.0.0.1:24444` | running |
| DeepSeek Harness | `http://127.0.0.1:3080` | running |
