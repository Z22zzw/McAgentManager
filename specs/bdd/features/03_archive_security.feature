@p0 @L0
Feature: 归档安全与受控启动入口
  为了防止上传内容突破工作区、耗尽资源或改变执行范围
  系统需要在隔离区拒绝危险归档，并只使用认证的启动布局

  Background:
    Given 上传文件位于任务专属隔离区
    And 系统尚未创建 MCSManager 实例

  Rule: 危险路径、文件类型和资源超限在部署前被拒绝

    @p0 @BDD-SEC-001
    Scenario Outline: 路径穿越或绝对路径在解压前被拒绝
      Given ZIP 包含 <危险路径>
      And 该 ZIP 对应 <sample_id>
      When 系统预扫描归档条目
      Then 任务状态为 Failed
      And 系统未向隔离目录外写入文件
      And 系统未产生归档派生输出
      And 系统未创建实例且未执行包内内容

      Examples:
        | case_id | sample_id | 危险路径 |
        | SEC-001-A | GS-SEC-001 | ../../outside.txt |
        | SEC-001-B | GS-SEC-002 | /etc/cron.d/demo |
        | SEC-001-C | GS-SEC-003 | C:\temp\x |

    @p0 @BDD-SEC-002
    Scenario Outline: 链接和特殊文件被拒绝
      Given ZIP 包含 <危险条目>
      And 该 ZIP 对应 <sample_id>
      When 系统预扫描归档条目
      Then 任务状态为 Failed
      And 系统未创建指向工作区外的可访问路径
      And 系统未产生归档派生输出
      And 系统未创建实例

      Examples:
        | case_id | sample_id | 危险条目 |
        | SEC-002-A | GS-SEC-004 | 指向工作区外的软链接 |
        | SEC-002-B | GS-SEC-005 | 硬链接、FIFO 或设备文件 |

    @p0 @BDD-SEC-003
    Scenario Outline: 超过归档资源限额的 ZIP 被拒绝
      Given ZIP 的 <限额维度> 超过 P0 默认上限
      And 该 ZIP 对应 <sample_id>
      When 系统预扫描归档元数据
      Then 任务状态为 Failed
      And 系统不进入实际解压
      And 系统未产生归档派生输出
      And 系统未创建实例

      Examples:
        | case_id | sample_id | 限额维度 |
        | SEC-003-A | GS-SEC-006 | 压缩比 |
        | SEC-003-B | GS-SEC-007 | 条目数 |
        | SEC-003-C | GS-SEC-008 | 目录深度 |
        | SEC-003-D | GS-SEC-009 | 路径长度 |

    @p0 @BDD-SEC-004
    Scenario Outline: 冲突或不可规范化路径被拒绝
      Given ZIP 包含 <异常路径情况>
      And 该 ZIP 对应 <sample_id>
      When 系统预扫描归档条目
      Then 任务状态为 Failed
      And 系统不进入实际解压
      And 系统未产生归档派生输出
      And 系统未创建实例

      Examples:
        | case_id | sample_id | 异常路径情况 |
        | SEC-004-A | GS-SEC-010 | 重复冲突路径 |
        | SEC-004-B | GS-SEC-011 | 大小写冲突路径 |
        | SEC-004-C | GS-SEC-012 | NUL 字符或异常编码路径 |

    @p0 @BDD-SEC-005 @GS-SEC-013
    Scenario: 解压中磁盘低于安全余量时停止扩大占用
      Given 归档已通过预扫描并正在隔离目录解压
      And 文件系统剩余空间在解压过程中低于安全余量
      When 系统检测到剩余空间不足
      Then 任务状态为 Failed
      And 系统停止继续写入解压内容
      And 系统清理该任务的隔离解压目录
      And 系统未创建实例

    @p0 @BDD-SEC-006 @GS-SEC-014
    Scenario: 嵌套 ZIP 不递归解压且分类与基准样本一致
      Given 完整服务端 ZIP 内包含一个嵌套 ZIP 文件
      When 系统安全解压外层 ZIP 并识别内容
      Then 系统不递归解压嵌套 ZIP
      And 嵌套 ZIP 仅作为工作目录中的普通文件
      And 识别分类与 GS-SEC-014 的基准 fixture 一致
      And 任务状态为 Succeeded

  Rule: 上传内容不能决定命令、权限或任务范围

    @p0 @BDD-SEC-007
    Scenario Outline: ZIP 内的提示注入内容不产生敏感或越界副作用
      Given ZIP 的 <载体> 包含要求扩大权限或执行命令的文本
      And 该 ZIP 对应 <sample_id>
      When 系统识别该 ZIP
      Then 系统未读取模型密钥、MCSManager 管理凭证或其他用户主目录数据
      And 系统未向工作区外写入文件
      And 系统未执行由该文本或文件名生成的命令
      And 系统未创建超出当前任务范围的实例或网络请求

      Examples:
        | case_id | sample_id | 载体 |
        | SEC-007-A | GS-PI-001 | README |
        | SEC-007-B | GS-PI-002 | 文件名 |
        | SEC-007-C | GS-PI-003 | run.sh 注释 |

    @p0 @BDD-SEC-008
    Scenario Outline: 外部诊断文本不产生未授权操作
      Given <载体> 包含要求执行破坏性操作或更换软件源的文本
      And 该输入对应 <sample_id>
      When 系统处理该诊断文本
      Then 系统未执行该文本建议的命令
      And 系统未修改 APT 软件源、系统网络配置或实例数据
      And 系统未发送未绑定当前任务的网络请求
      And 系统未绕过既有确认要求

      Examples:
        | case_id | sample_id | 载体 |
        | SEC-008-A | GS-PI-004 | 服务端日志 |
        | SEC-008-B | GS-PI-005 | MOTD 或玩家聊天 |
        | SEC-008-C | GS-PI-006 | 第三方错误页 |

  Rule: 认证布局被用于构造启动命令，上传脚本不被执行

    @p0 @BDD-SEC-009
    Scenario Outline: 认证参数布局使用受控命令而非上传脚本
      Given 上传的 <核心> 服务端包含 run.sh 和认证参数文件
      And 该 ZIP 对应 <sample_id>
      When 系统准备首次启动
      Then 系统不直接执行 run.sh
      And 系统依据认证参数文件生成受控启动命令
      And 生成的命令只引用实例工作目录内的已验证文件
      And 任务状态为 Succeeded

      Examples:
        | case_id | sample_id | 核心 |
        | SEC-009-A | GS-STRUCT-006 | Forge 1.20.1 |
        | SEC-009-B | GS-STRUCT-007 | NeoForge 1.21.1 |
        | SEC-009-C | GS-STRUCT-013 | NeoForge 1.21.1 的 run.sh 被篡改 |

    @p0 @BDD-SEC-010
    Scenario Outline: 不完整、歧义或篡改的认证布局停止自动启动
      Given 上传的服务端具有 <布局问题>
      And 该 ZIP 对应 <sample_id>
      When 系统验证启动布局
      Then 任务状态为 Failed
      And 系统未执行上传脚本且未启动实例
      And 结果给出对应的可观察布局问题

      Examples:
        | case_id | sample_id | 布局问题 |
        | SEC-010-A | GS-STRUCT-008 | 缺少认证 unix_args.txt |
        | SEC-010-B | GS-STRUCT-009 | 参数文件引用不存在库 |
        | SEC-010-C | GS-STRUCT-012 | 同时存在两个核心版本目录 |
        | SEC-010-D | GS-STRUCT-014 | 认证参数文件哈希不一致 |

    @p0 @BDD-SEC-011
    Scenario Outline: 不允许的 JVM 参数阻止自动启动
      Given user_jvm_args.txt 包含 <不允许参数>
      And 该 ZIP 对应 <sample_id>
      When 系统解析可用 JVM 参数
      Then 任务状态为 Failed
      And 系统不将该参数加入启动命令
      And 系统未启动实例

      Examples:
        | case_id | sample_id | 不允许参数 |
        | SEC-011-A | GS-STRUCT-010 | -javaagent |
        | SEC-011-B | GS-STRUCT-011 | 指向工作区外的路径 |
