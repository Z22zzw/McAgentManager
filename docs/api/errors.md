# 统一错误码与恢复语义

所有错误响应遵循：

```json
{"code":"MCSMANAGER_TIMEOUT","message":"无法确认外部实例状态","retryable":false,"requiresReconciliation":true}
```

| 错误码 | 分类 | retryable | requiresReconciliation | 处理 |
|---|---|---:|---:|---|
| AUTH_REQUIRED | 认证 | 否 | 否 | 重新登录 |
| FORBIDDEN_RESOURCE | 授权 | 否 | 否 | 结束任务 |
| INVALID_ARCHIVE | 输入 | 否 | 否 | 重新上传 |
| ARCHIVE_LIMIT_EXCEEDED | 输入 | 否 | 否 | 调整文件或清理空间 |
| ARCHIVE_PATH_TRAVERSAL | 安全阻断 | 否 | 否 | 隔离并记录安全事件 |
| UNSUPPORTED_SERVER | 范围 | 否 | 否 | 展示支持边界 |
| UNSAFE_LAUNCH_LAYOUT | 安全阻断 | 否 | 否 | 不启动上传内容 |
| INVALID_CONFIRMATION | 确认 | 否 | 否 | 重新生成预览和确认 |
| CONFIRMATION_EXPIRED | 确认 | 否 | 否 | 重新确认 |
| DISK_SPACE_INSUFFICIENT | 环境 | 否 | 否 | 进入清理建议 |
| JAVA_UNAVAILABLE | 环境 | 否 | 否 | 受控安装或部署人员处理 |
| APT_AUTH_UNAVAILABLE | 环境 | 否 | 否 | 部署人员处理 |
| AUDIT_UNAVAILABLE | 安全阻断 | 否 | 否 | 阻断破坏性写操作 |
| MCS_VERSION_NOT_CERTIFIED | 外部兼容 | 否 | 否 | 只读检测 |
| MCSMANAGER_UNAVAILABLE | 外部系统 | 否 | 否 | 读操作可降级，写操作失败 |
| MCSMANAGER_TIMEOUT | 外部状态 | 否 | 是 | 回查 MCSManager、进程、日志和端口 |
| INSTANCE_STATE_CONFLICT | 外部状态 | 否 | 是 | 重新读取实际状态 |
| EXTERNAL_STATE_UNKNOWN | 外部状态 | 否 | 是 | 进入 `RECOVERY_REQUIRED` |
| OPERATION_LOCKED | 并发 | 是 | 否 | 等待或返回现有任务 |
| READINESS_NOT_CONFIRMED | 验证 | 否 | 是 | 保持 `PARTIAL` 或核对 |
| INTERNAL_ERROR | 系统 | 否 | 视情况 | 审计并转人工处理 |

## 约束

- `retryable=true` 只表示无副作用的安全重试，不表示可以重放外部写操作。
- `requiresReconciliation=true` 时，Agent 不得直接重发原动作。
- 任何破坏性错误都必须带 `operationId`（如果已生成）。
- `message` 面向用户；技术证据通过单独的审计/诊断资源获取。
