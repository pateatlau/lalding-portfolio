import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileForm from '@/components/admin/profile-form';
import { mockProfile, mockStats } from '../../helpers/admin-fixtures';

vi.mock('@/actions/admin', () => ({
  updateProfile: vi.fn(),
  updateProfileStats: vi.fn(),
}));

import { updateProfile, updateProfileStats } from '@/actions/admin';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(updateProfile).mockResolvedValue({ data: { success: true } });
  vi.mocked(updateProfileStats).mockResolvedValue({ data: { success: true } });
});

describe('ProfileForm', () => {
  it('renders all three tabs', () => {
    render(<ProfileForm profile={mockProfile} stats={mockStats} />);
    expect(screen.getByRole('tab', { name: 'General' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'About' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Stats' })).toBeInTheDocument();
  });

  it('renders general tab fields with initial values', () => {
    render(<ProfileForm profile={mockProfile} stats={mockStats} />);
    expect(screen.getByLabelText('Full Name')).toHaveValue('John Doe');
    expect(screen.getByLabelText('Job Title')).toHaveValue('Software Engineer');
    expect(screen.getByLabelText('Email')).toHaveValue('john@example.com');
  });

  it('allows editing and saving general info', async () => {
    const user = userEvent.setup();
    render(<ProfileForm profile={mockProfile} stats={mockStats} />);

    const fullNameInput = screen.getByLabelText('Full Name');
    await user.clear(fullNameInput);
    await user.type(fullNameInput, 'Jane Doe');

    await user.click(screen.getByRole('button', { name: /save general info/i }));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledTimes(1);
    });
    expect(vi.mocked(updateProfile).mock.calls[0][0]).toMatchObject({
      full_name: 'Jane Doe',
    });
    expect(screen.getByText('General info saved successfully!')).toBeInTheDocument();
  });

  it('displays error when general save fails', async () => {
    vi.mocked(updateProfile).mockResolvedValue({ error: 'Failed to update profile' });
    const user = userEvent.setup();
    render(<ProfileForm profile={mockProfile} stats={mockStats} />);

    await user.click(screen.getByRole('button', { name: /save general info/i }));

    await waitFor(() => {
      expect(screen.getByText('Failed to update profile')).toBeInTheDocument();
    });
  });

  it('switches to About tab and renders about fields', async () => {
    const user = userEvent.setup();
    render(<ProfileForm profile={mockProfile} stats={mockStats} />);

    await user.click(screen.getByRole('tab', { name: 'About' }));

    expect(screen.getByLabelText('Tech Stack')).toHaveValue('React, TypeScript');
    expect(screen.getByLabelText('Current Focus')).toHaveValue('Next.js');
  });

  it('saves about info successfully', async () => {
    const user = userEvent.setup();
    render(<ProfileForm profile={mockProfile} stats={mockStats} />);

    await user.click(screen.getByRole('tab', { name: 'About' }));
    await user.click(screen.getByRole('button', { name: /save about info/i }));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledTimes(1);
    });
    expect(vi.mocked(updateProfile).mock.calls[0][0]).toMatchObject({
      about_tech_stack: 'React, TypeScript',
    });
    expect(screen.getByText('About info saved successfully!')).toBeInTheDocument();
  });

  it('switches to Stats tab and renders stat cards', async () => {
    const user = userEvent.setup();
    render(<ProfileForm profile={mockProfile} stats={mockStats} />);

    await user.click(screen.getByRole('tab', { name: 'Stats' }));

    expect(screen.getByText('2 stats')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Years Experience')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Projects')).toBeInTheDocument();
  });

  it('adds a new stat row', async () => {
    const user = userEvent.setup();
    render(<ProfileForm profile={mockProfile} stats={mockStats} />);

    await user.click(screen.getByRole('tab', { name: 'Stats' }));
    await user.click(screen.getByRole('button', { name: /add stat/i }));

    expect(screen.getByText('3 stats')).toBeInTheDocument();
  });

  it('validates stats require labels before saving', async () => {
    const user = userEvent.setup();
    render(<ProfileForm profile={mockProfile} stats={mockStats} />);

    await user.click(screen.getByRole('tab', { name: 'Stats' }));

    // Add a stat with empty label
    await user.click(screen.getByRole('button', { name: /add stat/i }));

    // Try to save — new stat has empty label
    await user.click(screen.getByRole('button', { name: /save stats/i }));

    await waitFor(() => {
      expect(screen.getByText('All stats must have a label')).toBeInTheDocument();
    });
    expect(updateProfileStats).not.toHaveBeenCalled();
  });
});
