module.exports = {
  extends: ['airbnb/legacy', 'prettier'],
  env: {
    amd: true,
    mocha: true,
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
  rules: {
    'no-only-tests/no-only-tests': 2,
    // Exceptions
    'func-names': 0,
    // Temporary
    'no-underscore-dangle': 0,
  },
  plugins: ['no-only-tests'],
};