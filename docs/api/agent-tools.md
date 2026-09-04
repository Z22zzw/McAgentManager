# Agent 工具契约

Agent 只调用业务能力，不直接拼接 MCSManager URL、任意路径或未审计 Shell。

## 工具总表

| 工具 | 风险 | 副作用 | 确认 |
|---|---|---:|---:|
| `inspect_environment` | read | 否 | 否 |
| `list_instances` | read | 否 | 否 |
| `inspect_instance` | read | 否 | 否 |
| `inspect_disk` | read | 否 | 否 |
| `inspect_archive` | read | 否 | 否 |
| `classify_server_package` | read | 否 | 否 |
| `create_deployment_task` | reversible | 是 | EULA/登录方式按任务决定 |
| `control_instance` | service-impact | 是 | 用户明确请求即构成动作确认 |
| `plan_cleanup` | read | 否 | 否 |
| `cleanup_disk` | reversible | 是 | 低风险目标 |
| `preview_instance_deletion` | destructive-preview | 否 | 否 |
| `confirm_instance_deletion` | destructive | 是 | 必须确认令牌 |
| `reconcile_task` | read | 否 | 否 |
| `read_audit_record` | read | 否 | 否 |

## 通用输入

所有有副作用工具必须接收：

```json
{
  "taskId": "task-001",
  "operationId": "operation-001",
  "actorId": "admin-001",
  "idempotencyKey": "stable-request-key"
}
```

## 删除工具特殊要求

`confirm_instance_deletion` 还必须接收：

```json
{
  "resourceId": "instance-test-001",
  "manifestHash": "sha256:delete-list",
  "copyVersion": "delete-warning-v1",
  "confirmationToken": "opaque-token",
  "typedName": "测试服"
}
```

服务端重新验证资源 ID、清单哈希、操作者、文案版本和有效期。`typedName` 仅作人类复核，不能作为资源授权键。

## 工具输出

工具输出至少包含：

```json
{
  "taskId": "task-001",
  "state": "RECOVERY_REQUIRED",
  "facts": [],
  "evidenceRefs": [],
  "error": null,
  "nextAction": "RECONCILE_EXTERNAL_STATE"
}
```

Agent 不得仅根据自己的自然语言判断任务成功；必须使用 `state`、`facts`、`evidenceRefs` 和业务 API 返回值。
