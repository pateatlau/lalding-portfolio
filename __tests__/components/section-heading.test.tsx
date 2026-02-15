import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SectionHeading from '@/components/section-heading';

describe('SectionHeading', () => {
  it('renders children text', () => {
    render(<SectionHeading>Test Heading</SectionHeading>);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Test Heading');
  });

  it('renders as h2 element', () => {
    render(<SectionHeading>About Me</SectionHeading>);

    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('applies correct CSS classes', () => {
    render(<SectionHeading>Projects</SectionHeading>);

    const heading = screen.getByRole('heading');
    expect(heading).toHaveClass('mb-8', 'text-center', 'text-3xl', 'font-medium', 'capitalize');
  });

  it('renders React nodes as children', () => {
    render(
      <SectionHeading>
        <span data-testid="inner-span">Skills</span>
      </SectionHeading>
    );

    expect(screen.getByTestId('inner-span')).toBeInTheDocument();
    expect(screen.getByTestId('inner-span')).toHaveTextContent('Skills');
  });
});
