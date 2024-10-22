import config, { plugins } from '@mephisto5558/eslint-config';
import globals from 'globals';

/**
 * @type { import('eslint').Linter.FlatConfig[] }
 * This config lists all rules from every plugin it uses.*/
export default [
  ...config,
  {
    ignores: ['min/**']
  },
  {
    name: 'overwrite',
    files: ['**/*.js', '**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.es2024,
        ...globals.browser,
        Swal: 'readonly'
      }
    },
    plugins,
    rules: {
      'max-lines': 'off',
      'max-nested-callbacks': [
        'warn',
        5
      ],
      'no-return-assign': 'off',
      'jsdoc/no-undefined-types': [
        'error',
        {
          definedTypes: [
            'RequestInit'
          ]
        }
      ],
      '@stylistic/max-len': 'off',
      'sonarjs/no-nested-functions': [
        'error',
        {
          // Default + 1 for IIFE
          threshold: config.find(e => e.rules && Object.entries(e.rules).find(([k]) => k == 'sonarjs/no-nested-functions')).rules['sonarjs/no-nested-functions'][1].threshold + 1
        },
      ],
      'sonarjs/sonar-no-magic-numbers': 'off' // clientside code has way to much of it
    }
  }
];