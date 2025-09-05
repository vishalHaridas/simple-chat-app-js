import js from '@eslint/js'
import { globalIgnores } from 'eslint/config'
import eslintConfigPrettier from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config([
  // Ignore build output
  globalIgnores(['dist', 'coverage']),

  // 1) Base rules (no type info) for all files, including tests and config
  {
    files: ['**/*.{js,ts,tsx}'],
    extends: [
      js.configs.recommended, // JS best-practices
      ...tseslint.configs.recommended, // TS rules without type-checking
      reactHooks.configs['recommended-latest'], // enforce correct Hooks usage
      reactRefresh.configs.vite, // ban HMR-incompatible patterns
      importPlugin.flatConfigs.recommended, // import errors (cycles/missing)
      importPlugin.flatConfigs.typescript, // TS-aware import rules
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.browser,
    },
    settings: {
      react: { version: 'detect' }, // let plugins detect React version
      'import/resolver': {
        node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
        typescript: { project: ['./tsconfig.app.json'] }, // use app tsconfig
      },
    },
    rules: {
      // ---------- General code-quality ----------
      'no-console': ['warn', { allow: ['warn', 'error'] }], // keep signal in console
      'no-debugger': 'warn', // avoid shipping debugger

      // ---------- Import hygiene ----------
      'import/no-duplicates': 'error', // merge duplicate imports
      'import/order': [
        'error',
        {
          // group external/internal, put react first, then styles
          groups: [
            ['builtin', 'external'],
            ['internal'],
            ['parent', 'sibling', 'index'],
            ['type'],
            ['object'],
          ],
          pathGroups: [
            { pattern: 'react', group: 'external', position: 'before' },
            { pattern: '@/**', group: 'internal' },
            { pattern: './*.css', group: 'index', position: 'after' },
          ],
          'newlines-between': 'always', // readability
          alphabetize: { order: 'asc', caseInsensitive: true }, // deterministic
        },
      ],

      // ---------- TS rules that don't need type info ----------
      '@typescript-eslint/consistent-type-definitions': ['warn', 'type'], // prefer `type` aliases
      '@typescript-eslint/explicit-function-return-type': 'off', // allow inference
      '@typescript-eslint/explicit-module-boundary-types': 'off', // allow inference at boundaries
      '@typescript-eslint/no-explicit-any': ['warn', { ignoreRestArgs: false }], // discourage `any`
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ], // allow intentional _unused
    },
  },

  // 2) Type-aware override only for application source
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.recommendedTypeChecked, // enable type-aware rules
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.app.json'], // limit to app tsconfig
      },
    },
    rules: {
      // Async safety and stricter typing (require type info)
      '@typescript-eslint/no-floating-promises': 'error', // avoid unhandled async
      '@typescript-eslint/await-thenable': 'error', // misuse of await
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true, allowBoolean: true, allowNullish: true },
      ], // safer templates
    },
  },

  // 3) Test files: provide vitest globals
  {
    files: ['test/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.vitest, // describe, it, expect, vi, etc.
      },
    },
    rules: {
      'no-console': 'off', // console in tests is acceptable
      '@typescript-eslint/no-unused-vars': 'off', // tests often import helpers they don't use directly
    },
  },

  // 4) Tooling configs (Node env): relax import resolution noise
  {
    files: [
      'eslint.config.js',
      'vite.config.ts',
      'postcss.config.js',
      'tailwind.config.js',
      'prettier.config.js',
    ],
    languageOptions: {
      globals: globals.node, // Node runtime globals
    },
    rules: {
      'import/no-unresolved': 'off', // some configs use export maps not recognized by resolver
      'import/no-extraneous-dependencies': 'off', // dev-only deps acceptable in configs
    },
  },

  // 5) Disable format-conflicting rules (Prettier owns formatting)
  eslintConfigPrettier,
])
