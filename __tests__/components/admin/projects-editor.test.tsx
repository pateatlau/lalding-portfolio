import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectsEditor from '@/components/admin/projects-editor';
import { mockProjects, mockCategories } from '../../helpers/admin-fixtures';
import type { Project } from '@/lib/supabase/types';

vi.mock('@/actions/admin', () => ({
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  reorderProjects: vi.fn(),
}));

import { createProject, updateProject, deleteProject, reorderProjects } from '@/actions/admin';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProjectsEditor', () => {
  it('renders table with all projects', () => {
    render(<ProjectsEditor projects={mockProjects} categories={mockCategories} />);
    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.getByText('Project Beta')).toBeInTheDocument();
    expect(screen.getByText('Web')).toBeInTheDocument(); // category for Alpha
  });

  it('shows tag badges with overflow', () => {
    render(<ProjectsEditor projects={mockProjects} categories={mockCategories} />);
    // Alpha has 4 tags, should show 3 + "+1"
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Next.js')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('shows empty state when no projects', () => {
    render(<ProjectsEditor projects={[]} categories={mockCategories} />);
    expect(screen.getByText(/no projects yet/i)).toBeInTheDocument();
  });

  it('opens add dialog and creates project', { timeout: 10000 }, async () => {
    const newProject: Project = {
      id: 'proj-new',
      title: 'New Project',
      description: 'A new project',
      tags: ['Vue', 'Vite'],
      image_url: null,
      demo_video_url: null,
      source_code_url: null,
      live_site_url: null,
      category_id: null,
      sort_order: 2,
    };
    vi.mocked(createProject).mockResolvedValue({ data: newProject });

    const user = userEvent.setup();
    render(<ProjectsEditor projects={mockProjects} categories={mockCategories} />);

    await user.click(screen.getByRole('button', { name: /add project/i }));

    expect(screen.getByRole('heading', { name: 'Add Project' })).toBeInTheDocument();

    await user.type(screen.getByLabelText(/^title/i), 'New Project');
    await user.type(screen.getByLabelText(/^description/i), 'A new project');
    await user.type(screen.getByLabelText('Tags'), 'Vue, Vite');

    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(createProject).toHaveBeenCalledTimes(1);
    });
    const callArgs = vi.mocked(createProject).mock.calls[0][0];
    expect(callArgs.tags).toEqual(['Vue', 'Vite']);
  });

  it('saves edited project', async () => {
    const updated: Project = { ...mockProjects[0], title: 'Updated Alpha' };
    vi.mocked(updateProject).mockResolvedValue({ data: updated });

    const user = userEvent.setup();
    render(<ProjectsEditor projects={mockProjects} categories={mockCategories} />);

    // Click edit on first project
    const rows = screen.getAllByRole('row');
    const editBtn = within(rows[1]).getAllByRole('button')[2];
    await user.click(editBtn);

    expect(screen.getByText('Edit Project')).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/^title/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Alpha');

    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => {
      expect(updateProject).toHaveBeenCalledWith(
        'proj-1',
        expect.objectContaining({ title: 'Updated Alpha' })
      );
    });
  });

  it('opens delete dialog and confirms deletion', async () => {
    vi.mocked(deleteProject).mockResolvedValue({ data: { success: true } });

    const user = userEvent.setup();
    render(<ProjectsEditor projects={mockProjects} categories={mockCategories} />);

    const rows = screen.getAllByRole('row');
    const deleteBtn = within(rows[1]).getAllByRole('button')[3];
    await user.click(deleteBtn);

    expect(screen.getByRole('heading', { name: 'Delete Project' })).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();

    const dialog = screen.getByRole('dialog', { name: 'Delete Project' });
    await user.click(within(dialog).getByRole('button', { name: /^delete$/i }));

    await waitFor(() => {
      expect(deleteProject).toHaveBeenCalledWith('proj-1');
    });
  });

  it('displays error on save failure', async () => {
    vi.mocked(createProject).mockResolvedValue({ error: 'Failed to create project' });

    const user = userEvent.setup();
    render(<ProjectsEditor projects={mockProjects} categories={mockCategories} />);

    await user.click(screen.getByRole('button', { name: /add project/i }));
    await user.type(screen.getByLabelText(/^title/i), 'Test');
    await user.type(screen.getByLabelText(/^description/i), 'Test desc');
    await user.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(screen.getByText('Failed to create project')).toBeInTheDocument();
    });
  });

  it('handles reorder', async () => {
    vi.mocked(reorderProjects).mockResolvedValue({ data: { success: true } });

    const user = userEvent.setup();
    render(<ProjectsEditor projects={mockProjects} categories={mockCategories} />);

    const rows = screen.getAllByRole('row');
    const downBtn = within(rows[1]).getAllByRole('button')[1]; // down arrow
    await user.click(downBtn);

    await waitFor(() => {
      expect(reorderProjects).toHaveBeenCalledWith(['proj-2', 'proj-1']);
    });
  });
});
