import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import react from 'eslint-plugin-react';

/** @type {import('eslint').Linter.Config[]} */
export default defineConfig([
  {
    ignores: [
      'coverage',
      '**/public',
      '**/dist',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
  },
  {
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
  {
    files: ['apps/web-app/**/*.{ts,tsx}'],
    settings: { react: { version: '18.3' } },
    languageOptions: {
      // other options...
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: './apps/web-app',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
]);
