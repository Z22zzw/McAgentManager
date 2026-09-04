@p0 @L1 @requires_apt
Feature: Java 运行时选择与受控安装
  为了让支持的服务端使用匹配且可验证的 Java 运行时
  系统需要优先复用已安装运行时，并在缺失时受控安装或安全停止

  Background:
    Given 主机运行 Ubuntu Server 24.04 LTS
    And 服务端识别已确定游戏版本和所需 Java 主版本

  Rule: 运行时选择按实例记录绝对路径，不改变系统全局默认值

    @p0 @BDD-JAVA-001
    Scenario Outline: 已安装的匹配 Java 被选中
      Given <游戏版本> 需要 Java <主版本>
      And 主机已安装可用的 OpenJDK <主版本>
      And 该环境对应 <sample_id>
      When 系统选择实例运行时
      Then 系统记录该 Java 可执行文件的绝对路径
      And 系统使用该路径执行对应服务端的最小启动预检
      And 系统未安装、卸载或替换系统全局 Java
      And 任务状态为 Succeeded

      Examples:
        | case_id | sample_id | 游戏版本 | 主版本 |
        | JAVA-001-A | GS-JAVA-001 | 1.20.1 | 17 |
        | JAVA-001-B | GS-JAVA-002 | 1.21.1 | 21 |

    @p0 @BDD-JAVA-002 @GS-JAVA-010
    Scenario: 主机存在其他 Java 时不修改其运行时
      Given 1.20.1 服务端需要 Java 17
      And 主机已安装 Java 8 或 Java 11
      And 主机同时存在可用的 Java 17
      When 系统选择实例运行时
      Then 系统为该实例记录 Java 17 的绝对路径
      And 系统未卸载 Java 8 或 Java 11
      And 系统未修改其他实例已记录的运行时路径
      And 任务状态为 Succeeded

  Rule: 缺少匹配 Java 时只使用受控的官方 APT 安装通道

    @p0 @BDD-JAVA-003
    Scenario Outline: 缺少匹配 Java 时通过官方通道安装并验证
      Given <游戏版本> 需要 Java <主版本>
      And 主机未安装可用的 Java <主版本>
      And 该环境对应 <sample_id>
      And 官方 APT 软件源、网络、磁盘、dpkg 状态和网关授权均可用
      When 系统准备该实例的运行时
      Then 系统仅使用受控的 Ubuntu 官方 APT 安装通道
      And 系统记录候选包版本、来源、任务和实际结果
      And 安装后系统解析 Java 绝对路径并验证 java -version
      And 系统未修改 APT 软件源或系统全局默认 Java
      And 任务状态为 Succeeded

      Examples:
        | case_id | sample_id | 游戏版本 | 主版本 |
        | JAVA-003-A | GS-JAVA-003 | 1.20.1 | 17 |
        | JAVA-003-B | GS-JAVA-004 | 1.21.1 | 21 |

    @p0 @BDD-JAVA-004 @GS-JAVA-005
    Scenario: APT 锁在当前等待策略窗口内释放后完成受控安装
      Given 缺少匹配 Java
      And APT 锁被其他包管理任务占用
      And APT 锁在当前 APT 锁等待策略窗口内释放
      When 系统等待锁并准备安装
      Then 系统通过受控的 Ubuntu 官方 APT 安装通道完成运行时安装
      And 操作记录包含实际等待时长
      And 系统未终止占用锁的包管理进程
      And 任务状态为 Succeeded

  Rule: 安装前置条件异常、安装失败和中断均安全停止

    @p0 @BDD-JAVA-005 @GS-JAVA-006
    Scenario: APT 锁持续占用时停止部署
      Given 缺少匹配 Java
      And APT 锁持续占用超过当前 APT 锁等待策略窗口
      When 系统准备安装 Java
      Then Java 安装不开始
      And 系统未强制终止其他包管理进程
      And 任务状态为 Failed

    @p0 @BDD-JAVA-006
    Scenario Outline: 官方源不可用或不可信时停止安装
      Given 缺少匹配 Java
      And <软件源状态>
      And 该环境对应 <sample_id>
      When 系统准备安装 Java
      Then Java 安装不开始
      And 系统未修改 APT 软件源、未添加第三方 PPA 且未执行绕过安装
      And 任务状态为 Failed

      Examples:
        | case_id | sample_id | 软件源状态 |
        | JAVA-006-A | GS-JAVA-007 | 官方源不可达 |
        | JAVA-006-B | GS-JAVA-013 | 软件源签名失效或没有候选包 |

    @p0 @BDD-JAVA-007 @GS-JAVA-008
    Scenario: 安装 Java 的磁盘预算不足时停止安装
      Given 缺少匹配 Java
      And 当前可用空间不足以满足 Java 安装预留和安全余量
      When 系统准备安装 Java
      Then Java 安装不开始
      And 系统未留下半成品安装结果
      And 任务状态为 Failed

    @p0 @BDD-JAVA-008 @GS-JAVA-009
    Scenario: 安装后版本验证失败时不启动实例
      Given 受控 Java 安装已完成
      And java -version 或最小启动预检未确认所需版本可用
      When 系统验证安装结果
      Then 系统未启动实例
      And 操作记录包含验证失败事实
      And 任务状态为 Failed

    @p0 @BDD-JAVA-009
    Scenario Outline: 网关或包管理状态不满足条件时不尝试绕过
      Given 缺少匹配 Java
      And <阻断条件>
      And 该环境对应 <sample_id>
      When 系统准备安装 Java
      Then 系统不调用交互式 sudo 或其他绕过路径
      And Java 安装不开始
      And 任务状态为 Failed

      Examples:
        | case_id | sample_id | 阻断条件 |
        | JAVA-009-A | GS-JAVA-011 | 网关没有预配置安装授权 |
        | JAVA-009-B | GS-JAVA-012 | sudo 需要密码或交互 |
        | JAVA-009-C | GS-JAVA-014 | dpkg 处于中断状态 |

    @p0 @BDD-JAVA-010 @GS-JAVA-015
    Scenario: Java 安装过程中 Host 中断后进入需要核对
      Given Java 安装任务已经持久化且安装请求已发送
      And Host 在安装过程中中断
      When Host 恢复并读取 dpkg 和目标包的实际状态
      Then 系统不因任务恢复而重复安装
      And 任务状态为 RecoveryRequired
      And 操作记录保留已知包状态和中断事实
