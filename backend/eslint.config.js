module.exports = [
  { ignores: ['public/**', 'node_modules/**'] },
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      ecmaVersion: 2023,
      globals: { require: 'readonly', module: 'writable', process: 'readonly', __dirname: 'readonly', console: 'readonly', fetch: 'readonly', AbortSignal: 'readonly' },
    },
    rules: { 'no-undef': 'error', 'no-unused-vars': ['error', { args: 'none' }] },
  },
];
