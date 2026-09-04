# 前端重置与原型增量基线

> 状态：完成  
> 日期：2026-08-30

## 变更

- 删除旧的 React/Vite 前端目录 `web/`。
- 删除旧的生成目录 `dist/web/`。
- 保留 `docs/prototype/` 作为唯一前端 UI 基线。
- 根目录 `vite.config.ts` 直接以 `docs/prototype/` 作为 Vite root。
- `npm run dev:web` 和 `npm run build:web` 均改为运行原型入口。

## 当前前端边界

原型现在是 Demo 的实际前端入口，包含：

- 服务器首页
- AI 管家 ZIP 部署演示
- 登录方式与 EULA 卡片
- 任务进度
- Java 失败诊断
- 磁盘清理与无备份测试实例删除
- 操作记录
- 高级管理入口
- 断线后需要核对的任务状态

这些流程仍是浏览器内模拟状态，不会连接真实服务器。

## 增量设计规则

后续所有前端设计必须直接在 `docs/prototype/index.html` 上增量进行，并遵循：

1. 先保留功能区域和状态，再改变视觉。
2. 原型中已有的业务文案和危险操作层级不能无理由删除。
3. 每次视觉改动都要复查空状态、失败、等待、执行中和成功状态。
4. 正式组件化时，以原型交互为功能参考，不复制其实现方式。
5. 继续使用 `frontend-design` skill 做正式视觉迭代，但原型文档中的“非视觉规范”声明保持有效，直到视觉系统单独冻结。

## 验证

```text
npm run typecheck   passed
npm test            7 files / 61 tests passed
npm run build:web   passed
http://127.0.0.1:5174/ served docs/prototype/index.html
```
