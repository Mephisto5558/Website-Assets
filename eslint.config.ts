import config, { globals, jsGlob, pluginNames, tsGlob } from '@mephisto5558/eslint-config';

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
      [`${pluginNames.jsdoc}/no-undefined-types`]: [
        'error',
        {
          definedTypes: [
            'RequestInit'
          ]
        }
      ],
      'sonarjs/no-nested-functions': [
        'error',
        /* eslint-disable-next-line @typescript-eslint/no-magic-numbers */
        { threshold: 4 } // 3, + 1 for IIFE
      ],
      [`${pluginNames.import}/no-unassigned-import`]: 'off' // required to import for side-effects
    }
  }
] as typeof config;