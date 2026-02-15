import { defineConfig, globalIgnores } from 'eslint/config';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextCoreWebVitals,
  prettier,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'coverage/**', '__mocks__/**', 'next-env.d.ts']),
  {
    rules: {
      'react/no-unescaped-entities': 'off',
    },
  },
]);

export default eslintConfig;
