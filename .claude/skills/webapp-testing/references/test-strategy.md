# テスト戦略ガイド

## 概要

エイサーマッププロジェクトにおける包括的なテスト戦略です。品質保証、リグレッション防止、開発効率の向上を目的として、複数のレベルでのテストを実装します。

## テストピラミッド

```
          /\
         /E2E\        少数の重要なユーザーフロー
        /------\
       /統合テスト\    APIやデータベース連携
      /------------\
     /  単体テスト   \  ビジネスロジック、ユーティリティ
    /________________\
```

## テスト環境のセットアップ

### 必要なパッケージ

```json
// package.json
{
  "devDependencies": {
    // テストランナー
    "@jest/globals": "^29.0.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0",
    
    // React Testing Library
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    
    // E2Eテスト
    "@playwright/test": "^1.40.0",
    
    // モック
    "msw": "^2.0.0",
    
    // 型定義
    "@types/jest": "^29.0.0"
  }
}
```

### Jest設定

```javascript
// jest.config.mjs
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
  },
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],
};

export default createJestConfig(config);
```

### テスト環境設定

```javascript
// jest.setup.js
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// ポリフィル
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// 環境変数のモック
process.env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
};

// グローバルモック
global.fetch = jest.fn();
window.matchMedia = jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));
```

## 単体テスト

### ユーティリティ関数のテスト

```typescript
// lib/__tests__/date-utils.test.ts
import { formatDate, parseDate, isEventUpcoming } from '@/lib/date-utils';

describe('date-utils', () => {
  describe('formatDate', () => {
    it('should format date in Japanese format', () => {
      const date = new Date('2024-03-15T10:00:00');
      expect(formatDate(date)).toBe('2024年3月15日');
    });

    it('should handle invalid date', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });
  });

  describe('isEventUpcoming', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-03-01'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return true for future events', () => {
      const futureEvent = { date: '2024-03-15' };
      expect(isEventUpcoming(futureEvent)).toBe(true);
    });

    it('should return false for past events', () => {
      const pastEvent = { date: '2024-02-15' };
      expect(isEventUpcoming(pastEvent)).toBe(false);
    });
  });
});
```

### カスタムフックのテスト

```typescript
// hooks/__tests__/use-events.test.tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useEvents } from '@/hooks/use-events';
import { SWRConfig } from 'swr';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ dedupingInterval: 0 }}>
    {children}
  </SWRConfig>
);

describe('useEvents', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('should fetch events successfully', async () => {
    const mockEvents = [
      { id: '1', title: 'Event 1' },
      { id: '2', title: 'Event 2' },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvents,
    });

    const { result } = renderHook(() => useEvents(), { wrapper });

    await waitFor(() => {
      expect(result.current.events).toEqual(mockEvents);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });
  });

  it('should handle fetch error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    const { result } = renderHook(() => useEvents(), { wrapper });

    await waitFor(() => {
      expect(result.current.events).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeDefined();
    });
  });
});
```

## コンポーネントテスト

### プレゼンテーショナルコンポーネント

```typescript
// components/__tests__/event-card.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventCard } from '@/components/event-card';

const mockEvent = {
  id: '1',
  title: 'エイサー祭り',
  date: '2024-08-15',
  location: '那覇市',
  thumbnail: '/images/event1.jpg',
};

describe('EventCard', () => {
  it('should render event information', () => {
    render(<EventCard event={mockEvent} />);

    expect(screen.getByText('エイサー祭り')).toBeInTheDocument();
    expect(screen.getByText('2024年8月15日')).toBeInTheDocument();
    expect(screen.getByText('那覇市')).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<EventCard event={mockEvent} onClick={handleClick} />);

    await user.click(screen.getByRole('article'));

    expect(handleClick).toHaveBeenCalledWith(mockEvent.id);
  });

  it('should be keyboard accessible', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();

    render(<EventCard event={mockEvent} onClick={handleClick} />);

    await user.tab();
    await user.keyboard('{Enter}');

    expect(handleClick).toHaveBeenCalled();
  });
});
```

### インタラクティブコンポーネント

