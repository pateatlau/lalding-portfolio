import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExperienceEditor from '@/components/admin/experience-editor';
import { mockExperiences } from '../../helpers/admin-fixtures';
import type { Experience } from '@/lib/supabase/types';

vi.mock('@/actions/admin', () => ({
  createExperience: vi.fn(),
  updateExperience: vi.fn(),
  deleteExperience: vi.fn(),
  reorderExperiences: vi.fn(),
}));

import {
  createExperience,
  updateExperience,
  deleteExperience,
  reorderExperiences,
} from '@/actions/admin';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ExperienceEditor', () => {
  it('renders table with all experiences', () => {
    render(<ExperienceEditor experiences={mockExperiences} />);
    expect(screen.getByText('Senior Dev')).toBeInTheDocument();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Dev')).toBeInTheDocument();
    expect(screen.getByText('Startup Inc')).toBeInTheDocument();
  });

  it('shows empty state when no experiences', () => {
    render(<ExperienceEditor experiences={[]} />);
    expect(screen.getByText(/no experiences yet/i)).toBeInTheDocument();
  });

  it('opens add dialog and creates experience', { timeout: 15000 }, async () => {
    const newExp: Experience = {
      id: 'exp-new',
      title: 'Tech Lead',
      company: 'New Corp',
      description: 'Leading engineering',
      icon: 'work',
      start_date: '2023-01-01',
      end_date: null,
      display_date: 'Jan 2023 - Present',
      company_logo_url: null,
      sort_order: 2,
    };
    vi.mocked(createExperience).mockResolvedValue({ data: newExp });

    const user = userEvent.setup();
    render(<ExperienceEditor experiences={mockExperiences} />);

    await user.click(screen.getByRole('button', { name: /add experience/i }));

    // Dialog should open with "Add Experience" title
    expect(screen.getByRole('heading', { name: 'Add Experience' })).toBeInTheDocument();

    // Fill in the form
    await user.type(screen.getByLabelText(/^title/i), 'Tech Lead');
    await user.type(screen.getByLabelText(/^company \*/i), 'New Corp');
    await user.type(screen.getByLabelText(/^description/i), 'Leading engineering');
    await user.type(screen.getByLabelText(/^display date/i), 'Jan 2023 - Present');
    await user.type(screen.getByLabelText(/^start date/i), '2023-01-01');

    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(createExperience).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByText('Tech Lead')).toBeInTheDocument();
  });

  it('opens edit dialog with pre-filled data', async () => {
    const user = userEvent.setup();
    render(<ExperienceEditor experiences={mockExperiences} />);

    // Click the first pencil (edit) button in the table
    const rows = screen.getAllByRole('row');
    // Row 0 is header, row 1 is first data row
    const firstDataRow = rows[1];
    const editBtn = within(firstDataRow).getAllByRole('button')[2]; // 3rd button (after up/down)
    await user.click(editBtn);

    expect(screen.getByText('Edit Experience')).toBeInTheDocument();
    await waitFor(
      () => {
        expect(screen.getByLabelText(/^title/i)).toHaveValue('Senior Dev');
      },
      { timeout: 3000 }
    );
    expect(screen.getByLabelText(/^company \*/i)).toHaveValue('Acme Corp');
  }, 10000);

  it('saves edited experience', async () => {
    const updated: Experience = { ...mockExperiences[0], title: 'Lead Dev' };
    vi.mocked(updateExperience).mockResolvedValue({ data: updated });

    const user = userEvent.setup();
    render(<ExperienceEditor experiences={mockExperiences} />);

    // Open edit dialog for first experience
    const rows = screen.getAllByRole('row');
    const firstDataRow = rows[1];
    const buttons = within(firstDataRow).getAllByRole('button');
    // Buttons: [up, down, pencil, trash] → pencil is index 2
    await user.click(buttons[2]);

    // Wait for dialog to open and values to populate
    await waitFor(
      () => {
        expect(screen.getByLabelText(/^title/i)).toHaveValue('Senior Dev');
      },
      { timeout: 3000 }
    );
    const titleInput = screen.getByLabelText(/^title/i);

    await user.clear(titleInput);
    await user.type(titleInput, 'Lead Dev');

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(updateExperience).toHaveBeenCalledWith(
        'exp-1',
        expect.objectContaining({ title: 'Lead Dev' })
      );
    });
  }, 10000);

  it('opens delete dialog and confirms deletion', async () => {
    vi.mocked(deleteExperience).mockResolvedValue({ data: { success: true } });

    const user = userEvent.setup();
    render(<ExperienceEditor experiences={mockExperiences} />);

    // Click delete button on first experience
    const rows = screen.getAllByRole('row');
    const deleteBtn = within(rows[1]).getAllByRole('button')[3]; // 4th button (after up/down/edit)
    await user.click(deleteBtn);

    // Delete confirmation dialog should appear
    expect(screen.getByRole('heading', { name: 'Delete Experience' })).toBeInTheDocument();
    // The dialog description mentions the experience title
    expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();

    // Click the destructive "Delete" button inside the dialog
    const dialog = screen.getByRole('dialog', { name: 'Delete Experience' });
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(deleteExperience).toHaveBeenCalledWith('exp-1');
    });
  });

  it('displays error message when create fails', async () => {
    vi.mocked(createExperience).mockResolvedValue({ error: 'Failed to create experience' });

    const user = userEvent.setup();
    render(<ExperienceEditor experiences={mockExperiences} />);

    await user.click(screen.getByRole('button', { name: /add experience/i }));
    await user.type(screen.getByLabelText(/^title/i), 'Test');
    await user.type(screen.getByLabelText(/^company \*/i), 'TestCo');
    await user.type(screen.getByLabelText(/^description/i), 'Desc');
    await user.type(screen.getByLabelText(/^display date/i), '2023');
    await user.type(screen.getByLabelText(/^start date/i), '2023-01-01');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText('Failed to create experience')).toBeInTheDocument();
    });
  });

  it('handles reorder', async () => {
    vi.mocked(reorderExperiences).mockResolvedValue({ data: { success: true } });

    const user = userEvent.setup();
    render(<ExperienceEditor experiences={mockExperiences} />);

    // Click "down" button on first experience
    const rows = screen.getAllByRole('row');
    const downBtn = within(rows[1]).getAllByRole('button')[1]; // 2nd button (down arrow)
    await user.click(downBtn);

    await waitFor(() => {
      expect(reorderExperiences).toHaveBeenCalledWith(['exp-2', 'exp-1']);
    });
  });

  it('disables up button for first item and down button for last item', () => {
    render(<ExperienceEditor experiences={mockExperiences} />);

    const rows = screen.getAllByRole('row');
    // First data row: up should be disabled
    const firstRowUpBtn = within(rows[1]).getAllByRole('button')[0];
    expect(firstRowUpBtn).toBeDisabled();

    // Last data row: down should be disabled
    const lastRowDownBtn = within(rows[2]).getAllByRole('button')[1];
    expect(lastRowDownBtn).toBeDisabled();
  });
});
