@p0 @L1 @requires_mcsm
Feature: 登录方式与 Minecraft EULA 确认
  为了让管理员在理解后果后完成新实例的必要配置
  系统需要显式保存登录方式选择，并把 EULA 确认与实际写入分开验证

  Background:
    Given 上传的完整服务端已通过安全解压、识别和运行时预检
    And 任务拥有尚未注册到 MCSManager 的隔离工作目录

  Rule: 新实例的登录方式必须显式提交并以实际配置回读为准

    @p0 @BDD-AUTH-001 @GS-AUTH-001
    Scenario: 默认离线登录必须由管理员显式提交
      Given 新实例的登录方式默认选择为允许离线登录
      And 管理员已获得名称冒用、OP、白名单和权限插件风险说明
      When 管理员提交允许离线登录选择
      Then 系统记录问题标识、文案版本、选择和操作者
      And 系统记录与上传配置的差异
      And 系统写入对应登录模式并回读实际配置
      And 操作记录包含选择及实际回读结果
      And 任务状态为 Succeeded

    @p0 @BDD-AUTH-002 @GS-AUTH-002
    Scenario: 管理员选择正版验证时写入并回读实际模式
      Given 新实例可选择正版验证
      When 管理员提交正版验证选择
      Then 系统写入对应登录模式并回读实际配置
      And 操作记录包含选择及实际回读结果
      And 任务状态为 Succeeded

    @p0 @BDD-AUTH-003 @GS-AUTH-003
    Scenario: 已注册实例的离线模式按实际配置展示
      Given 已注册 MCSManager 实例的实际配置为离线登录
      When 管理员读取该实例状态
      Then 实例状态包含离线登录模式
      And 系统未因读取而改写实例配置
      And 任务状态为 Succeeded

  Rule: EULA 只能由当前管理员独立确认后写入，并且写入必须可验证

    @p0 @BDD-EULA-001 @GS-AUTH-004
    Scenario: 管理员尚未确认 EULA 时任务等待确认
      Given 系统已提供 Minecraft EULA 官方链接和接受说明
      When 管理员暂不提交 EULA 选择
      Then 任务状态为 WaitingUser
      And 系统未写入 eula=true
      And 系统未注册 MCSManager 实例且未启动进程

    @p0 @BDD-EULA-002 @GS-AUTH-004
    Scenario: 管理员明确取消 EULA 确认时任务取消
      Given 系统已提供 Minecraft EULA 官方链接和接受说明
      When 管理员明确取消 EULA 确认
      Then 任务状态为 Cancelled
      And 系统未写入 eula=true
      And 系统未注册 MCSManager 实例且未启动进程

    @p0 @BDD-EULA-003 @GS-AUTH-005
    Scenario: EULA 写入或回读失败时停止部署
      Given 管理员已接受 EULA
      And 系统无法完成 eula.txt 写入或无法回读 eula=true
      When 系统验证 EULA 写入结果
      Then 任务状态为 Failed
      And 工作目录中不存在部分可见的 EULA 接受配置
      And 系统未注册 MCSManager 实例且未启动进程
      And 操作记录包含失败事实

    @p0 @BDD-EULA-004 @GS-AUTH-007
    Scenario: ZIP 内已有 eula=true 不能替代当前确认
      Given 上传的 ZIP 内已有 eula=true
      When 系统进入新实例的 EULA 阶段
      Then 系统记录该文件中的检测事实
      And 任务状态为 WaitingUser
      And 系统未注册实例且未启动进程

    @p0 @BDD-EULA-005 @GS-AUTH-006 @GS-TASK-012
    Scenario: EULA 确认上下文失效后重新等待确认
      Given 管理员已完成一次 EULA 确认
      And 确认后目标核心、目标工作目录或部署影响发生变化
      When 系统准备写入 EULA
      Then 旧确认不再可用于写入 eula.txt
      And 任务状态为 WaitingUser
      And 系统在新确认前不注册实例且不启动进程

    @p0 @BDD-EULA-006 @GS-TASK-002
    Scenario: 等待 EULA 时浏览器关闭后恢复等待状态
      Given 任务正在等待管理员接受 EULA
      When 浏览器关闭并在之后重新连接
      Then 任务状态为 WaitingUser
      And 系统未在断线期间写入 eula.txt
      And 系统未注册实例且未启动进程

    @p0 @BDD-EULA-007 @GS-AUTH-001
    Scenario: EULA 确认后写入结果完整可见并允许注册实例
      Given 管理员已接受 EULA
      When 系统执行 EULA 写入并回读验证
      Then 工作目录中只存在完整的 eula=true 接受配置
      And 确认记录包含官方链接、文案版本、操作者、任务、目标目录和时间
      And 系统随后可以注册 MCSManager 实例并启动
      And 任务状态为 Succeeded

    @p0 @BDD-EULA-008 @GS-AUTH-001
    Scenario: 实例注册后实例状态显示已回读的离线登录模式
      Given 管理员已提交允许离线登录选择且实际配置回读为离线登录
      And EULA 写入已验证
      And MCSManager 已注册该实例
      When 管理员读取该实例状态
      Then 实例状态包含离线登录模式
      And 实例状态来源于已回读的实际配置
      And 任务状态为 Succeeded
