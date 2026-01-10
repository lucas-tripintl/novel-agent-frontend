/**
 * Tests for loading UI components
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingOverlay } from './loading-overlay';
import { LoadingButton } from './loading-button';
import { SkeletonCard, SkeletonList, SkeletonForm, SkeletonText } from './skeleton-card';

describe('LoadingOverlay', () => {
  it('renders children when not loading', () => {
    render(
      <LoadingOverlay isLoading={false}>
        <div>Content</div>
      </LoadingOverlay>
    );
    
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows loading overlay when loading', () => {
    render(
      <LoadingOverlay isLoading={true} message="Loading...">
        <div>Content</div>
      </LoadingOverlay>
    );
    
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders without children when not loading', () => {
    const { container } = render(
      <LoadingOverlay isLoading={false} />
    );
    
    expect(container.firstChild).toBeNull();
  });
});

describe('LoadingButton', () => {
  it('renders normal button when not loading', () => {
    render(
      <LoadingButton loading={false}>
        Save
      </LoadingButton>
    );
    
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('shows loading state and disables button when loading', () => {
    render(
      <LoadingButton loading={true} loadingText="Saving...">
        Save
      </LoadingButton>
    );
    
    const button = screen.getByRole('button', { name: 'Saving...' });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('respects disabled prop', () => {
    render(
      <LoadingButton disabled={true}>
        Save
      </LoadingButton>
    );
    
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
  });
});

describe('Skeleton Components', () => {
  it('renders SkeletonCard with correct structure', () => {
    const { container } = render(
      <SkeletonCard showHeader showFooter lines={3} />
    );
    
    // Should have card structure
    expect(container.querySelector('[data-slot="card"]')).toBeInTheDocument();
  });

  it('renders SkeletonList with correct count', () => {
    const { container } = render(
      <SkeletonList count={3} />
    );
    
    // Should have 3 list items
    const items = container.querySelectorAll('.flex.items-center');
    expect(items).toHaveLength(3);
  });

  it('renders SkeletonForm with correct field count', () => {
    const { container } = render(
      <SkeletonForm fieldCount={2} />
    );
    
    // Should have 2 form fields (each has label + input skeleton)
    const fields = container.querySelectorAll('.space-y-2');
    expect(fields.length).toBeGreaterThanOrEqual(2);
  });

  it('renders SkeletonText with correct line count', () => {
    const { container } = render(
      <SkeletonText lines={4} />
    );
    
    // Should have 4 text lines
    const lines = container.querySelectorAll('[data-slot="skeleton"]');
    expect(lines).toHaveLength(4);
  });
});