/* eslint-disable @typescript-eslint/no-magic-numbers */

/** @import { Linter } from 'eslint' */

import config from '@mephisto5558/eslint-config';
import globals from 'globals';

/**
 * @type {Linter.Config[]}
 * This config lists all rules from every plugin it uses. */
export default [
  ...config,
  {
    ignores: ['min/**']
  },
  {
    name: 'overwrite',
    files: ['**/*.{js,ts}'],
    languageOptions: {
      globals: {
        ...globals.es2024,
        ...globals.browser,
        Swal: 'readonly',
        rando: 'readonly',
        randoSequence: 'readonly'
      }
    },
    rules: {
      'max-lines': 'off',
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
        { threshold: 4 } // 3, + 1 for IIFE
      ],
      'import-x/no-unassigned-import': 'off' // required to import for side-effects
    }
  }
];