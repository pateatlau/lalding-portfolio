import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import ThemeContextProvider from '@/context/theme-context';
import ActiveSectionContextProvider from '@/context/active-section-context';

interface AllProvidersProps {
  children: ReactNode;
}

function AllProviders({ children }: AllProvidersProps) {
  return (
    <ThemeContextProvider>
      <ActiveSectionContextProvider>{children}</ActiveSectionContextProvider>
    </ThemeContextProvider>
  );
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
