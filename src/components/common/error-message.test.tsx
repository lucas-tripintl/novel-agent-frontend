import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { ErrorMessage, FieldErrorMessage, EmptyStateError } from './error-message';

describe('ErrorMessage', () => {
  it('renders error message with default variant', () => {
    render(<ErrorMessage message="Test error message" />);

    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<ErrorMessage message="Test" variant="error" />);
    expect(screen.getByText('Test')).toHaveClass('text-destructive');

    rerender(<ErrorMessage message="Test" variant="warning" />);
    expect(screen.getByText('Test')).toHaveClass('text-orange-600');

    rerender(<ErrorMessage message="Test" variant="info" />);
    expect(screen.getByText('Test')).toHaveClass('text-blue-600');

    rerender(<ErrorMessage message="Test" variant="success" />);
    expect(screen.getByText('Test')).toHaveClass('text-green-600');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<ErrorMessage message="Test" size="sm" />);
    expect(screen.getByText('Test')).toHaveClass('text-xs');

    rerender(<ErrorMessage message="Test" size="md" />);
    expect(screen.getByText('Test')).toHaveClass('text-sm');

    rerender(<ErrorMessage message="Test" size="lg" />);
    expect(screen.getByText('Test')).toHaveClass('text-base');
  });

  it('can hide icon when showIcon is false', () => {
    const { container } = render(<ErrorMessage message="Test" showIcon={false} />);
    
    // Should not have any icon elements
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ErrorMessage message="Test" className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('FieldErrorMessage', () => {
  it('renders field error message with icon', () => {
    const { container } = render(<FieldErrorMessage message="Field is required" />);

    expect(screen.getByText('Field is required')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('text-destructive');
  });

  it('applies custom className', () => {
    const { container } = render(
      <FieldErrorMessage message="Test" className="custom-field-error" />
    );
    
    expect(container.firstChild).toHaveClass('custom-field-error');
  });
});

describe('EmptyStateError', () => {
  it('renders empty state error with default title', () => {
    render(<EmptyStateError message="No data available" />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(
      <EmptyStateError 
        title="Custom Error Title" 
        message="Custom error message" 
      />
    );

    expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
  });

  it('renders retry button when onRetry is provided', () => {
    const onRetry = vi.fn();
    
    render(
      <EmptyStateError 
        message="Error occurred" 
        onRetry={onRetry}
      />
    );

    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    
    render(
      <EmptyStateError 
        message="Error occurred" 
        onRetry={onRetry}
      />
    );

    await user.click(screen.getByText('Try again'));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render retry button when onRetry is not provided', () => {
    render(<EmptyStateError message="Error occurred" />);

    expect(screen.queryByText('Try again')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <EmptyStateError 
        message="Test" 
        className="custom-empty-error" 
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-empty-error');
  });
});