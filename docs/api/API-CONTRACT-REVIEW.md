# T5 接口契约评审记录

> 状态：API Contract Candidate  
> 日期：2026-08-30  
> 评审结论：可作为 T6 Web/Agent 实现输入；真实 MCSManager envelope 仍需隔离实例契约测试
> 文档归档：已纳入统一 `docs/` 文档中心

## 已冻结

- Web API 前缀 `/api/v1`。
- Cookie 会话认证。
- 实例生命周期和健康状态分离。
- 长任务统一返回 `taskId`，通过任务资源查询状态。
- 写操作携带幂等键。
- 删除必须携带资源、清单哈希、操作 ID、操作者和确认令牌。
- 错误响应统一包含 `code`、`message`、`retryable`、`requiresReconciliation`。
- Agent 只能调用业务工具，不直接拼接 MCSManager API 或文件路径。
- MCSManager 未认证版本禁止自动写操作。

## 待真实联调确认

- Web 会话 Cookie 的 Secure、HttpOnly、SameSite 和反向代理配置。
- MCSManager API 认证 Cookie/API Key 的实际形态。
- MCSManager 响应 envelope 和错误字段。
- 日志分页/流式协议。
- 高级管理安全入口的短期会话能力。
- 上传分片和最大请求体实现方式。

## 下一步

1. 用 OpenAPI 生成或手写 Web API handler 的 contract tests。
2. 为四个 JSON Schema 增加 schema validator 测试。
3. 为 MCSManager v10.18.3 建立真实响应 fixture。
4. 实现 Cucumber World 对业务 API 的调用驱动。
5. 在测试 MCSManager 上运行 DEPLOY、CONTROL 和 RECOVERY 场景。
