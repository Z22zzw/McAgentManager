# P0 部署边界

- Ubuntu Server 24.04 LTS、x86_64。
- 本地 ext4/xfs；单机、单租户、单管理员。
- 默认工作区 `/home/mc-agent/`。
- MCSManager v10.18.3 首个认证版本；未认证版本只读。
- MCSManager/MC 进程不得以 root 运行；游戏进程使用低权限 `mc-runner`。
- 控制面可通过操作网关执行必要主机动作；游戏内容不能继承控制面权限。
- Java 17/21 只通过已配置、签名有效的 Ubuntu 官方 APT 通道安装。
- 公网 HTTPS、反向代理、防火墙、端口映射由部署人员负责；产品只验证本机端口。
- 不把 API Token、模型密钥或长期 MCSManager 凭证放入 URL、实例环境变量或普通审计视图。
