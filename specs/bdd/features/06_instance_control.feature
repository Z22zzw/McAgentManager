@p0 @L1 @requires_mcsm
Feature: 实例控制

  Rule: 同一实例的运行状态变更必须以实际状态为准，并且不可并发冲突

    Background:
      Given 当前操作者已登录且 MCSManager v10.18.3 已认证
      And 实例“生存服”具有不可变实例标识“instance-survival-001”

    @p0 @BDD-CTRL-001 @GS-TASK-006
    Scenario: 对已停止实例重复请求启动时合并为同一任务
      Given “生存服”已停止
      When 操作者连续两次请求启动“生存服”
      Then 系统只保留一个指向运行状态的实例控制任务
      And 该任务终态为Succeeded
      And 实例达到服务就绪、观察窗口稳定且本机端口监听
      And “生存服”的实际状态为“运行中”

    @p0 @BDD-CTRL-002 @GS-TASK-008
    Scenario: 同一实例已有写任务时拒绝冲突控制请求
      Given “生存服”正在执行改变运行状态的任务
      When 操作者请求与该任务冲突的实例控制操作
      Then 系统不并发执行第二个改变运行状态的任务
      And 后发请求的任务终态为Failed
      And 操作者可查看冲突任务标识和拒绝原因

    @p0 @BDD-CTRL-003 @GS-TASK-007
    Scenario: 重启的停止阶段失败时不自动启动
      Given “生存服”正在运行
      When 操作者请求重启且正常停止未完成
      Then 系统不继续启动“生存服”
      And 重启任务终态为Failed
      And 操作者可查看正常停止未完成的事实证据

    @p0 @BDD-CTRL-004 @GS-MCS-006
    Scenario: 启动请求响应丢失时以事实核对避免重复启动
      Given “生存服”已停止且启动请求已发送
      When 启动请求的响应无法获得
      Then 系统回查 MCSManager 状态、进程、日志和本机端口
      And 系统不因响应丢失再次发送启动请求
      And 任务终态为RecoveryRequired
      And 操作者可查看未能确认启动结果的事实证据

    @p0 @BDD-CTRL-005 @GS-MCS-007
    Scenario: MCSManager 状态与进程事实不一致时显示未知状态
      Given MCSManager 返回的实例状态与主机进程事实不一致
      When 操作者查看“生存服”状态
      Then 系统将“生存服”的实际状态标记为“未知”
      And 状态读取任务终态为Partial
      And 操作者可查看采集时间和相互冲突的事实证据

    @p0 @BDD-CTRL-006 @GS-MCS-008
    Scenario: 从高级管理返回后刷新外部修改后的运行状态
      Given 操作者已在 MCSManager 高级管理中将“生存服”的运行状态从“已停止”修改为“运行中”
      When 操作者返回 MC AI Manager
      Then 系统重新读取“生存服”的实际运行状态
      And “生存服”的实际状态为“运行中”
      And 状态刷新任务终态为Succeeded
