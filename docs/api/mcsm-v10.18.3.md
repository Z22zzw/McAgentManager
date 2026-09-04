# MCSManager v10.18.3 适配契约

> 状态：源码路由已核对；真实实例 response envelope 和认证方式待隔离环境契约测试。

## 已核对的前端服务路由

来源：MCSManager v10.18.3 `frontend/src/services/apis/index.ts` 与 `instance.ts`。

| 内部能力 | 方法 | 路由 | 关键参数 |
|---|---|---|---|
| 远程节点实例列表 | GET | `/api/service/remote_service_instances` | `daemonId,page,page_size` |
| 实例详情 | GET | `/api/instance` | `uuid,daemonId` |
| 创建实例 | POST | `/api/instance` | `daemonId` + `IGlobalInstanceConfig` |
| 启动实例 | GET | `/api/protected_instance/open` | `uuid,daemonId` |
| 正常停止 | GET | `/api/protected_instance/stop` | `uuid,daemonId` |
| 控制台日志 | GET | `/api/protected_instance/outputlog` | `uuid,daemonId` |
| 删除实例 | DELETE | `/api/instance` | `daemonId` + `uuids[]` + `deleteFile` |

## 外部状态映射

MCSManager `INSTANCE_STATUS_CODE`：

```text
0 STOPPED  → STOPPED
1 STOPPING → STOPPING
2 STARTING → STARTING
3 RUNNING  → RUNNING
其他       → UNKNOWN
```

## 重要字段映射

| MCSManager | 内部模型 |
|---|---|
| `instanceUuid` | `Instance.id` |
| `config.nickname` | `Instance.name` |
| `config.cwd` | `Instance.workDirectory` |
| `config.basePort` | `Instance.port` |
| `status` | `Instance.lifecycle` |
| `info.currentPlayers` | `Instance.players.online` |
| `info.maxPlayers` | `Instance.players.max` |
| `info.version` | `Instance.gameVersion` |
| `info.allocatedPorts` | 端口事实辅助信息 |

## 待真实契约测试确认

- `/api/auth/login` 返回的 session/cookie 形态。
- API Key 与 Cookie 的优先级和失效行为。
- 实例列表和详情的完整 response envelope。
- POST 创建实例返回的是 `instanceUuid + config` 还是其他包装。
- GET 启停接口是否异步返回以及状态观察窗口。
- outputlog 返回字符串、数组或分页结构。
- DELETE 的 `deleteFile` 行为和删除后的资源可见性。
- remote daemon 离线、权限不足、超时和重复请求行为。
- 高级管理深链和是否支持受限会话。

## 认证清单规则

- 首个认证版本：`v10.18.3`。
- 其他 `v10.18.x` 只读检测，完成完整契约测试后加入 `certifiedVersions`。
- 未认证版本禁止自动写操作。
- 认证报告必须包含版本、API schema、状态映射、错误、超时、幂等和高级入口结果。

## 参考源码

- <https://github.com/MCSManager/MCSManager/tree/v10.18.3/frontend/src/services/apis>
- <https://github.com/MCSManager/MCSManager/blob/v10.18.3/frontend/src/services/apis/instance.ts>
- <https://github.com/MCSManager/MCSManager/blob/v10.18.3/frontend/src/services/apis/index.ts>
