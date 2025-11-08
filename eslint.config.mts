import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  { ignores: ["node_modules/**", "dist/**", "build/**"] },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    extends: [
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    rules: {
      // Disable core rules that conflict with TypeScript or are superseded by TS rules
      "no-undef": "off",
      "no-unused-vars": "off",

      // TS-aware unused variable rule
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true }
      ],
    },
  }
);
