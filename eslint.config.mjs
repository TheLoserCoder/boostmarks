import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['.agents/**', '.opencode/**', '.taskmaster/**', '.output/**', '.wxt/**', 'node_modules/**', 'web-ext/**', 'src/**', 'webpack.config.js'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{mjs,cjs}', 'scripts/**', 'tests/tooling/**'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['app/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: { ...reactHooks.configs.flat.recommended.rules, ...jsxA11y.flatConfigs.recommended.rules },
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
    rules: { 'max-lines': ['error', { max: 500, skipBlankLines: false, skipComments: false }] },
  },
);
