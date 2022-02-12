module.exports = {
  env: {
    // "browser": false,
    // "es6": true,
    // "es2017": true,
    node: true,
  },
  // "parser": "@typescript-eslint/parser",
  // "parserOptions": {
  //   "project": ["./tsconfig.json"],
  //   "sourceType": "module",
  // 	"ecmaVersion": 2020
  // },
  plugins: ['@typescript-eslint'],
  extends: [
    '@vue/typescript/recommended',
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    // 'no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    // '@typescript-eslint/no-unused-vars': 'off',
  },
  // "root": true,
  // "ignorePatterns": ["*.cjs"]
};
