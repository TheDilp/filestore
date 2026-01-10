import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginImport from "eslint-plugin-import";
import eslintPluginJsxA11y from "eslint-plugin-jsx-a11y";
import eslintPluginPrettier from "eslint-plugin-prettier";
import eslintPluginReact from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import eslintPluginSimpleImportSort from "eslint-plugin-simple-import-sort";
import eslintPluginUnusedImports from "eslint-plugin-unused-imports";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";
export default defineConfig([
  globalIgnores(["dist", "node_modules"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs["recommended-latest"],
      reactRefresh.configs.vite,
      eslintPluginReact.configs.flat["jsx-runtime"],
      eslintPluginJsxA11y.flatConfigs.recommended,
    ],
    plugins: {
      prettier: eslintPluginPrettier,
      import: eslintPluginImport,
      "simple-import-sort": eslintPluginSimpleImportSort,
      "unused-imports": eslintPluginUnusedImports,
    },
    rules: {
      ...eslintConfigPrettier.rules,
      "func-style": ["error", "declaration", { allowArrowFunctions: false }],
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "off",
      "no-duplicate-imports": "error",
      "react/hook-use-state": "error",
      "react/jsx-boolean-value": "error",
      "react/jsx-closing-tag-location": "error",
      "react/jsx-key": "error",
      "react/jsx-no-undef": "error",
      "react/jsx-pascal-case": "error",
      "react/jsx-sort-props": ["error", { reservedFirst: true }],
      "react/no-array-index-key": "error",
      "react/no-danger": "error",
      "react/no-deprecated": "error",
      "react/no-typos": "error",
      "react/no-unstable-nested-components": "error",
      "react/destructuring-assignment": "error",
      "react/function-component-definition": [
        "error",
        { namedComponents: "function-declaration" },
      ],
      quotes: ["error", "double"],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "unused-imports/no-unused-vars": [
        "error",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "import/no-cycle": "error",
      "no-console": ["error", { allow: ["info", "error"] }],
      camelcase: ["error"],
      "jsx-a11y/media-has-caption": "off",
      "prettier/prettier": [
        "error",
        {
          endOfLine: "auto",
        },
      ],
      curly: ["error", "multi"],
      "react/jsx-curly-brace-presence": [
        "error",
        { props: "never", children: "never" },
      ],
      "react-hooks/exhaustive-deps": ["off"],
      camelcase: ["error", { allow: ["^relation__", "^RS_", "^UK_"] }],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    languageOptions: {
      ecmaVersion: "latest",
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        tsconfigRootDir: process.env.TSCONFIG_PATH,
      },
    },
  },
]);
