import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock ResizeObserver for jsdom
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock next-intl for testing
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock @/i18n/navigation
vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  Link: ({ children, ...props }: any) => {
    const React = require('react');
    return React.createElement('a', props, children);
  },
}));

// Mock Zustand stores
vi.mock('@/stores/enum-store', () => ({
  useEnumStore: () => ({
    loaded: true,
    getLabel: (_enumName: string, value: string) => value,
    getFieldValueLabel: (_fieldName: string, value: string) => value,
  }),
}));

// Mock common components that might cause issues
vi.mock('@/components/common/enum-label', () => ({
  EnumLabel: ({ value, fallback }: { value: string; fallback?: string }) => {
    const React = require('react');
    return React.createElement('span', {}, fallback || value);
  },
  EnumBadge: ({ value, fallback }: { value: string; fallback?: string }) => {
    const React = require('react');
    return React.createElement('span', {}, fallback || value);
  },
}));

// Mock character attributes editor
vi.mock('@/components/common/character-attributes-editor', () => ({
  CharacterAttributesEditor: ({ attributes, onChange, readOnly }: any) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'character-attributes-editor' }, [
      React.createElement('span', { key: 'label' }, '角色属性'),
      !readOnly && React.createElement('button', { key: 'edit', onClick: () => onChange({}) }, 'Edit Attributes')
    ]);
  },
}));

// Mock skeleton components
vi.mock('@/components/common/skeleton-card', () => ({
  SkeletonList: ({ count }: { count: number }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'skeleton-list' },
      Array.from({ length: count }, (_, i) => 
        React.createElement('div', { key: i, 'data-testid': `skeleton-item-${i}` }, 'Loading...')
      )
    );
  },
}));