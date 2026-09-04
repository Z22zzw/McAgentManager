@p0 @L1 @requires_mcsm
Feature: 任务中断与恢复

  Rule: 中断后的任务先核对外部事实，再安全续作或转入恢复核对

    Background:
      Given 当前操作者已登录且任务具有唯一任务标识、步骤标识和幂等键
      And 操作记录包含已执行动作及其事实结果

    @p0 @BDD-REC-001 @GS-TASK-001
    Scenario: 浏览器在上传后关闭时终止未完成上传
      Given 上传任务已接收文件但浏览器连接即将关闭
      When 浏览器关闭
      Then Host 端保留任务状态供操作者重新进入后查看
      And 未完成上传不会进入解压阶段
      And 不完整上传内容按清理规则处理并记录结果
      And 上传任务终态为Failed

    @p0 @BDD-REC-002 @GS-TASK-002
    Scenario: 浏览器在等待 EULA 确认时关闭后恢复待确认任务
      Given 部署任务正在等待操作者确认 Minecraft EULA
      When 浏览器关闭后操作者重新进入任务
      Then 系统恢复同一项待确认问题
      And 系统未写入“eula=true”
      And 系统未注册 MCSManager 实例且未启动服务端
      And 部署任务终态为Partial

    @p0 @BDD-REC-003 @GS-TASK-003
    Scenario: Host 在创建实例请求后重启时转入创建结果核对
      Given 创建实例请求已发出但 Host 在收到响应前重启
      When Host 恢复并处理该任务
      Then 系统通过幂等标识和实例元数据核对创建结果
      And 系统不按实例名称猜测结果且不重复创建实例
      And 任务终态为RecoveryRequired
      And 操作者可查看尚待核对的创建结果事实

    @p0 @BDD-REC-004 @GS-TASK-004
    Scenario: Host 在启动请求后重启时验证实例已本机就绪
      Given 启动请求已发出且 Host 在确认最终状态前重启
      And Host 恢复后 MCSManager、进程、就绪日志和本机端口均确认实例已就绪
      When Host 恢复并处理该任务
      Then 系统不重复发送启动请求
      And 系统记录 MCSManager、进程、日志和本机端口事实
      And 启动任务终态为Succeeded
      And 任务结果为“服务已在本机准备完成”

    @p0 @BDD-REC-005 @GS-TASK-005
    Scenario: Host 在永久删除过程中重启时进入需要核对
      Given 已获得针对单一删除操作的有效永久删除确认
      And 删除任务在执行期间 Host 重启
      When Host 恢复并处理该任务
      Then 系统核对实例定义、删除清单和目标目录实际状态
      And 系统不自动重放删除
      And 删除任务终态为RecoveryRequired
      And 操作者可查看已确认与仍无法确认的范围

    @p0 @BDD-REC-006 @GS-TASK-012
    Scenario: 确认后目标状态变化使旧确认失效
      Given 操作者已确认某项绑定具体目标和影响的破坏性操作
      When 目标状态或受影响清单发生变化
      Then 旧确认立即失效
      And 系统重新展示当前对象、影响和恢复能力供操作者确认
      And 系统在新确认前不执行该破坏性操作
      And 原任务终态为Cancelled

    @p0 @BDD-REC-007 @GS-MCS-003
    Scenario: MCSManager 超时后任务进入恢复核对状态
      Given 写操作调用 MCSManager 后超过预期响应时间
      When 系统处理该超时
      Then 任务终态为RecoveryRequired
      And 页面不把超时陈述为实例已经成功或已经失败的事实
      And 后续状态以重新读取的 MCSManager 与主机事实为准
