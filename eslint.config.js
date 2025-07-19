import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import solid from "eslint-plugin-solid";

export default [
	{
		files: ["**/*.{js,mjs,cjs,ts,mts,cts,tsx}"],
		...js.configs.recommended,
		plugins: {
			...solid.configs["flat/recommended"].plugins,
		},
		languageOptions: {
			globals: globals.browser,
		},
		rules: {
			...solid.configs["flat/recommended"].rules,
		},
	},
	...tseslint.configs.recommended,
	// This should be the last configuration
	eslintConfigPrettier,
];
