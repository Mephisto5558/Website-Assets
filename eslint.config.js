/* eslint-disable @typescript-eslint/no-magic-numbers */

import config, { globals, jsGlob, tsGlob } from '@mephisto5558/eslint-config';

/**
 * @type {typeof config}
 * This config lists all rules from every plugin it uses. */
export default [
  ...config,
  {
    ignores: ['min/**']
  },
  {
    name: 'overwrite',
    files: [`**/*${tsGlob}`, `**/*${jsGlob}`],
    languageOptions: {
      globals: {
        ...globals.es2024,
        ...globals.browser,
        Swal: 'readonly'
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