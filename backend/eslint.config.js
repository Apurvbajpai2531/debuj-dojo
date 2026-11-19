module.exports = [
  { ignores: ['public/**', 'node_modules/**', 'patch-*.js'] },
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      ecmaVersion: 2023,
      globals: { require: 'readonly', module: 'writable', process: 'readonly', __dirname: 'readonly', __filename: 'readonly', Buffer: 'readonly', console: 'readonly', fetch: 'readonly', AbortSignal: 'readonly' },
    },
    rules: { 'no-undef': 'error', 'no-unused-vars': ['error', { args: 'none' }] },
  },
];
