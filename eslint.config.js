import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";

export default [
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  { languageOptions: { globals: globals.browser } },
  tseslint.configs.recommended,
  tseslint.configs.strict,
  pluginReactConfig,
  {
    rules: {
      // Add any project-specific rules here
      "react/react-in-jsx-scope": "off", // Not needed with React 17+ and Vite
      "react/jsx-uses-react": "off" // Not needed with React 17+ and Vite
    }
  }
];
