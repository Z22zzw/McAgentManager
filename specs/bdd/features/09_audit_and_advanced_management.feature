@p0 @L1 @requires_mcsm
Feature: 审计与高级管理

  Rule: 写操作必须可追踪，高级管理返回后必须以外部事实重新对账

    Background:
      Given 当前操作者已登录
      And “生存服”具有不可变实例标识“instance-survival-001”

    @p0 @BDD-AUDIT-001 @GS-POS-003
    Scenario: 成功写操作提供玩家摘要和技术证据
      Given 操作者完成对“生存服”的一次受支持部署或实例控制写操作
      When 操作者查看该操作记录
      Then 操作者可查看完成内容、目标实例、当前状态和下一步建议的玩家可读摘要
      And 技术证据包含目标范围、执行动作、实际结果和脱敏信息
      And 记录包含操作者、时间、用户确认内容和可恢复性说明
      And 审计查询任务终态为Succeeded

    @p0 @BDD-AUDIT-002 @GS-MCS-002
    Scenario: MCSManager 认证失效时停止写操作并留下可追踪结果
      Given MCSManager 会话或认证已失效
      When 操作者发起实例写操作
      Then 系统不执行该写操作
      And 操作者可查看需要重新认证的原因
      And 操作记录保留请求目标、阻断原因和未发生的影响
      And 写操作任务终态为Failed

    @p0 @BDD-ADV-001 @GS-MCS-008
    Scenario: 高级管理入口安全地指向对应实例且不暴露长期凭证
      Given “生存服”存在对应的 MCSManager 实例
      When 操作者请求打开“生存服”的高级管理资源
      Then 系统提供指向该实例的高级管理资源
      And 系统不向操作者暴露长期 MCSManager 管理员凭证
      And 高级管理访问任务终态为Succeeded

    @p0 @BDD-ADV-002 @GS-MCS-008
    Scenario: 高级管理中的外部配置修改使未完成任务重新核对
      Given “生存服”存在依赖当前配置的未完成任务
      And 操作者在对应 MCSManager 高级管理中修改了该配置
      When 操作者返回 MC AI Manager
      Then 系统重新读取实际运行状态、配置摘要和工作目录元信息
      And 未完成任务在继续前重新检查前置条件
      And 未完成任务终态为RecoveryRequired
      And 操作者可查看外部修改已改变任务上下文的事实

    @p0 @BDD-AUDIT-003 @GS-DEL-008
    Scenario: 破坏性操作的审计失败不会留下未记录的副作用
      Given 操作者已发起永久删除实例
      When 该操作所需审计记录无法追加
      Then 系统在删除前终止操作
      And 系统不删除实例、世界、备份或目录
      And 永久删除任务终态为Failed
      And 操作者可查看审计阻断原因

    @p0 @BDD-AUDIT-004 @GS-TASK-006
    Scenario: 已合并控制任务的重复请求在审计中关联同一实际任务
      Given “生存服”存在一个已合并的启动控制任务
      And 多个重复启动请求均已关联到该控制任务
      When 操作者查看该控制任务的操作记录
      Then 操作记录将重复请求关联到同一个实际实例控制任务
      And 记录不显示两次独立的启动副作用
      And 审计查询任务终态为Succeeded
