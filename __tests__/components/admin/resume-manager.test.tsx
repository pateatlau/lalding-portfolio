import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResumeManager from '@/components/admin/resume-manager';
import { mockDownloads } from '../../helpers/admin-fixtures';

vi.mock('@/actions/admin', () => ({
  uploadResume: vi.fn(),
}));

import { uploadResume } from '@/actions/admin';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ResumeManager', () => {
  it('renders heading and upload button', () => {
    render(<ResumeManager resumeUrl={null} updatedAt="2025-01-01T00:00:00Z" downloads={[]} />);
    expect(screen.getByRole('heading', { name: 'Resume Management' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /upload resume/i })).toBeInTheDocument();
  });

  it('displays current resume path when resume exists', () => {
    render(
      <ResumeManager resumeUrl="resume.pdf" updatedAt="2025-01-01T00:00:00Z" downloads={[]} />
    );
    expect(screen.getByText('resume.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /replace resume/i })).toBeInTheDocument();
  });

  it('shows "No resume uploaded" when resumeUrl is null', () => {
    render(<ResumeManager resumeUrl={null} updatedAt="2025-01-01T00:00:00Z" downloads={[]} />);
    expect(screen.getByText('No resume uploaded')).toBeInTheDocument();
  });

  it('displays download log table with visitor info', () => {
    render(
      <ResumeManager
        resumeUrl="resume.pdf"
        updatedAt="2025-01-01T00:00:00Z"
        downloads={mockDownloads}
      />
    );
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('TechCo')).toBeInTheDocument();
    // Null visitor renders em dashes
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });

  it('shows empty state when no downloads', () => {
    render(
      <ResumeManager resumeUrl="resume.pdf" updatedAt="2025-01-01T00:00:00Z" downloads={[]} />
    );
    expect(screen.getByText('No downloads recorded yet.')).toBeInTheDocument();
  });

  it('rejects non-PDF files before upload', () => {
    const { container } = render(
      <ResumeManager resumeUrl={null} updatedAt="2025-01-01T00:00:00Z" downloads={[]} />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['content'], 'doc.txt', { type: 'text/plain' });

    // Use fireEvent to bypass accept attribute filtering
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText('Only PDF files are allowed')).toBeInTheDocument();
    expect(uploadResume).not.toHaveBeenCalled();
  });

  it('rejects files larger than 10 MB before upload', () => {
    const { container } = render(
      <ResumeManager resumeUrl={null} updatedAt="2025-01-01T00:00:00Z" downloads={[]} />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const largeFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'big.pdf', {
      type: 'application/pdf',
    });

    // Use fireEvent to bypass accept attribute filtering
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(screen.getByText('File must be smaller than 10 MB')).toBeInTheDocument();
    expect(uploadResume).not.toHaveBeenCalled();
  });

  it('calls uploadResume on file selection and shows success', async () => {
    vi.mocked(uploadResume).mockResolvedValue({ data: { path: 'resume.pdf' } });

    const { container } = render(
      <ResumeManager resumeUrl={null} updatedAt="2025-01-01T00:00:00Z" downloads={[]} />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['pdf content'], 'resume.pdf', { type: 'application/pdf' });

    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText('Resume uploaded successfully!')).toBeInTheDocument();
    });
    expect(uploadResume).toHaveBeenCalledTimes(1);
  });

  it('displays error message when upload fails', async () => {
    vi.mocked(uploadResume).mockResolvedValue({ error: 'Failed to upload file' });

    const { container } = render(
      <ResumeManager resumeUrl={null} updatedAt="2025-01-01T00:00:00Z" downloads={[]} />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['pdf'], 'resume.pdf', { type: 'application/pdf' });

    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText('Failed to upload file')).toBeInTheDocument();
    });
  });

  it('shows uploading state while upload is in progress', async () => {
    // Create a promise that we control
    let resolveUpload: (value: { data: { path: string } }) => void;
    vi.mocked(uploadResume).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpload = resolve;
        })
    );

    const { container } = render(
      <ResumeManager resumeUrl="resume.pdf" updatedAt="2025-01-01T00:00:00Z" downloads={[]} />
    );

    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['pdf'], 'resume.pdf', { type: 'application/pdf' });

    await userEvent.upload(fileInput, file);

    // While uploading, button should show "Uploading..."
    expect(screen.getByRole('button', { name: /uploading/i })).toBeDisabled();

    // Resolve the upload
    resolveUpload!({ data: { path: 'resume.pdf' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /replace resume/i })).not.toBeDisabled();
    });
  });
});
