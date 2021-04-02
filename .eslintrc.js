module.exports = {
  parser: '@babel/eslint-parser',
  env: {
    commonjs: true,
    es2021: true,
    node: true,
    'jest/globals': true,
  },

  plugins: ['jest'],

  extends: [
    'standard',
    'plugin:json/recommended',
    'plugin:json/recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 2021,
  },
  rules: {
    'jest/no-mocks-import': 'off',
  },
};
