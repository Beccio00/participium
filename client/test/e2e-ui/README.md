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

- `citizenEmailVerification.ui.test.ts` - Email verification page UI tests
- `externalMaintainerWorkflow.ui.test.ts` - Basic navigation and registration tests
- `unregisteredUserMapView.ui.test.ts` - Unregistered user map view tests
- `helpers/testHelpers.ts` - Reusable test helper functions


