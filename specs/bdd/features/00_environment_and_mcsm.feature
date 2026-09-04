@p0 @L1 @requires_mcsm
Feature: 环境与 MCSManager 可用性
  为了让部署结果可归因
  管理员需要在写入前确认受支持环境和 MCSManager 状态

  Rule: 只有认证的环境和 MCSManager 版本可以执行自动写操作

    @p0 @BDD-ENV-001 @GS-MCS-001
    Scenario: 受支持环境和认证版本通过预检
      Given 主机运行 Ubuntu Server 24.04 LTS、x86_64 和本地 ext4 或 xfs 文件系统
      And MCSManager 版本为已认证的 v10.18.3
      And MCSManager API 认证、工作区读写、上传临时目录、磁盘、Java 清单和审计写入均可用
      And MCSManager 与 Minecraft 子进程均不以 root 身份运行
      When 管理员执行环境检查
      Then 环境检查结果为可进行自动部署
      And 结果列出已验证的环境事实和检测时间

    @p0 @BDD-ENV-002 @GS-MCS-010
    Scenario: 未认证的同版本线 MCSManager 只允许只读检测
      Given MCSManager 版本属于 v10.18.x 但未进入认证清单
      When 管理员执行环境检查
      Then 环境检查结果为版本待认证
      And 自动写操作被阻断
      And 系统未创建实例、未修改文件且未发送实例控制请求

    @p0 @BDD-ENV-003 @GS-MCS-009
    Scenario: 不受支持的 MCSManager 版本阻止自动写操作
      Given MCSManager 版本不属于 v10.18.x
      When 管理员请求导入服务端
      Then 任务状态为 Failed
      And 结果说明当前版本不在 P0 自动支持范围
      And 系统未创建实例且未修改目标工作目录

    @p0 @BDD-ENV-004 @GS-MCS-004
    Scenario: MCSManager 离线时停止写任务
      Given MCSManager 不可连接
      When 管理员请求创建、启动或删除实例
      Then 任务状态为 Failed
      And 请求不产生写入副作用
      And 结果记录 MCSManager 连接异常

    @p0 @BDD-ENV-005 @GS-MCS-003
    Scenario: MCSManager API 超时时进入需要核对
      Given 一个环境接入检查任务已持久化并已发送 MCSManager 状态查询
      And 请求结果在当前连接超时策略窗口内未返回
      When 系统到达该请求的超时条件
      Then 任务状态为 RecoveryRequired
      And 任务保留请求标识和已知连接事实
      And 系统未发送自动写操作

  Rule: 不受支持的环境在预检阶段阻断写操作

    @p0 @BDD-ENV-006 @GS-MCS-001
    Scenario Outline: 不受支持的主机环境阻断自动写操作
      Given 主机环境具有 <不支持条件>
      When 管理员请求导入服务端
      Then 环境检查结果为不受支持
      And 自动写操作被阻断
      And 系统未创建实例、未修改目标工作目录且未发送实例控制请求

      Examples:
        | case_id | sample_id | 不支持条件 |
        | ENV-006-A | GS-MCS-001 | 非 Ubuntu Server 24.04 LTS |
        | ENV-006-B | GS-MCS-001 | 非 x86_64 架构 |
        | ENV-006-C | GS-MCS-001 | 实例或临时目录不位于本地 ext4 或 xfs 文件系统 |
        | ENV-006-D | GS-MCS-001 | Minecraft 子进程以 root 身份运行 |
