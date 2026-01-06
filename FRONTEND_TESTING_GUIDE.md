# Frontend Testing Guide - Frizerino

Komprehenzivni test suite za React frontend aplikaciju.

## Setup

### Instalacija Test Framework-a

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Konfiguracija (vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
});
```

### Setup File (src/test/setup.ts)

```typescript
import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

## Test Struktura

```
frontend/src/
├── __tests__/
│   ├── components/
│   │   ├── PublicSearch.test.tsx
│   │   ├── SalonCard.test.tsx
│   │   └── BookingModal.test.tsx
│   ├── services/
│   │   └── api.test.ts
│   ├── hooks/
│   │   └── useAuth.test.ts
│   └── utils/
│       └── formatters.test.ts
└── test/
    └── setup.ts
```

## Primjeri Testova

### 1. Component Test - PublicSearch.test.tsx

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PublicSearchV2 } from '../components/Public/PublicSearchV2_Full';
import { BrowserRouter } from 'react-router-dom';

describe('PublicSearch Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders search form', () => {
    render(
      <BrowserRouter>
        <PublicSearchV2 />
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/Pretraži salone/i)).toBeInTheDocument();
  });

  it('filters salons by city', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <PublicSearchV2 />
      </BrowserRouter>
    );

    const cityInput = screen.getByPlaceholderText(/grad/i);
    await user.type(cityInput, 'Sarajevo');

    await waitFor(() => {
      expect(screen.getByText(/Sarajevo/i)).toBeInTheDocument();
    });
  });

  it('filters salons by time', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <PublicSearchV2 />
      </BrowserRouter>
    );

    const hourSelect = screen.getByDisplayValue('Sat');
    await user.selectOptions(hourSelect, '14');

    const minuteSelect = screen.getByDisplayValue('Min');
    await user.selectOptions(minuteSelect, '30');

    await waitFor(() => {
      expect(hourSelect).toHaveValue('14');
      expect(minuteSelect).toHaveValue('30');
    });
  });

  it('shows load more button when there are more results', async () => {
    render(
      <BrowserRouter>
        <PublicSearchV2 />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Učitaj još/i)).toBeInTheDocument();
    });
  });

  it('loads more results when load more button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <PublicSearchV2 />
      </BrowserRouter>
    );

    const loadMoreButton = await screen.findByText(/Učitaj još/i);
    await user.click(loadMoreButton);

    await waitFor(() => {
      expect(screen.getByText(/Učitavanje/i)).toBeInTheDocument();
    });
  });

  it('displays pagination info', async () => {
    render(
      <BrowserRouter>
        <PublicSearchV2 />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/od/i)).toBeInTheDocument();
    });
  });
});
```

### 2. Service Test - api.test.ts

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { publicAPI } from '../services/api';

describe('Public API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('searches salons', async () => {
    const response = await publicAPI.search({
      city: 'Sarajevo',
      min_rating: 4,
    });

    expect(response).toHaveProperty('salons');
    expect(response).toHaveProperty('meta');
    expect(Array.isArray(response.salons)).toBe(true);
  });

  it('filters salons by time', async () => {
    const today = new Date().toISOString().split('T')[0];
    const response = await publicAPI.search({
      date: today,
      time: '14:00',
    });

    expect(response).toHaveProperty('salons');
    expect(Array.isArray(response.salons)).toBe(true);
  });

  it('returns pagination meta', async () => {
    const response = await publicAPI.search({});

    expect(response.meta).toHaveProperty('current_page');
    expect(response.meta).toHaveProperty('last_page');
    expect(response.meta).toHaveProperty('per_page');
    expect(response.meta).toHaveProperty('total');
  });

  it('handles search errors', async () => {
    try {
      await publicAPI.search({ city: 'InvalidCity' });
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
```