```typescript
// components/__tests__/filter-panel.test.tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterPanel } from '@/components/filter-panel';

describe('FilterPanel', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('should render all filter options', () => {
    render(<FilterPanel onChange={mockOnChange} />);

    expect(screen.getByLabelText('地域')).toBeInTheDocument();
    expect(screen.getByLabelText('日付')).toBeInTheDocument();
    expect(screen.getByLabelText('団体タイプ')).toBeInTheDocument();
  });

  it('should update filters when changed', async () => {
    const user = userEvent.setup();
    render(<FilterPanel onChange={mockOnChange} />);

    const regionSelect = screen.getByLabelText('地域');
    await user.selectOptions(regionSelect, '那覇市');

    expect(mockOnChange).toHaveBeenCalledWith({
      region: '那覇市',
      date: null,
      groupType: null,
    });
  });

  it('should clear all filters', async () => {
    const user = userEvent.setup();
    render(
      <FilterPanel 
        onChange={mockOnChange} 
        initialFilters={{ region: '那覇市' }}
      />
    );

    await user.click(screen.getByText('フィルターをクリア'));

    expect(mockOnChange).toHaveBeenCalledWith({
      region: null,
      date: null,
      groupType: null,
    });
  });
});
```

## 統合テスト

### APIルートのテスト

```typescript
// app/api/events/__tests__/route.test.ts
import { GET, POST } from '@/app/api/events/route';
import { createMockRequest } from '@/test-utils/mock-request';

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [{ id: '1', title: 'Test Event' }],
          error: null,
        })),
      })),
    })),
  })),
}));

describe('/api/events', () => {
  describe('GET', () => {
    it('should return events list', async () => {
      const request = createMockRequest('GET');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveLength(1);
      expect(data[0].title).toBe('Test Event');
    });
  });

  describe('POST', () => {
    it('should create new event', async () => {
      const request = createMockRequest('POST', {
        body: {
          title: 'New Event',
          date: '2024-08-15',
          location: '那覇市',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe('New Event');
    });

    it('should validate request body', async () => {
      const request = createMockRequest('POST', {
        body: { title: '' }, // 無効なデータ
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});
```

### Server Actionsのテスト

```typescript
// actions/__tests__/event.test.ts
import { createEvent, updateEvent, deleteEvent } from '@/actions/event';
import { createServerClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server');
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

describe('Event Actions', () => {
  const mockSupabase = {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: '1', title: 'Test Event' },
            error: null,
          })),
        })),
      })),
    })),
  };

  beforeEach(() => {
    (createServerClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('createEvent', () => {
    it('should create event with valid data', async () => {
      const formData = new FormData();
      formData.append('title', 'New Event');
      formData.append('date', '2024-08-15');
      formData.append('location', '那覇市');

      const result = await createEvent(formData);

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Test Event');
    });

    it('should validate form data', async () => {
      const formData = new FormData();
      formData.append('title', ''); // 無効

      const result = await createEvent(formData);

      expect(result.errors?.title).toBeDefined();
    });
  });
});
```

## E2Eテスト

### Playwright設定

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### ユーザーフローテスト

```typescript
// e2e/event-booking.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Event Booking Flow', () => {
  test('should complete event viewing flow', async ({ page }) => {
    // ホームページにアクセス
    await page.goto('/');
    
    // イベント一覧を表示
    await page.click('text=日程');
    await expect(page).toHaveURL('/schedule');
    
    // イベントカードが表示されることを確認
    const eventCard = page.locator('[data-testid="event-card"]').first();
    await expect(eventCard).toBeVisible();
    
    // イベント詳細ページへ遷移
    await eventCard.click();
    await expect(page).toHaveURL(/\/events\/.+/);
    
    // 詳細情報が表示されることを確認
    await expect(page.locator('h1')).toContainText('エイサー');
    await expect(page.locator('[data-testid="event-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="event-location"]')).toBeVisible();
  });

  test('should filter events by region', async ({ page }) => {
    await page.goto('/schedule');
    
    // フィルターパネルを開く
    await page.click('text=フィルター');
    
    // 地域を選択
    await page.selectOption('[name="region"]', '那覇市');
    
    // フィルターが適用されることを確認
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(3);
    await expect(page.locator('[data-testid="event-location"]')).toContainText(['那覇市']);
  });
});
```

