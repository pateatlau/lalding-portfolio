import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { getTemplateComponent } from '@/components/resume-templates/registry';
import type { ResumeData } from '@/components/resume-templates/types';

export async function renderTemplateToHtml(registryKey: string, data: ResumeData): Promise<string> {
  const Template = await getTemplateComponent(registryKey);
  if (!Template) throw new Error(`Template not found: ${registryKey}`);

  const markup = renderToStaticMarkup(createElement(Template, { data }));

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { margin: 0; }
  </style>
</head>
<body>${markup}</body>
</html>`;
}
