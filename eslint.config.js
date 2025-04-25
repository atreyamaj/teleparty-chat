import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";

export default {
  overrides: [
    {
      files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
      languageOptions: { globals: globals.browser },
      ...tseslint.configs.recommended,
      ...tseslint.configs.strict,
      ...pluginReactConfig,
      rules: {
        "react/react-in-jsx-scope": "off",
        "react/jsx-uses-react": "off"
      }
    }
  ]
};
