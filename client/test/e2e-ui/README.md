# E2E UI Tests

```bash
cd client
npm install
npm run install:browsers
```

### run all test ui

```bash
npm run test:e2e-ui
```

### run spicial test 

```bash
npx playwright test test/e2e-ui/citizenEmailVerification.ui.test.ts
```

### 

```bash
npx playwright test --debug
```

### see report

```bash
npx playwright show-report
```

## 📁 test file

- `citizenEmailVerification.ui.test.ts` - 邮箱验证页面的 UI 测试
- `externalMaintainerWorkflow.ui.test.ts` - 基本导航和注册测试
- `helpers/testHelpers.ts` - 可复用的测试辅助函数


