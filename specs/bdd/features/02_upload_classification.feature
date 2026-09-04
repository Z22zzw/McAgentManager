@p0 @L0
Feature: 上传分类与部署边界
  为了避免把不适合直接运行的内容误部署为服务器
  系统需要依据可观察结构分类并在范围外输入前停止

  Background:
    Given 主机环境通过只读预检
    And 上传文件已完整到达隔离上传区

  Rule: 完整支持输入在解压后给出可用于部署的识别事实

    @p0 @BDD-CLASS-001 @GS-POS-003
    Scenario: 完整服务端被识别为可直接部署
      Given 上传的 ZIP 是 Paper 1.20.1 的完整服务端
      When 系统完成安全解压和内容识别
      Then 识别结果包含完整服务端分类、核心、游戏版本、启动入口和 Java 需求
      And 识别结果表明可以进入必要的部署确认
      And 系统尚未执行 ZIP 内的脚本
      And 任务状态为 Succeeded

  Rule: 矩阵外内容被解释并停止，且不创建实例

    @p0 @BDD-CLASS-002 @GS-NEG-001
    Scenario: 仅世界存档被识别并停止
      Given 上传的 ZIP 仅包含 Minecraft 1.20.1 世界存档
      When 系统完成内容识别
      Then 识别结果为 world-only
      And 任务状态为 Failed
      And 系统未创建实例、未注册 MCSManager 实例且未启动进程

    @p0 @BDD-CLASS-003
    Scenario Outline: 客户端或平台整合包被识别并停止
      Given 上传的 ZIP 是 <输入类型>
      And 该 ZIP 对应 <sample_id>
      When 系统完成内容识别
      Then 识别结果为 <分类>
      And 任务状态为 Failed
      And 系统未创建实例且未执行包内脚本

      Examples:
        | case_id | sample_id | 输入类型 | 分类 |
        | CLASS-003-A | GS-NEG-002 | Fabric 客户端整合包 | client-modpack |
        | CLASS-003-B | GS-NEG-003 | CurseForge manifest 整合包 | platform-modpack |

    @p0 @BDD-CLASS-004
    Scenario Outline: 需要安装器或自定义脚本的输入被识别并停止
      Given 上传的 ZIP 是 <输入类型>
      And 该 ZIP 对应 <sample_id>
      When 系统完成内容识别
      Then 识别结果为 <分类>
      And 任务状态为 Failed
      And 系统未执行该安装器或脚本
      And 系统未创建实例

      Examples:
        | case_id | sample_id | 输入类型 | 分类 |
        | CLASS-004-A | GS-NEG-004 | Forge 1.20.1 installer JAR ZIP | installer-required |
        | CLASS-004-B | GS-NEG-005 | NeoForge 1.21.1 installer JAR ZIP | installer-required |
        | CLASS-004-C | GS-NEG-006 | 依赖 install.sh 下载依赖的 ZIP | custom-installer |

    @p0 @BDD-CLASS-005
    Scenario Outline: 不在支持矩阵内的游戏版本被识别并停止
      Given 上传的 ZIP 是 <游戏版本> 的完整 Java 服务端
      And 该 ZIP 对应 <sample_id>
      When 系统完成内容识别
      Then 识别结果为 unsupported-version
      And 任务状态为 Failed
      And 系统不为该 ZIP 自动选择 Java 或启动实例

      Examples:
        | case_id | sample_id | 游戏版本 |
        | CLASS-005-A | GS-NEG-007 | 1.19.4 |
        | CLASS-005-B | GS-NEG-008 | 26.x |

    @p0 @BDD-CLASS-006
    Scenario Outline: 非 Java 单服输入被识别并停止
      Given 上传的 ZIP 是 <输入类型>
      And 该 ZIP 对应 <sample_id>
      When 系统完成内容识别
      Then 识别结果为 <分类>
      And 任务状态为 Failed
      And 系统未创建实例

      Examples:
        | case_id | sample_id | 输入类型 | 分类 |
        | CLASS-006-A | GS-NEG-009 | Bedrock Dedicated Server ZIP | unsupported-edition |
        | CLASS-006-B | GS-NEG-010 | Velocity 代理 ZIP | unsupported-proxy |

    @p0 @BDD-CLASS-007
    Scenario Outline: 无效或歧义的归档内容被拒绝部署
      Given 上传的文件是 <输入类型>
      And 该文件对应 <sample_id>
      When 系统校验格式并完成可用内容识别
      Then 识别结果为 <分类>
      And 任务状态为 Failed
      And 系统未创建实例且未启动进程

      Examples:
        | case_id | sample_id | 输入类型 | 分类 |
        | CLASS-007-A | GS-NEG-011 | 伪装为 ZIP 的 RAR 文件 | invalid-archive |
        | CLASS-007-B | GS-NEG-012 | 空 ZIP | invalid-content |
        | CLASS-007-C | GS-NEG-013 | 包含多个冲突服务端入口的 ZIP | ambiguous-entry |

  Rule: 用户取消和上传中断不触发后续处理

    @p0 @BDD-CLASS-008 @GS-TASK-011
    Scenario: 用户在等待部署选择时取消任务
      Given 系统已完成上传、解压和识别
      And 任务正在等待管理员提交部署选择
      When 管理员取消任务
      Then 任务状态为 Cancelled
      And 系统未注册 MCSManager 实例、未写入 EULA 且未启动进程
      And 操作记录说明任务在等待确认时取消

    @p0 @BDD-CLASS-009 @GS-TASK-001
    Scenario: 上传连接中断时任务失败且不进入解压阶段
      Given ZIP 正在上传
      When 上传连接中断
      Then 任务状态为 Failed
      And 系统未进入解压和内容识别阶段
      And 系统清理不完整上传分片

    @p0 @BDD-CLASS-010 @GS-TASK-011
    Scenario: 管理员取消上传时任务取消且不进入解压阶段
      Given ZIP 正在上传
      When 管理员取消上传
      Then 任务状态为 Cancelled
      And 系统未进入解压和内容识别阶段
      And 系统清理不完整上传分片
