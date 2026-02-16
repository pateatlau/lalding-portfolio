import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SkillsEditor from '@/components/admin/skills-editor';
import { mockSkillGroups } from '../../helpers/admin-fixtures';
import type { SkillGroup, Skill } from '@/lib/supabase/types';

vi.mock('@/actions/admin', () => ({
  createSkillGroup: vi.fn(),
  updateSkillGroup: vi.fn(),
  deleteSkillGroup: vi.fn(),
  reorderSkillGroups: vi.fn(),
  createSkill: vi.fn(),
  updateSkill: vi.fn(),
  deleteSkill: vi.fn(),
  reorderSkills: vi.fn(),
}));

import {
  createSkillGroup,
  updateSkillGroup,
  deleteSkillGroup,
  reorderSkillGroups,
  createSkill,
  updateSkill,
  deleteSkill,
} from '@/actions/admin';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('SkillsEditor', () => {
  // --- Group operations ---

  it('renders all skill groups with their skills', () => {
    render(<SkillsEditor groups={mockSkillGroups} />);
    expect(screen.getByText('Frontend')).toBeInTheDocument();
    expect(screen.getByText('Backend')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
  });

  it('shows empty state when no groups', () => {
    render(<SkillsEditor groups={[]} />);
    expect(screen.getByText(/no skill groups yet/i)).toBeInTheDocument();
  });

  it('opens add group dialog and creates group', { timeout: 10000 }, async () => {
    const newGroup: SkillGroup = { id: 'sg-new', category: 'DevOps', sort_order: 2 };
    vi.mocked(createSkillGroup).mockResolvedValue({ data: newGroup });

    const user = userEvent.setup();
    render(<SkillsEditor groups={mockSkillGroups} />);

    await user.click(screen.getByRole('button', { name: /add group/i }));

    expect(screen.getByText('Add Skill Group')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Group Name'), 'DevOps');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(createSkillGroup).toHaveBeenCalledWith({
        category: 'DevOps',
        sort_order: 2,
      });
    });
  });

  it('opens edit group dialog and renames group', async () => {
    const updatedGroup: SkillGroup = { id: 'sg-1', category: 'Frontend & UI', sort_order: 0 };
    vi.mocked(updateSkillGroup).mockResolvedValue({ data: updatedGroup });

    const user = userEvent.setup();
    render(<SkillsEditor groups={mockSkillGroups} />);

    // Find the edit button for the Frontend group card
    // Each card has: [up, down] reorder buttons in CardHeader, then [pencil, trash] in CardAction
    // We need the pencil button associated with "Frontend"
    const allPencilButtons = screen.getAllByRole('button').filter((btn) => {
      // Pencil buttons that are in CardAction sections (size-7)
      return btn.className.includes('size-7') && btn.querySelector('svg');
    });
    // First pencil (size-7) button should be for Frontend group
    await user.click(allPencilButtons[0]);

    expect(screen.getByText('Edit Skill Group')).toBeInTheDocument();
    expect(screen.getByLabelText('Group Name')).toHaveValue('Frontend');

    const nameInput = screen.getByLabelText('Group Name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Frontend & UI');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(updateSkillGroup).toHaveBeenCalledWith('sg-1', { category: 'Frontend & UI' });
    });
  });

  it('opens delete group dialog showing skill count warning', async () => {
    vi.mocked(deleteSkillGroup).mockResolvedValue({ data: { success: true } });

    const user = userEvent.setup();
    render(<SkillsEditor groups={mockSkillGroups} />);

    // Click trash button on Frontend group (has 2 skills)
    const allTrashButtons = screen
      .getAllByRole('button')
      .filter((btn) => btn.className.includes('size-7') && btn.querySelector('svg'));
    // Second size-7 button per group should be trash — allTrashButtons[1] for Frontend group
    await user.click(allTrashButtons[1]);

    expect(screen.getByText('Delete Skill Group')).toBeInTheDocument();
    expect(screen.getByText(/2 skills/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(deleteSkillGroup).toHaveBeenCalledWith('sg-1');
    });
  });

  // --- Skill operations ---

  it('adds a skill inline via input + button', async () => {
    const newSkill: Skill = { id: 'sk-new', name: 'Vue', group_id: 'sg-1', sort_order: 2 };
    vi.mocked(createSkill).mockResolvedValue({ data: newSkill });

    const user = userEvent.setup();
    render(<SkillsEditor groups={mockSkillGroups} />);

    // Find the first "New skill name..." input
    const inputs = screen.getAllByPlaceholderText('New skill name...');
    await user.type(inputs[0], 'Vue');

    // Click the plus button (small, outline, next to input)
    const addSkillBtns = screen
      .getAllByRole('button')
      .filter((btn) => btn.closest('.flex.items-center.gap-2.pt-2') !== null);
    await user.click(addSkillBtns[0]);

    await waitFor(() => {
      expect(createSkill).toHaveBeenCalledWith({
        name: 'Vue',
        group_id: 'sg-1',
        sort_order: 2,
      });
    });
  });

  it('adds a skill via Enter key', async () => {
    const newSkill: Skill = { id: 'sk-new', name: 'Vue', group_id: 'sg-1', sort_order: 2 };
    vi.mocked(createSkill).mockResolvedValue({ data: newSkill });

    const user = userEvent.setup();
    render(<SkillsEditor groups={mockSkillGroups} />);

    const inputs = screen.getAllByPlaceholderText('New skill name...');
    await user.type(inputs[0], 'Vue');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(createSkill).toHaveBeenCalledWith({
        name: 'Vue',
        group_id: 'sg-1',
        sort_order: 2,
      });
    });
  });

  it('starts inline edit on skill and saves with Enter', async () => {
    const updatedSkill: Skill = { id: 'sk-1', name: 'React.js', group_id: 'sg-1', sort_order: 0 };
    vi.mocked(updateSkill).mockResolvedValue({ data: updatedSkill });

    const user = userEvent.setup();
    render(<SkillsEditor groups={mockSkillGroups} />);

    // Find the pencil button for "React" skill
    // Skills have smaller pencil buttons (size-6)
    const reactText = screen.getByText('React');
    const skillRow = reactText.closest('.flex.items-center');
    const editBtns = skillRow!.querySelectorAll('button');
    // In non-editing mode: [up, down, pencil, trash]
    const pencilBtn = editBtns[2]; // pencil
    await user.click(pencilBtn);

    // Input should appear with "React" value
    const editInput = screen.getByDisplayValue('React');
    await user.clear(editInput);
    await user.type(editInput, 'React.js');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(updateSkill).toHaveBeenCalledWith('sk-1', { name: 'React.js' });
    });
  });

  it('cancels inline edit with Escape', async () => {
    const user = userEvent.setup();
    render(<SkillsEditor groups={mockSkillGroups} />);

    // Start editing React skill
    const reactText = screen.getByText('React');
    const skillRow = reactText.closest('.flex.items-center');
    const editBtns = skillRow!.querySelectorAll('button');
    await user.click(editBtns[2]); // pencil

    // Input should appear
    const editInput = screen.getByDisplayValue('React');
    await user.keyboard('{Escape}');

    // Should exit edit mode — "React" text should be visible again (not in input)
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(updateSkill).not.toHaveBeenCalled();
  });

  it('deletes a skill', async () => {
    vi.mocked(deleteSkill).mockResolvedValue({ data: { success: true } });

    const user = userEvent.setup();
    render(<SkillsEditor groups={mockSkillGroups} />);

    // Find the trash button for "TypeScript" skill
    const tsText = screen.getByText('TypeScript');
    const skillRow = tsText.closest('.flex.items-center');
    const btns = skillRow!.querySelectorAll('button');
    const trashBtn = btns[3]; // [up, down, pencil, trash]
    await user.click(trashBtn);

    await waitFor(() => {
      expect(deleteSkill).toHaveBeenCalledWith('sk-2');
    });
  });
});
