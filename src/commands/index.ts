import { Terminal } from "../components/Terminal";
import Themes from "../themes";

export const argumentTypes = {
	string: {
		validate: () => true,
		parse: (val: string) => val,
		suggestions: () => [],
	},
	boolean: {
		validate: (value: string) => value === "true" || value === "false",
		parse: (val: string) => val === "true",
		suggestions: (currentInput: string) =>
			["true", "false"].filter((val) => val.startsWith(currentInput)),
	},
	command: {
		validate: async (value: string) =>
			(await getCommandList()).includes(value),
		parse: (val: string) => val,
		suggestions: async (currentInput: string) =>
			(await getCommandList()).filter((cmd) =>
				cmd.startsWith(currentInput)
			),
	},
	integer: {
		validate: (value: string) => Number.isInteger(Number(value)),
		parse: (value: string) => parseInt(value, 10),
		suggestions: () => [],
	},
	action: {
		validate: (value: string) => value === "encode" || value === "decode",
		parse: (val: "encode" | "decode") => val,
		suggestions: (currentInput: string) =>
			["encode", "decode"].filter((val) => val.startsWith(currentInput)),
	},
	theme: {
		typeName: "theme",
		validate: (value: string) => Object.keys(Themes).includes(value),
		parse: (value: string) => value,
		suggestions: (currentInput: string) =>
			Object.keys(Themes).filter((theme) =>
				theme.startsWith(currentInput)
			),
	},
} as const;

export type ArgTypeMap = {
	[K in keyof typeof argumentTypes]: ReturnType<
		(typeof argumentTypes)[K]["parse"]
	>;
};

// Defines the structure for a single command argument.
export interface ArgumentDefinition {
	name: string;
	shorthand?: string;
	optional: boolean;
	description: string;
	default?: string;
	type:
		| keyof ArgTypeMap
		| {
		typeName?: string;
		validate: (value: string) => boolean | Promise<boolean>;
		parse: (val: string) => unknown;
		suggestions: (
			currentInput: string
		) => string[] | Promise<string[]>;
	};
}

export type DeriveArgs<T> = T extends readonly ArgumentDefinition[]
	? {
	[K in T[number] as K["optional"] extends true
		? K["default"] extends string
			? K["name"]
			: never
		: K["name"]]: K["type"] extends keyof ArgTypeMap
		? ArgTypeMap[K["type"]]
		: K["type"] extends { parse: (val: string) => unknown }
			? ReturnType<K["type"]["parse"]>
			: unknown;
} & {
	[K in T[number] as K["optional"] extends true
		? K["default"] extends string
			? never
			: K["name"]
		: never]?: K["type"] extends keyof ArgTypeMap
		? ArgTypeMap[K["type"]]
		: K["type"] extends { parse: (val: string) => unknown }
			? ReturnType<K["type"]["parse"]>
			: unknown;
}
	: Record<string, never>;

export interface CommandMeta {
	description: string;
	arguments?: readonly ArgumentDefinition[];
}

export type CommandHandler = (
	terminal: Terminal,
	args: Record<string, unknown>,
	signal: AbortSignal,
	allCommands: Commands
) => Promise<void> | void;

interface CommandModule {
	meta: CommandMeta;
	handler: CommandHandler;
}

export interface Command extends CommandMeta {
	loader: () => Promise<CommandModule>;
	sourceLoader: () => Promise<string>;
}

export type Commands = Record<string, Command>;

const commandMetaLoaders: Record<string, () => Promise<unknown>> =
	import.meta.glob("./*.{ts,tsx,js,jsx}", {
		import: "meta",
	});

const commandModuleLoaders: Record<string, () => Promise<unknown>> =
	import.meta.glob("./*.{ts,tsx,js,jsx}");
const commandSourceLoaders: Record<string, () => Promise<unknown>> =
	import.meta.glob("./*.{ts,tsx,js,jsx}", {
		query: "?raw",
		import: "default",
	});

async function buildCommands(): Promise<Commands> {
	const commands: Commands = {};
	for (const path in commandMetaLoaders) {
		if (path.endsWith("index.ts") || path.endsWith("index.js")) continue;

		const commandName = path
			.replace("./", "")
			.replace(/\.(ts|tsx|js|jsx)$/, "");

		const meta = (await commandMetaLoaders[path]()) as CommandMeta;

		commands[commandName] = {
			...meta,
			loader: commandModuleLoaders[path] as () => Promise<CommandModule>,
			sourceLoader: commandSourceLoaders[path] as () => Promise<string>,
		};
	}
	return commands;
}

export const commandsPromise: Promise<Commands> = buildCommands();

export const getCommandList = async (): Promise<string[]> => {
	const commands = await commandsPromise;
	return Object.keys(commands);
};

export async function getCommandHandler(
	commandName: string
): Promise<CommandHandler> {
	const commands = await commandsPromise;
	const command = commands[commandName];
	if (command && command.loader) {
		const module = await command.loader();
		return module.handler;
	}
	throw new Error(`Command handler not found for ${commandName}`);
}