### アクセシビリティテスト

```typescript
// e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
    
    // ホームページ
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
    
    // イベント一覧
    await page.goto('/schedule');
    await checkA11y(page);
    
    // 団体一覧
    await page.goto('/groups');
    await checkA11y(page);
  });

  test('should be navigable with keyboard', async ({ page }) => {
    await page.goto('/');
    
    // Tabキーでナビゲーション
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('href', '/');
    
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toHaveAttribute('href', '/schedule');
    
    // Enterキーで遷移
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/schedule');
  });
});
```

## モックとテストデータ

### MSWによるAPIモック

```typescript
// mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  // イベント一覧
  http.get('/api/events', () => {
    return HttpResponse.json([
      {
        id: '1',
        title: 'エイサー祭り',
        date: '2024-08-15',
        location: '那覇市',
      },
      {
        id: '2',
        title: '青年エイサー大会',
        date: '2024-08-20',
        location: '沖縄市',
      },
    ]);
  }),

  // イベント詳細
  http.get('/api/events/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      title: 'エイサー祭り',
      date: '2024-08-15',
      location: '那覇市',
      description: '伝統的なエイサー演舞',
    });
  }),

  // エラーケース
  http.get('/api/events/error', () => {
    return HttpResponse.error();
  }),
];
```

### テストデータファクトリー

```typescript
// test-utils/factories.ts
import { faker } from '@faker-js/faker/locale/ja';

export const createMockEvent = (overrides = {}) => ({
  id: faker.string.uuid(),
  title: faker.company.name() + 'エイサー祭り',
  date: faker.date.future().toISOString().split('T')[0],
  location: faker.location.city(),
  lat: faker.location.latitude(),
  lng: faker.location.longitude(),
  ...overrides,
});

export const createMockGroup = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.company.name() + '青年会',
  type: faker.helpers.arrayElement(['traditional', 'creative']),
  region: faker.location.state(),
  area: faker.location.city(),
  memberCount: faker.number.int({ min: 10, max: 50 }),
  ...overrides,
});
```

## CI/CDでのテスト実行

### GitHub Actions設定

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      
      - name: Run integration tests
        run: npm run test:integration
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
      
      - name: Run E2E tests
        run: |
          npx playwright install --with-deps
          npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            coverage/
            playwright-report/
```

## テストのベストプラクティス

### 1. AAA パターン

```typescript
test('should calculate total price', () => {
  // Arrange（準備）
  const items = [
    { price: 1000, quantity: 2 },
    { price: 500, quantity: 3 },
  ];

  // Act（実行）
  const total = calculateTotal(items);

  // Assert（検証）
  expect(total).toBe(3500);
});
```

### 2. データ駆動テスト

```typescript
describe('formatCurrency', () => {
  test.each([
    [1000, '¥1,000'],
    [10000, '¥10,000'],
    [0, '¥0'],
    [-500, '-¥500'],
  ])('formats %i as %s', (input, expected) => {
    expect(formatCurrency(input)).toBe(expected);
  });
});
```

### 3. エラーケースのテスト

```typescript
test('should handle API errors gracefully', async () => {
  // APIエラーをモック
  server.use(
    http.get('/api/events', () => {
      return HttpResponse.error();
    })
  );

  render(<EventList />);

  await waitFor(() => {
    expect(screen.getByText('データの読み込みに失敗しました')).toBeInTheDocument();
  });
});
```

## チェックリスト

### テストカバレッジ
- [ ] ビジネスロジックの単体テスト（カバレッジ80%以上）
- [ ] UIコンポーネントのテスト
- [ ] API/Server Actionsの統合テスト
- [ ] 主要なユーザーフローのE2Eテスト

### テスト品質
- [ ] エッジケースをカバー
- [ ] エラーケースをテスト
- [ ] アクセシビリティテスト
- [ ] パフォーマンステスト

### CI/CD
- [ ] 自動テスト実行
- [ ] カバレッジレポート
- [ ] テスト結果の可視化
- [ ] PRでのテスト必須化