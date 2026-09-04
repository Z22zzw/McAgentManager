@p0 @L2 @requires_mcsm
Feature: 支持的服务端 ZIP 部署
  为了让普通管理员完成受支持服务端的首次开服
  系统需要在必要确认后创建实例并以事实验证本机就绪

  Background:
    Given 主机环境通过自动部署预检
    And MCSManager 版本已认证并可执行写操作
    And 测试端口池可用

  Rule: 支持矩阵内的完整服务端 ZIP 可以形成可验证的部署闭环

    @p0 @BDD-DEPLOY-001
    Scenario Outline: 八个正式支持组合被创建并验证为本机就绪
      Given 上传的 ZIP 是 <core> <version> 的完整可运行服务端
      And 该 ZIP 对应 <sample_id> 且要求 Java <java>
      And ZIP 的结构、入口和运行时要求符合支持矩阵
      And Java <java> 的运行时可用
      When 管理员提交实例名称并提交登录方式与 EULA 确认
      Then 系统创建一个具有唯一实例标识的 MCSManager 实例
      And 系统为实例记录 Java <java> 可执行文件的绝对路径
      And 系统启动实例并观察服务端就绪信号和致命退出情况
      And MCSManager 确认实例存在且进程正在运行
      And 实例配置的本机端口正在监听
      And 任务状态为 Succeeded
      And 结果显示服务已在本机准备完成且外网连接未验证
      And 操作记录包含任务、实例、确认、实际结果和脱敏技术证据

      Examples:
        | case_id | sample_id | core | version | java |
        | DEPLOY-001-A | GS-POS-001 | Vanilla | 1.20.1 | 17 |
        | DEPLOY-001-B | GS-POS-002 | Vanilla | 1.21.1 | 21 |
        | DEPLOY-001-C | GS-POS-003 | Paper | 1.20.1 | 17 |
        | DEPLOY-001-D | GS-POS-004 | Paper | 1.21.1 | 21 |
        | DEPLOY-001-E | GS-POS-005 | Fabric | 1.20.1 | 17 |
        | DEPLOY-001-F | GS-POS-006 | Fabric | 1.21.1 | 21 |
        | DEPLOY-001-G | GS-POS-007 | Forge | 1.20.1 | 17 |
        | DEPLOY-001-H | GS-POS-008 | NeoForge | 1.21.1 | 21 |

  Rule: 每种核心按其认证身份或启动布局形成受控部署契约

    @p0 @BDD-DEPLOY-002
    Scenario Outline: Paper 构件身份匹配固定构件后部署
      Given 上传的 ZIP 是 Paper <version> 的完整可运行服务端
      And <sample_id> 中的 Paper JAR SHA-256 为 <jar_sha256>
      And 系统识别的 Paper JAR SHA-256 为 <jar_sha256>
      When 管理员提交实例名称并提交登录方式与 EULA 确认
      Then 系统使用该 Paper JAR 作为受控启动入口
      And 系统未执行 ZIP 内的自定义启动脚本
      And 任务状态为 Succeeded
      And 实例达到本机就绪状态

      Examples:
        | case_id | sample_id | version | jar_sha256 |
        | DEPLOY-002-A | GS-POS-003 | 1.20.1 | 234a9b32098100c6fc116664d64e36ccdb58b5b649af0f80bcccb08b0255eaea |
        | DEPLOY-002-B | GS-POS-004 | 1.21.1 | 39bd8c00b9e18de91dcabd3cc3dcfa5328685a53b7187a2f63280c22e2d287b9 |

    @p0 @BDD-DEPLOY-003
    Scenario Outline: Fabric 固定 Loader 与 Launcher 布局匹配后部署
      Given 上传的 ZIP 是 Fabric <version> 的完整可运行服务端
      And <sample_id> 的 Fabric Loader 为 0.19.3 且 Installer 为 1.1.2
      And ZIP 包含唯一可识别的 Fabric Launcher 和必要 libraries
      When 管理员提交实例名称并提交登录方式与 EULA 确认
      Then 系统使用识别的 Fabric Launcher 和 libraries 构造受控启动入口
      And 系统未执行 ZIP 内的自定义启动脚本
      And 任务状态为 Succeeded
      And 实例达到本机就绪状态

      Examples:
        | case_id | sample_id | version |
        | DEPLOY-003-A | GS-POS-005 | 1.20.1 |
        | DEPLOY-003-B | GS-POS-006 | 1.21.1 |

    @p0 @BDD-DEPLOY-004
    Scenario Outline: Forge 或 NeoForge 认证参数布局匹配后部署
      Given 上传的 ZIP 是 <core> <version> 的安装完成服务端
      And <sample_id> 的认证参数文件位于 <args_path>
      And 认证参数文件的哈希与登记值一致且所有引用文件存在
      When 管理员提交实例名称并提交登录方式与 EULA 确认
      Then 系统从认证参数布局生成受控启动命令
      And 系统不直接执行 ZIP 内的启动脚本
      And 任务状态为 Succeeded
      And 实例达到本机就绪状态

      Examples:
        | case_id | sample_id | core | version | args_path |
        | DEPLOY-004-A | GS-POS-007 | Forge | 1.20.1 | libraries/net/minecraftforge/forge/1.20.1-47.4.23/unix_args.txt |
        | DEPLOY-004-B | GS-POS-008 | NeoForge | 1.21.1 | libraries/net/neoforged/neoforge/21.1.249/unix_args.txt |

  Rule: 合法结构变体保留用户内容，但不扩大执行范围

    @p0 @BDD-DEPLOY-005
    Scenario Outline: 支持的 ZIP 根目录结构被标准化识别
      Given 上传的 Paper 1.20.1 完整服务端 ZIP 使用 <结构> 结构
      And 该 ZIP 对应 <sample_id>
      When 系统完成安全解压和结构识别
      Then 系统识别唯一的服务端工作目录
      And 识别结果与直接服务端目录一致
      And 系统未因目录包装层重复创建工作目录
      And 任务状态为 Succeeded

      Examples:
        | case_id | sample_id | 结构 |
        | DEPLOY-005-A | GS-STRUCT-001 | ZIP 根目录即服务端目录 |
        | DEPLOY-005-B | GS-STRUCT-002 | 外包唯一一层同名目录 |

    @p0 @BDD-DEPLOY-006
    Scenario Outline: 支持的已有内容在部署中被保留
      Given 上传的完整服务端 ZIP 包含 <已有内容>
      And 该 ZIP 对应 <sample_id>
      And 该内容符合对应核心的目录结构
      When 管理员完成必要确认并部署实例
      Then 系统不覆盖该已有内容
      And 首次启动验证该内容已被服务端加载
      And 任务状态为 Succeeded

      Examples:
        | case_id | sample_id | 已有内容 |
        | DEPLOY-006-A | GS-STRUCT-003 | 空世界 |
        | DEPLOY-006-B | GS-STRUCT-004 | 兼容插件 |
        | DEPLOY-006-C | GS-STRUCT-005 | 兼容 Fabric 模组 |

  Rule: 端口租约、创建与启动恢复不会重复创建实例

    @p0 @BDD-DEPLOY-007 @GS-MCS-005 @GS-TASK-003
    Scenario: 创建请求响应丢失后核对到唯一实例
      Given 创建实例请求已携带幂等标识发送
      And MCSManager 已按该幂等标识注册唯一实例
      And 外部响应丢失或 Host 在请求后重启
      When 任务恢复执行
      Then 系统通过幂等标识和实例元数据核对该唯一实例
      And 系统不按实例名称猜测结果
      And 系统不创建第二个实例
      And 任务状态为 RecoveryRequired

    @p0 @BDD-DEPLOY-008 @GS-MCS-006 @GS-TASK-004
    Scenario: 启动请求响应丢失后核对到本机就绪
      Given 启动实例请求已发送且任务已持久化
      And MCSManager、进程、就绪日志和本机端口均表明实例已就绪
      And 外部响应丢失或 Host 在请求后重启
      When 任务恢复执行
      Then 系统不因恢复再次发送启动请求
      And 任务状态为 Succeeded
      And 结果显示服务已在本机准备完成

    @p0 @BDD-DEPLOY-009 @GS-MCS-003
    Scenario: 首次启动超时时进入需要核对
      Given 新建实例已收到启动请求
      And 在当前启动观察策略窗口内尚未获得本机就绪证据
      When 启动观察到达超时条件
      Then 任务状态为 RecoveryRequired
      And 结果不把启动命令已发送表述为部署成功
      And 系统保留已采集的 MCSManager 状态、进程和日志事实

    @p0 @BDD-DEPLOY-010 @GS-MCS-003
    Scenario: 端口租约冲突时不创建实例
      Given 两个部署任务同时请求同一候选端口
      And 第一个任务已持久化该端口租约
      When 第二个任务尝试取得该候选端口租约
      Then 第二个任务状态为 Failed
      And 第二个任务未写入该端口到实例配置
      And 第二个任务未创建 MCSManager 实例

    @p0 @BDD-DEPLOY-011 @GS-MCS-003
    Scenario: 实际端口绑定连续失败后停止部署
      Given 新实例已持久化一个端口租约
      And 实例在允许的端口重选次数内始终未能绑定端口
      When 系统完成最后一次实际绑定核验
      Then 任务状态为 Failed
      And 结果记录每次实际绑定失败的证据
      And 系统不宣称实例已本机就绪

    @p0 @BDD-DEPLOY-012 @GS-MCS-005
    Scenario: 实例已注册但首次启动准备失败时保留唯一资源供核对
      Given MCSManager 已按幂等标识注册唯一实例
      And 该实例的工作目录已创建且可被唯一实例标识关联
      And 首次启动前准备步骤失败
      When 系统记录该失败
      Then 任务状态为 RecoveryRequired
      And 系统不创建第二个实例或第二个工作目录
      And 系统不发送启动请求
      And 结果保留唯一实例标识、工作目录和失败证据供核对
