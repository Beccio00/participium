# E2E UI Tests

这些测试使用 Playwright 来测试前端用户界面的交互和导航。

## 🎯 测试范围

这些 UI 测试**只**关注前端界面元素和用户交互：

- ✅ 页面导航和 URL 跳转
- ✅ 表单元素的存在性和可见性
- ✅ 基本的用户交互（点击、输入、提交）
- ✅ UI 组件的渲染和样式
- ✅ 客户端路由

## ❌ 不在范围内

以下测试**不应该**在这里进行，而应该在后端 E2E 测试中：

- ❌ 验证码验证逻辑
- ❌ 用户认证和授权
- ❌ 多用户角色交互
- ❌ 完整的业务流程
- ❌ 数据库操作
- ❌ 邮件发送验证
- ❌ API 错误处理

这些测试应该在 `server/test/e2e/` 中进行，那里可以完整控制后端状态。

## 🚀 运行测试

### 首次设置

```bash
cd client
npm install
npm run install:browsers
```

### 运行所有 UI 测试

```bash
npm run test:e2e-ui
```

### 运行特定测试文件

```bash
npx playwright test test/e2e-ui/citizenEmailVerification.ui.test.ts
```

### 以调试模式运行

```bash
npx playwright test --debug
```

### 查看测试报告

```bash
npx playwright show-report
```

## 📁 测试文件

- `citizenEmailVerification.ui.test.ts` - 邮箱验证页面的 UI 测试
- `externalMaintainerWorkflow.ui.test.ts` - 基本导航和注册测试
- `helpers/testHelpers.ts` - 可复用的测试辅助函数

## ⚡ 性能

这些简化的 UI 测试应该在 **< 10 秒** 内完成。

如果测试变慢：
1. 确保开发服务器正在运行 (`npm run dev`)
2. 检查网络连接
3. 考虑使用 `--workers=1` 来避免并发问题

## 📝 测试策略

### UI 测试（这里）
- 快速、专注于前端
- 不依赖后端业务逻辑
- 测试用户能看到和交互的内容

### 后端 E2E 测试（`server/test/e2e/`）
- 测试完整的业务流程
- 包含数据库操作
- 验证 API 响应和错误处理
- 测试多用户场景

这种分离使得测试更快、更稳定、更易维护。
