import { ArgumentError } from "./utils";

const configBaseTypeDefinitions = {
	string: {
		parse: (value: string) => value,
	},
	boolean: {
		parse: (value: string) => {
			if (value === "true") return true;
			if (value === "false") return false;
			throw new ArgumentError("Value must be 'true' or 'false'.");
		},
	},
} as const;

export const configSchema = {
	"start-commands": {
		description: "Comma-separated list of commands to run on startup",
		type: "string[]",
		default: ["helloworld"],
	},
} as const;

function generateTypeDefinitions() {
	const definitions: any = { ...configBaseTypeDefinitions };
	for (const key in configBaseTypeDefinitions) {
		const typeName = key as keyof typeof configBaseTypeDefinitions;
		const baseParser = configBaseTypeDefinitions[typeName].parse;

		definitions[`${typeName}[]`] = {
			parse: (value: string) => {
				if (!value.startsWith("[") || !value.endsWith("]")) {
					throw new ArgumentError(
						`Expected array syntax: [element,element,...]`
					);
				}
				const content = value.slice(1, -1).trim();
				if (content === "") return [];

				const elements = content.split(",").map((s) => s.trim());
				return elements.map((s) => baseParser(s));
			},
		};
	}
	return definitions;
}

export const configTypeDefinitions = generateTypeDefinitions();

type ConfigTypeDefinitions = typeof configTypeDefinitions;
export type ConfigTypeName = keyof ConfigTypeDefinitions;
export type ConfigValue = {
	[K in ConfigTypeName]: ReturnType<ConfigTypeDefinitions[K]["parse"]>;
}[ConfigTypeName];

export type ConfigSchemaTyped = typeof configSchema;
export type ConfigKey = keyof ConfigSchemaTyped;

class ConfigManager {
	private readonly config: Record<ConfigKey, ConfigValue>;
	constructor() {
		this.config = this.loadConfig();
	}
	private loadConfig(): Record<ConfigKey, ConfigValue> {
		const storedConfig = localStorage.getItem("terminal-config");
		const parsedConfig = storedConfig ? JSON.parse(storedConfig) : {};
		const finalConfig: Partial<Record<ConfigKey, ConfigValue>> = {};
		for (const key in configSchema) {
			const configKey = key as ConfigKey;
			finalConfig[configKey] =
				parsedConfig[configKey] ?? configSchema[configKey].default;
		}
		return finalConfig as Record<ConfigKey, ConfigValue>;
	}
	private saveConfig(): void {
		localStorage.setItem("terminal-config", JSON.stringify(this.config));
	}
	get<K extends ConfigKey>(key: K): ConfigSchemaTyped[K]["default"] {
		return this.config[key] as ConfigSchemaTyped[K]["default"];
	}
	set<K extends ConfigKey>(
		key: K,
		value: ConfigSchemaTyped[K]["default"]
	): string | null {
		this.config[key] = value;
		this.saveConfig();
		return null;
	}
	reset(key: ConfigKey): void {
		this.config[key] = configSchema[key].default;
		this.saveConfig();
	}
	getAll() {
		return this.config;
	}
}

export const configManager = new ConfigManager();
