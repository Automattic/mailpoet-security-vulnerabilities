module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'airbnb',
    'airbnb-typescript',
    'plugin:react/jsx-runtime',
    'prettier',
  ],
  env: {
    amd: true,
    browser: true,
    mocha: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: '.',
    project: ['./tsconfig.json'],
    ecmaVersion: 6,
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react-hooks', 'no-only-tests', '@typescript-eslint'],
  settings: {
    'import/resolver': 'webpack',
  },
  rules: {
    'class-methods-use-this': 0,
    // PropTypes
    'react/prop-types': 0,
    'react/require-default-props': 0,
    'react/jsx-props-no-spreading': 0,
    // Hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    // Exceptions
    'no-void': 0, // can conflict with @typescript-eslint/no-floating-promises
    'react/jsx-filename-extension': 0,
    '@typescript-eslint/no-unsafe-return': 0, // we need to disable it for wordpress select :(
    '@typescript-eslint/no-unsafe-member-access': 0, // we need to disable it for wordpress select :(
    '@typescript-eslint/no-unsafe-call': 0, // this needs to match the one defined for free plugin
    '@typescript-eslint/no-unsafe-assignment': 0, // this needs to match the one defined for free plugin
    'import/extensions': 0, // we wouldn't be able to import jQuery without this line
    'import/prefer-default-export': 0, // we want to stop using default exports and start using named exports
    'react/destructuring-assignment': 0, // that would be too many changes to fix this one
    'prefer-destructuring': 0, // that would be too many changes to fix this one
    'jsx-a11y/label-has-for': [
      2,
      {
        required: { some: ['nesting', 'id'] }, // some of our labels are hidden and we cannot nest those
      },
    ],
    'jsx-a11y/anchor-is-valid': 0, // cannot fix this one, it would break wprdpress themes
    'jsx-a11y/label-has-associated-control': [
      2,
      {
        either: 'either', // control has to be either nested or associated via htmlFor
      },
    ],
    'import/no-default-export': 1, // no default exports
  },
  overrides: [
    {
      files: ['**/_stories/*.tsx'],
      rules: {
        'import/no-extraneous-dependencies': [
          'error',
          { devDependencies: true },
        ],
        'import/no-default-export': 0,
      },
    },
  ],
};