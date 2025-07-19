import { createSignal, Show, Component } from "solid-js";
import { Terminal } from "../components/Terminal";
import type { Commands, DeriveArgs } from "./index";

interface CodeBlockProps {
	codeString: string;
	commandName: string;
}

const CodeBlock: Component<CodeBlockProps> = (props) => {
	const [isCollapsed, setIsCollapsed] = createSignal(false);

	const toggleCollapse = () => {
		setIsCollapsed(!isCollapsed());
	};

	return (
		<div
			class="font-mono my-2 rounded-md"
			style={{ border: "1px solid var(--bright-black)" }}
		>
			<div
				onClick={toggleCollapse}
				class="flex items-center p-2 cursor-pointer select-none hover:bg-[var(--bright-black)] transition-colors rounded-t-md"
				style={{ "background-color": "var(--selection-bg)" }}
			>
				<span
					class="w-4 text-center mr-3"
					style={{ color: "var(--green)" }}
				>
					{isCollapsed() ? "▶" : "▼"}
				</span>
				<span style={{ color: "var(--text-color)" }}>
					Source for{" "}
					<span
						class="font-bold"
						style={{ color: "var(--bright-white)" }}
					>
						{props.commandName}
					</span>
				</span>
			</div>

			<Show when={!isCollapsed()}>
				<div
					class="p-3 overflow-x-auto rounded-b-md"
					style={{ "background-color": "var(--background)" }}
				>
					<pre>
						<code
							class="language-javascript"
							ref={(el) => {
								if (el) {
									delete el.dataset.highlighted;
									window.hljs.highlightElement(el);
								}
							}}
						>
							{props.codeString}
						</code>
					</pre>
				</div>
			</Show>
		</div>
	);
};

export const meta = {
	description: "show the source code of a command",
	arguments: [
		{
			name: "command",
			shorthand: "c",
			optional: false,
			description: "the command to show the source code for",
			type: "command",
		},
	],
} as const;

export const handler = async (
	terminal: Terminal,
	args: DeriveArgs<typeof meta.arguments>,
	_signal: AbortSignal,
	allCommands: Commands
) => {
	const commandName = args.command;
	const commandToDisplay = allCommands[commandName];

	if (!commandToDisplay || !commandToDisplay.sourceLoader) {
		terminal.error(
			new Error(
				`Could not find source loader for command '${commandName}'.`
			)
		);
		return;
	}

	try {
		const sourceCode = await commandToDisplay.sourceLoader();
		terminal.println(() => (
			<CodeBlock
				codeString={sourceCode.trim()}
				commandName={commandName}
			/>
		));
	} catch (e: unknown) {
		terminal.error(
			new Error(
				`Could not get source for command '${commandName}'. Details: ${
					e instanceof Error ? e.message : String(e)
				}`
			)
		);
	}
};
