# TDD T3 外部适配与事实 Probe 报告

> 状态：完成  
> 日期：2026-08-30  
> 范围：可注入 HTTP 传输、MCSManager 适配契约、文件/进程/端口/Java Probe

## 已实现

- `FetchHttpTransport`：统一 base URL、可注入认证 headers、JSON 请求和响应解析。
- `McsmHttpAdapter`：按 MCSManager v10.18.3 前端服务声明映射实例列表、详情、创建、启动、停止、日志和删除接口。
- `DEFAULT_MCSM_PATHS`：集中管理已从 v10.18.3 源码核对过的候选路径；真实实例响应 envelope 仍需 T4 contract test 认证。
- `NodeFileProbe`：使用 `lstat` 检查存在性、目录、软链接和大小，不跟随软链接。
- `ProcProcessProbe`：读取 `/proc` 获取运行状态、UID 和命令摘要。
- `TcpPortProbe`：执行本机 TCP 连接事实检查，超时后返回不可用。
- `ExecJavaProbe`：运行 `java -version` 获取主版本和可用性。

## 外部适配原则

- HTTP transport 可注入 fake，测试不需要访问真实 MCSManager。
- Adapter 对非 2xx 返回稳定 `MCSM_HTTP_<status>` 错误。
- 外部实例数据必须通过运行时 schema 断言。
- 所有 mutation 请求携带幂等键。
- MCSManager 长期凭证只在 transport 构造层存在，不进入 adapter 请求业务 body。
- 事实 Probe 与业务编排分离，不能用产品自身缓存冒充主机事实。

## 验证结果

```text
npm run typecheck     passed
npm test              5 files / 55 tests passed
npm run bdd:validate  11 files / 98 scenarios / 0 errors
```

## 尚未连接

- 真实 MCSManager v10.18.3 实例。
- 真实 API endpoint 的最终路径和 response envelope 验证。
- 真实 ZIP 解压和服务端启动。
- 真实 Java APT 安装。
- 持久化任务执行器的跨进程恢复。
- Cucumber Step Definitions。

下一阶段建议进入 T4：搭建隔离测试 MCSManager，完成 v10.18.3 API contract suite，并将 TaskRepository、OperationGateway、McsmHttpAdapter 和事实 Probe 接入第一个可恢复的部署任务。