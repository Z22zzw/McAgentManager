@p0 @L1 @requires_mcsm
Feature: 磁盘清理与永久删除

  Rule: 清理按风险从低到高进行，任何实例删除都必须绑定精确对象与独立确认

    Background:
      Given 当前操作者已登录且磁盘可用空间低于安全阈值
      And 系统已计算可清理对象、预计释放空间和每个对象的风险级别

    @p0 @BDD-DISK-001 @GS-DISK-001
    Scenario: 优先清理失败上传并重新测量磁盘
      Given 存在任务专属的不完整上传文件
      When 操作者选择清理低风险对象
      Then 系统仅清理该任务专属的不完整上传文件
      And 系统记录预计释放空间与实际释放空间
      And 系统重新测量剩余磁盘空间后展示结果
      And 清理任务终态为Succeeded

    @p0 @BDD-DISK-002 @GS-DISK-002
    Scenario: 清理可再生成缓存时报告实际释放空间
      Given 存在可再生成的安装缓存
      When 操作者选择清理该缓存
      Then 系统只清理所展示的缓存对象
      And 系统记录实际释放空间与清理结果
      And 系统重新检查磁盘，而不以清理动作返回成功作为完成
      And 清理任务终态为Succeeded

    @p0 @BDD-DISK-003 @GS-DISK-003
    Scenario: 清理日志时仅删除当前生效保留策略之外的日志
      Given 存在当前生效日志保留策略之内和之外的日志
      When 操作者选择清理超出当前生效保留策略的日志
      Then 系统只删除当前生效日志保留策略之外的日志
      And 系统不将实例、世界或备份归类为垃圾文件
      And 系统展示清理后的实际磁盘状态
      And 清理任务终态为Succeeded

    @p0 @BDD-DISK-004 @GS-DISK-004
    Scenario: 低风险清理仍不足时不自动升级为实例删除
      Given 低风险清理完成后剩余空间仍不足
      When 系统展示下一步处理选项
      Then 系统提供备份归档或明确指定实例删除等后续选项
      And 系统不因磁盘仍不足自动删除实例、世界或备份
      And 清理任务终态为Partial

    @p0 @destructive @BDD-DEL-001 @GS-DEL-001
    Scenario: 删除已停止且无备份的测试实例需要精确确认
      Given “测试服”已停止且没有可恢复备份
      And 系统已生成绑定不可变实例标识“instance-test-001”的删除操作“operation-delete-001”
      And 该操作绑定删除清单版本“v1”和删除清单哈希“sha256:delete-list-001”
      And 该操作绑定当前操作者、确认文案版本“delete-warning-v1”和未过期的确认有效期
      And 系统已展示删除清单、占用空间和不可恢复说明
      When 当前操作者输入完整实例名称作为人类复核并确认该绑定操作
      Then 系统仅删除“instance-test-001”对应且与“sha256:delete-list-001”一致的资源
      And 系统不强制创建备份
      And 系统验证实例定义与目标目录已删除并重新测量磁盘
      And 删除任务终态为Succeeded

    @p0 @destructive @BDD-DEL-002 @GS-DEL-002
    Scenario: 删除运行中实例前先正常停止并验证退出
      Given “测试服”正在运行且已获得该实例的有效永久删除确认
      When 系统执行该永久删除操作
      Then 系统先请求正常停止“测试服”
      And 系统确认进程已退出后删除已确认的资源
      And 系统记录停止、删除和磁盘复测的实际结果
      And 删除任务终态为Succeeded

    @p0 @destructive @BDD-DEL-003 @GS-DEL-003
    Scenario: 正常停止超时时不自动强制终止
      Given 正在删除的实例在正常停止期限内未确认退出
      When 系统处理停止超时
      Then 系统不自动强制终止实例
      And 系统不删除实例
      And 删除任务终态为Failed
      And 操作者可查看停止超时的事实证据

    @p0 @destructive @BDD-DEL-004 @GS-DEL-004
    Scenario: 相似实例名称不会扩大删除范围
      Given 存在名称相似的“测试服”和“测试服-副本”
      And 有效删除确认绑定“测试服”的不可变实例标识与删除清单
      When 系统执行该绑定删除操作
      Then 系统仅按确认绑定的不可变实例标识生成和执行删除清单
      And “测试服-副本”的实例定义和目录保持不变
      And 删除任务终态为Succeeded

    @p0 @destructive @BDD-DEL-005 @GS-DEL-005
    Scenario: 删除清单发现工作区外软链接时阻止删除
      Given 待删除实例目录包含指向工作区外的软链接
      When 系统生成删除前安全检查结果
      Then 系统不执行永久删除
      And 系统不删除工作区外目标
      And 删除任务终态为Failed
      And 操作者可查看风险范围的事实证据

    @p0 @destructive @BDD-DEL-006 @GS-DEL-006
    Scenario: 删除对象是挂载点或共享目录时普通删除失败且无副作用
      Given 待删除实例目录是挂载点或共享目录
      When 操作者请求执行普通实例删除
      Then 系统不删除实例定义、目录、世界或共享数据
      And 删除任务终态为Failed
      And 操作者可查看该对象不能按普通删除处理的事实证据

    @p0 @destructive @BDD-DEL-007 @GS-DEL-007
    Scenario: 删除后空间未按预计释放时如实报告
      Given 实例删除已完成但实际释放空间低于预计值
      When 系统完成删除后磁盘复测
      Then 系统展示实际释放空间和当前剩余容量
      And 系统不宣称已达到预计释放空间或磁盘问题已解决
      And 删除任务终态为Partial

    @p0 @destructive @BDD-DEL-008 @GS-DEL-008
    Scenario: 审计无法写入时阻断永久删除
      Given 系统无法为永久删除写入所需审计记录
      When 操作者请求永久删除实例
      Then 系统不开始永久删除
      And 实例定义、目录和磁盘内容保持不变
      And 删除任务终态为Failed
      And 操作者可查看删除被阻断的原因
