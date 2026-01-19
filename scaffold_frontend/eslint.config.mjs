import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import playwright from 'eslint-plugin-playwright';
import chaiFriendly from 'eslint-plugin-chai-friendly';
import tailwindcss from 'eslint-plugin-tailwindcss';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  ...tailwindcss.configs['flat/recommended'],

  // TypeScript files configuration with parser options
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // Settings for plugins
  {
    settings: {
      react: {
        version: 'detect',
      },
      tailwindcss: {
        callees: ['cn', 'cva'],
        config: 'tailwind.config.js',
      },
    },
  },

  // Main config with custom rules
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/consistent-type-imports': 'warn',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-misused-promises': [
        2,
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
      '@typescript-eslint/require-await': 0,
      'react-hooks/rules-of-hooks': 0,
      // Disable strict React 19 compiler rules
      'react-hooks/refs': 0,
      'react-hooks/set-state-in-effect': 0,
      'react-hooks/purity': 0,
      'react-hooks/use-memo': 0,
      'react-hooks/immutability': 0,
      'react-hooks/static-components': 0,
      'react-hooks/incompatible-library': 0,
      'react/react-in-jsx-scope': 0,
      'react/prop-types': 0,
      'react/jsx-filename-extension': 0,
      'react/destructuring-assignment': 0,
      'no-nested-ternary': 0,
      'array-callback-return': 0,
      'consistent-return': 0,
      'no-param-reassign': 0,
      'lines-between-class-members': 0,
      // Tailwind CSS rules
      'tailwindcss/no-custom-classname': [
        'off',
        {
          config: 'tailwind.config.js',
          whitelist: [
            'border',
            'destructive',
            'success',
            'transparent',
            'mdx',
            'codeblock',
            'text-brand',
          ],
        },
      ],
    },
  },

  // Disable type-checked rules for JS files
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    rules: {
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/require-await': 'off',
    },
  },

  // Game files - allow import() type annotations for dynamic Phaser imports
  {
    files: ['**/components/games/**/*.tsx'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },

  // E2E test overrides
  {
    files: ['**/tests/e2e/**/*.{j,t}s'],
    plugins: {
      playwright,
      'chai-friendly': chaiFriendly,
    },
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      ...chaiFriendly.configs.recommended.rules,
      'playwright/expect-expect': 0,
      'playwright/no-networkidle': 0,
      'playwright/no-conditional-in-test': 0,
      'playwright/no-force-option': 0,
      'playwright/no-wait-for-timeout': 0,
      'playwright/no-wait-for-selector': 0,
      'no-unused-expressions': 0,
      'chai-friendly/no-unused-expressions': 2,
      'jest/no-commented-out-tests': 0,
      'no-unnecessary-waiting': 0,
    },
  },

  // Override default ignores
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'node_modules/**',
    'public/**',
    '.contentlayer/**',
  ]),
]);

export default eslintConfig;
