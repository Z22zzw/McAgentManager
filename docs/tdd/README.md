# TDD 设计文档

TDD/领域工程师主入口：

- [BDD → TDD 模块拆分](TDD-MODULE-MAP.md)
- [TDD T1 报告](TDD-T1-REPORT.md)
- [TDD T2 报告](TDD-T2-REPORT.md)
- [TDD T3 报告](TDD-T3-REPORT.md)
- [TDD T4 报告](TDD-T4-REPORT.md)

代码入口：

- `src/domain/`：确定性策略和状态机。
- `src/persistence/`：任务和步骤持久化。
- `src/adapters/`：MCSManager 和 HTTP 适配器。
- `src/probes/`：文件、进程、端口和 Java 事实探针。
- `src/application/`：任务编排。
- `tests/`：Vitest 单元和编排测试。

完成标准：先写失败测试，再实现最小行为；外部状态必须用独立 Probe 或契约 fake 验证。
