import type { ResumeStyle } from '../types';

const PAGE_DIMENSIONS = {
  A4: { width: '210mm', height: '297mm' },
  Letter: { width: '8.5in', height: '11in' },
} as const;

type PageWrapperProps = {
  pageSize: 'A4' | 'Letter';
  style: ResumeStyle;
  children: React.ReactNode;
};

export default function PageWrapper({ pageSize, style, children }: PageWrapperProps) {
  const dims = PAGE_DIMENSIONS[pageSize];

  return (
    <div
      style={{
        width: dims.width,
        minHeight: dims.height,
        margin: '0 auto',
        padding: `${style.margins.top} ${style.margins.right} ${style.margins.bottom} ${style.margins.left}`,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        color: style.primaryColor,
        backgroundColor: '#ffffff',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </div>
  );
}
