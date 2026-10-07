import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist', '**/coverage', '**/node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.strict, ...tseslint.configs.stylistic],
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      // Groups: side effects, packages, workspace packages, `@/` alias, relative.
      'simple-import-sort/imports': [
        'error',
        { groups: [['^\\u0000'], ['^node:', '^@?\\w'], ['^@nevis/'], ['^@/'], ['^\\.']] },
      ],
      'simple-import-sort/exports': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['apps/api/**/*.ts', 'packages/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    extends: [jsxA11y.flatConfigs.recommended],
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // ARIA in HTML allows grid roles on <table>; TreeTable relies on it for the treegrid pattern.
      'jsx-a11y/no-noninteractive-element-to-interactive-role': [
        'error',
        {
          ...jsxA11y.configs.recommended.rules['jsx-a11y/no-noninteractive-element-to-interactive-role'][1],
          table: ['grid', 'treegrid'],
        },
      ],
    },
  },
  ...webLayerRules(),
  prettier,
);

/**
 * Enforces the web layering `app → pages → features → shared` (see AGENTS.md): a layer may only import
 * layers to its right, and code outside a feature uses the feature's public `index.ts` only.
 */
function webLayerRules() {
  // Flat config replaces (does not merge) rule options per file, so every entry repeats the shared guard.
  const deepRelative = {
    group: ['../../*'],
    message: 'Use the @/ alias for imports outside the current module.',
  };
  const restrict = (files, patterns) => ({
    files: files.map((glob) => `apps/web/src/${glob}`),
    rules: { 'no-restricted-imports': ['error', { patterns: [deepRelative, ...patterns] }] },
  });
  const upward = (layers) => ({
    group: layers.map((layer) => `**/${layer}/**`),
    message: 'Layering: import only from lower layers (app → pages → features → shared).',
  });
  // Feature internals are private; test fixtures in `<feature>/testing` may be shared.
  const featureInternals = {
    group: ['**/features/*/api/**', '**/features/*/model/**', '**/features/*/ui/**'],
    message: 'Import features through their public index.ts.',
  };

  return [
    restrict(['**'], []),
    restrict(['shared/**'], [upward(['features', 'pages', 'app'])]),
    restrict(['features/**'], [upward(['pages', 'app'])]),
    restrict(['pages/**'], [upward(['app']), featureInternals]),
    restrict(['app/**'], [featureInternals]),
  ];
}
