# 架构文档

## 组件职责

```text
Web UI
  → MC AI Manager 业务 API
    → 持久化任务编排器
      → 操作网关
        → MCSManager Adapter / Host Probes / 文件服务
```

- Web：展示实例、任务、确认卡片和审计结果。
- 业务 API：认证、资源授权、任务创建和状态查询。
- 任务编排器：持久化步骤、幂等、锁、恢复和终态。
- 操作网关：风险、作用域、参数和审计执行前检查。
- Adapter：将内部领域模型映射到 MCSManager。
- Probe：读取主机事实，不接受模型陈述作为事实。

## 架构阶段

当前处于 T5 接口契约设计完成后、真实 MCSManager 联调前。代码实现入口见项目根目录 `src/`；文档契约见 `docs/api/`。
