# MC AI Manager v0.1 Demo 快速启动

## 环境

- Node.js 24+
- npm 11+

## 启动

在项目根目录执行两个终端命令：

```bash
npm run dev:api
npm run dev:web
```

然后打开：

<http://127.0.0.1:5174>

API 地址：<http://127.0.0.1:8787>

## 演示路径

### 服务器管理

1. 打开“服务器”页。
2. 查看三台演示实例的运行、停止和异常状态。
3. 对“纸片生存服”点击“安全重启”。
4. 观察按钮反馈和任务状态变化。
5. 对“原版建造服”点击“启动服务器”。
6. 等待任务完成后刷新实例状态。

### AI 部署

1. 打开“AI 管家”。
2. 选择任意 ZIP 文件；文件名只用于演示，Demo 不会读取或解压。
3. 修改服务器名称。
4. 查看并选择“允许离线登录”或“仅允许正版验证”。
5. 勾选 Minecraft EULA。
6. 点击“创建并启动实例”。
7. 观察任务阶段和进度轮询。
8. 任务成功后回到服务器页查看新实例。

### EULA 阻断

不勾选 EULA 直接点击创建，系统应阻止请求并显示原因。

### 操作记录

打开“操作记录”，查看 Demo 中的任务/设计说明。正式审计数据将在后续接入 SQLite 和 Audit API 后展示。

## 当前 Demo 的诚实边界

这是可运行的前后端业务 Demo，不连接真实 MCSManager、DeepSeek Harness、文件系统或 Java APT。上传、创建实例和控制操作使用可重复的 Demo 状态模拟；不会修改主机文件、启动 MC 进程或删除任何数据。

真实系统接入顺序仍为：

```text
Demo API
→ SQLite TaskRepository
→ MCSManager v10.18.3 contract suite
→ 真实 ZIP/Probe
→ Agent Tool Adapter
→ DeepSeek Harness
```