### 3. Hook Test - useAuth.test.ts

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../context/AuthContext';

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('logs in user', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(result.current.user).toBeDefined();
    expect(result.current.user?.email).toBe('test@example.com');
  });

  it('logs out user', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.user).toBeNull();
  });

  it('stores token in localStorage', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    expect(localStorage.getItem('token')).toBeDefined();
  });
});
```

### 4. Utility Test - formatters.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { formatDate, formatTime, formatPrice } from '../utils/formatters';

describe('Formatters', () => {
  describe('formatDate', () => {
    it('formats date to European format', () => {
      const date = new Date('2024-12-25');
      expect(formatDate(date)).toBe('25.12.2024');
    });

    it('handles invalid date', () => {
      expect(formatDate(new Date('invalid'))).toBe('');
    });
  });

  describe('formatTime', () => {
    it('formats time correctly', () => {
      expect(formatTime('14:30')).toBe('14:30');
    });

    it('pads single digit hours', () => {
      expect(formatTime('9:30')).toBe('09:30');
    });
  });

  describe('formatPrice', () => {
    it('formats price with currency', () => {
      expect(formatPrice(50)).toBe('50 KM');
    });

    it('handles decimal prices', () => {
      expect(formatPrice(50.50)).toBe('50.50 KM');
    });
  });
});
```

## Pokretanje Testova

### Svi testovi
```bash
npm run test
```

### Testovi u watch modu
```bash
npm run test:watch
```

### Testovi sa coverage
```bash
npm run test:coverage
```

### Specifičan test file
```bash
npm run test -- PublicSearch.test.tsx
```

### Specifičan test
```bash
npm run test -- --grep "filters salons by city"
```

## Package.json Scripts

Dodaj u `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

## Best Practices

### 1. Test Naming
```typescript
// ✅ Dobro
it('filters salons by city when city is selected', () => {})

// ❌ Loše
it('test filter', () => {})
```

### 2. Arrange-Act-Assert
```typescript
it('updates user profile', async () => {
  // Arrange
  const user = userEvent.setup();
  render(<ProfileForm />);

  // Act
  await user.type(screen.getByLabelText(/name/i), 'John');
  await user.click(screen.getByRole('button', { name: /save/i }));

  // Assert
  expect(screen.getByText(/saved/i)).toBeInTheDocument();
});
```

### 3. Mock API Calls
```typescript
import { vi } from 'vitest';

vi.mock('../services/api', () => ({
  publicAPI: {
    search: vi.fn().mockResolvedValue({
      salons: [],
      meta: { total: 0 }
    })
  }
}));
```

### 4. Test User Interactions
```typescript
import userEvent from '@testing-library/user-event';

it('submits form on button click', async () => {
  const user = userEvent.setup();
  render(<Form />);

  await user.type(screen.getByLabelText(/email/i), 'test@example.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(screen.getByText(/success/i)).toBeInTheDocument();
});
```

## Coverage Goals

- **Minimum 70%** za sve komponente
- **90%** za kritične komponente (Search, Booking, Auth)
- **100%** za utility funkcije

## Debugging

### Debug Output
```typescript
import { screen, debug } from '@testing-library/react';

it('renders correctly', () => {
  render(<Component />);
  debug(); // Ispisuje DOM
});
```

### Screen Queries
```typescript
// Preporučeno
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email/i)
screen.getByPlaceholderText(/search/i)

// Manje preporučeno
screen.getByTestId('submit-button')
screen.getByClassName('btn')
```

## CI/CD Integration

Testovi se pokrenuti na:
- Push na main branch
- Pull requests
- Pre-deployment

**GitHub Actions** (`.github/workflows/frontend-tests.yml`):
```yaml
- name: Run tests
  run: npm run test:coverage
```

## Resursi

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Status

⏳ **PENDING** - Testovi trebaju biti implementirani nakon instalacije Vitest-a

**Sljedeći koraci**:
1. Instalacija Vitest-a i Testing Library-ja
2. Konfiguracija vitest.config.ts
3. Kreiranje test setup file-a
4. Implementacija testova za komponente
5. Implementacija testova za servise
6. Implementacija testova za hook-ove
7. Implementacija testova za utility funkcije
