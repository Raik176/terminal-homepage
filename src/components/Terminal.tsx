import {
	createEffect,
	createSignal,
	onMount,
	type Component,
	For,
	JSX,
	Accessor,
	Setter,
} from "solid-js";
import { createStore, SetStoreFunction, Store } from "solid-js/store";
import "./Terminal.css";
import {
	argumentTypes,
	commandsPromise,
	getCommandList,
	getCommandHandler, ArgumentDefinition,
} from "../commands";
import { ANSI_COLORS, ArgumentError, getDate, InterruptError } from "../utils";
import { defaultTheme } from "../themes";

type OutputItem = string | { html: JSX.Element };

interface AnsiSegment {
	text: string;
	color: string;
	bgColor: string;
}

const user = "root";
const shellPrompt = `${ANSI_COLORS.GREEN}${user}@website${ANSI_COLORS.RESET}:${ANSI_COLORS.BLUE}~${ANSI_COLORS.RESET}$ `;

export class Terminal {
	private readonly setHistory: Setter<OutputItem[]>;
	private readonly setPromptMessage: Setter<string>;
	private readonly setCommandHistory: SetStoreFunction<string[]>;

	public readonly getPrompt: Accessor<string>;
	public readonly commandHistory: Store<string[]>;
	public promptResolver: ((value: string | null) => void) | null = null;

	constructor(
		setHistory: Setter<OutputItem[]>,
		promptSignal: [Accessor<string>, Setter<string>],
		commandHistoryStore: [Store<string[]>, SetStoreFunction<string[]>]
	) {
		this.setHistory = setHistory;

		const [getPrompt, setPrompt] = promptSignal;
		this.setPromptMessage = setPrompt;
		this.getPrompt = getPrompt;

		const [history, setCommandHistory] = commandHistoryStore;
		this.setCommandHistory = setCommandHistory;
		this.commandHistory = history;
	}

	public print(output: OutputItem): void {
		this.setHistory((history) => {
			const lastEntry = history[history.length - 1];
			if (
				lastEntry &&
				typeof output === "string" &&
				typeof lastEntry === "string"
			) {
				return [...history.slice(0, -1), lastEntry + output];
			} else {
				return [...history, output];
			}
		});
	}

	public println(output: OutputItem): void {
		this.print(typeof output === "string" ? output + "\n" : output);
	}

	public error(error: Error): void {
		console.error(error);
		this.println(
			`${ANSI_COLORS.RED}${error.name}:${ANSI_COLORS.RESET} ${error.message}`
		);
	}

	public clear(): void {
		this.setHistory([]);
	}

	public prompt(
		promptMessage: string,
		signal?: AbortSignal
	): Promise<string | null> {
		return new Promise((resolve, reject) => {
			if (signal?.aborted) {
				return reject(new DOMException("Aborted", "AbortError"));
			}

			const abortListener = () => {
				if (this.promptResolver) {
					this.promptResolver = null;
					this.setPromptMessage(shellPrompt);
					reject(new DOMException("Aborted", "AbortError"));
				}
			};

			this.promptResolver = (msg: string | null) => {
				signal?.removeEventListener("abort", abortListener);
				if (msg !== null) {
					this.println(promptMessage + msg);
				}
				resolve(msg);
			};

			signal?.addEventListener("abort", abortListener);
			this.setPromptMessage(promptMessage);
		});
	}

	public promptNumber(
		promptMessage: string = "Enter a number: ",
		signal?: AbortSignal
	): Promise<number> {
		return new Promise(async (resolve, reject) => {
			while (true) {
				try {
					const input = await this.prompt(promptMessage, signal);
					if (input === null) {
						// User cancelled via Ctrl+C
						reject(new InterruptError("Input cancelled by user."));
						break;
					}
					const number = parseInt(input, 10);
					if (!isNaN(number)) {
						resolve(number);
						break;
					}
					this.error(new Error("You must supply a valid number"));
				} catch (e) {
					reject(e);
					break;
				}
			}
		});
	}

	public getTheme(): string {
		return localStorage.getItem("theme") || defaultTheme;
	}

	public isPromptActive(): boolean {
		return this.getPrompt() !== shellPrompt;
	}

	public addCommand(cmd: string): void {
		this.setCommandHistory((prev) => [...prev, cmd]);
	}
}

const TerminalComponent: Component = () => {
	const [input, setInput] = createSignal("");
	const [history, setHistory] = createStore<OutputItem[]>([]);
	const [historyIndex, setHistoryIndex] = createSignal(-1);
	const [isBusy, setIsBusy] = createSignal(false);
	let inputElement: HTMLInputElement | undefined;
	let terminalElement: HTMLDivElement | undefined;
	let terminalWrapperDiv: HTMLDivElement | undefined;
	const [suggestion, setSuggestion] = createSignal("");
	const [feedback, setFeedback] = createSignal("");
	const [abortController, setAbortController] =
		createSignal<AbortController | null>(null);
	const [isAutoScrollActive, setIsAutoScrollActive] = createSignal(true);

	const terminal = new Terminal(
		setHistory,
		createSignal(shellPrompt),
		createStore<string[]>([])
	);

	const handleScroll = () => {
		if (terminalElement) {
			const { scrollTop, scrollHeight, clientHeight } = terminalElement;
			const atBottom = scrollHeight - scrollTop - clientHeight < 5;
			setIsAutoScrollActive(atBottom);
		}
	};

	createEffect(() => {
		void history.length;
		void feedback();

		if (terminalElement && isAutoScrollActive()) {
			setTimeout(() => {
				terminalElement!.scrollTop = terminalElement!.scrollHeight;
			}, 0);
		}
	});

	const validateAndParseArgument = async (
		value: string,
		argDef: ArgumentDefinition,
		parsedArgs: Record<string, unknown>
	): Promise<string | null> => {
		const typeDef =
			typeof argDef.type === "string"
				? argumentTypes[argDef.type as keyof typeof argumentTypes]
				: argDef.type;

		const typeName =
			typeof argDef.type === "string"
				? argDef.type
				: argDef.type.typeName || "custom";

		if (!typeDef || !(await typeDef.validate(value))) {
			return `Invalid value for '${argDef.name}': expected ${typeName}, got '${value}'.`;
		}

		parsedArgs[argDef.name] = typeDef.parse(value);
		return null;
	};

	const parseArguments = async (
		args: string[],
		argumentDefinitions: readonly ArgumentDefinition[]
	): Promise<{ args?: Record<string, unknown>; error?: string }> => {
		const parsedArgs: Record<string, unknown> = {};
		const argsCopy = [...args];

		for (const argDef of argumentDefinitions) {
			const longFlag = `--${argDef.name}`;
			const shortFlag = argDef.shorthand ? `-${argDef.shorthand}` : null;
			const flagIndex = argsCopy.findIndex(
				(a) => a === longFlag || (shortFlag && a === shortFlag)
			);

			if (flagIndex !== -1) {
				const flag = argsCopy[flagIndex];
				if (argsCopy.length <= flagIndex + 1) {
					return { error: `Missing value for option: '${flag}'.` };
				}
				const value = argsCopy[flagIndex + 1];

				const errorMessage = await validateAndParseArgument(
					value,
					argDef,
					parsedArgs
				);
				if (errorMessage) {
					return { error: errorMessage };
				}

				argsCopy.splice(flagIndex, 2);
			}
		}

		const positionalArgDefs = argumentDefinitions.filter(
			(def) => !parsedArgs.hasOwnProperty(def.name)
		);
		for (
			let i = 0;
			i < Math.min(argsCopy.length, positionalArgDefs.length);
			i++
		) {
			const argDef = positionalArgDefs[i];
			const value = argsCopy[i];

			const errorMessage = await validateAndParseArgument(
				value,
				argDef,
				parsedArgs
			);
			if (errorMessage) {
				return { error: errorMessage };
			}
		}

		for (const argDef of argumentDefinitions) {
			if (!parsedArgs.hasOwnProperty(argDef.name)) {
				if (argDef.optional && argDef.default !== undefined) {
					const typeDef =
						typeof argDef.type === "string"
							? argumentTypes[
									argDef.type as keyof typeof argumentTypes
								]
							: argDef.type;
					parsedArgs[argDef.name] = typeDef.parse(argDef.default);
				} else if (!argDef.optional) {
					return {
						error: `Missing required argument: '${argDef.name}'.`,
					};
				}
			}
		}

		return { args: parsedArgs };
	};

	const handleCommand = async (
		cmd: string,
		addToHistory: boolean = false
	): Promise<void> => {
		if (cmd.trim() === "") return;

		const actualCmd = cmd.trimStart();
		const [commandName, ...args] = actualCmd.split(/\s+/);
		const allCommands = await commandsPromise;

		if (addToHistory) {
			terminal.addCommand(actualCmd);
			setHistoryIndex(-1);
		}

		const command = allCommands[commandName];
		if (command) {
			setIsBusy(true);
			const controller = new AbortController();
			setAbortController(controller);

			try {
				let cmdArgs = {};
				if (command.arguments) {
					const parsed = await parseArguments(
						args,
						command.arguments
					);
					if (parsed.error) {
						terminal.error(new ArgumentError(parsed.error));
					} else {
						cmdArgs = parsed.args!;
						const handler = await getCommandHandler(commandName);
						await handler(
							terminal,
							cmdArgs,
							controller.signal,
							allCommands
						);
					}
				} else {
					const handler = await getCommandHandler(commandName);
					await handler(terminal, {}, controller.signal, allCommands);
				}
			} catch (err: unknown) {
				if (err instanceof Error && err.name === "AbortError") {
					terminal.error(
						new InterruptError("Command interrupted by user.")
					);
				} else {
					if (err instanceof Error) {
						terminal.error(err);
					} else {
						terminal.error(new Error(String(err)));
					}
				}
			} finally {
				setIsBusy(false);
				setAbortController(null);
			}
		} else {
			terminal.println(`${commandName}: command not found`);
		}
	};

	const handleKeyDown = (e: KeyboardEvent) => {
		if (e.ctrlKey && e.key === "c") {
			e.preventDefault();
			const controller = abortController();
			if (controller && isBusy()) {
				controller.abort();
			} else if (terminal.promptResolver) {
				terminal.println(terminal.getPrompt() + input() + "^C");
				terminal.promptResolver(null);
				setInput("");
			}
			return;
		}

		if (isBusy() && !terminal.isPromptActive()) return;

		switch (e.key) {
			case "Enter":
				if (terminal.promptResolver) {
					terminal.promptResolver(input());
				}
				setInput("");
				setSuggestion("");
				setFeedback("");
				break;
			case "Tab":
				if (suggestion()) {
					e.preventDefault();
					setInput(suggestion());
					setSuggestion("");
				}
				break;
			case "ArrowUp":
				e.preventDefault();
				if (historyIndex() < terminal.commandHistory.length - 1) {
					const newIndex = historyIndex() + 1;
					setHistoryIndex(newIndex);
					setInput(
						terminal.commandHistory[
							terminal.commandHistory.length - 1 - newIndex
						]
					);
				}
				break;
			case "ArrowDown":
				e.preventDefault();
				if (historyIndex() > 0) {
					const newIndex = historyIndex() - 1;
					setHistoryIndex(newIndex);
					setInput(
						terminal.commandHistory[
							terminal.commandHistory.length - 1 - newIndex
						]
					);
				} else if (historyIndex() === 0) {
					setHistoryIndex(-1);
					setInput("");
				}
				break;
		}
	};

	createEffect(() => {
		const updateSuggestionsAndFeedback = async () => {
			const PADDING = " ".repeat(16);
			const currentInput = input();
			const trimmedInput = currentInput.trimStart();

			if (terminal.isPromptActive() || !trimmedInput) {
				setSuggestion("");
				setFeedback("");
				return;
			}

			const allCommands = await commandsPromise;
			const parts = trimmedInput.split(/\s+/);
			const commandName = parts[0];

			if (parts.length === 1) {
				const commandName = parts[0];
				const commandList = await getCommandList();
				const allCommands = await commandsPromise;

				const matchingCommands = commandList.filter((cmd) =>
					cmd.startsWith(commandName)
				);

				if (
					matchingCommands.length > 0 &&
					matchingCommands[0] !== commandName
				) {
					setSuggestion(matchingCommands[0]);
				} else {
					setSuggestion("");
				}

				const isExactMatch = commandList.includes(commandName);

				if (isExactMatch) {
					const command = allCommands[commandName];
					setFeedback(
						`${PADDING}┌─\n${PADDING}│\n${PADDING}└ ${ANSI_COLORS.MAGENTA}${command.description || "No description available."}${ANSI_COLORS.RESET}`
					);
				} else {
					setFeedback(
						`${PADDING}┌─\n${PADDING}│\n${PADDING}└ ${ANSI_COLORS.RED}command not found${ANSI_COLORS.RESET}`
					);
				}

				return;
			}

			const command = allCommands[commandName];
			if (!command || !command.arguments) {
				setSuggestion("");
				setFeedback("");
				return;
			}

			const argInput = parts[parts.length - 1];
			const prevPart = parts[parts.length - 2];
			let argDef = null;

			if (
				prevPart?.startsWith("-") &&
				command.arguments.some(
					(a) =>
						(a.name === prevPart.replace(/^-+/, "") ||
							a.shorthand === prevPart.replace(/^-+/, "")) &&
						a.type !== "boolean"
				)
			) {
				const flagName = prevPart.replace(/^-+/, "");
				argDef = command.arguments.find(
					(a) => a.name === flagName || a.shorthand === flagName
				);
			} else {
				const providedFlags = new Set();
				parts.slice(1, -1).forEach((part) => {
					if (part.startsWith("-")) {
						const flagName = part.replace(/^-+/, "");
						const def = command.arguments!.find(
							(a) =>
								a.name === flagName || a.shorthand === flagName
						);
						if (def) providedFlags.add(def.name);
					}
				});
				const positionalArgDefs = command.arguments.filter(
					(a) => !providedFlags.has(a.name)
				);
				if (positionalArgDefs.length > 0) {
					argDef = positionalArgDefs[0];
				}
			}

			if (argDef) {
				const typeDef =
					typeof argDef.type === "string"
						? argumentTypes[
								argDef.type as keyof typeof argumentTypes
							]
						: argDef.type;
				if (typeDef?.suggestions) {
					const suggestions = await typeDef.suggestions(argInput);
					if (suggestions.length > 0) {
						const baseInput = currentInput.substring(
							0,
							currentInput.lastIndexOf(argInput)
						);
						setSuggestion(baseInput + suggestions[0]);
					} else {
						setSuggestion("");
					}
					const typeName =
						typeof argDef.type === "string"
							? argDef.type
							: argDef.type.typeName || "custom";
					const argName = argDef.shorthand
						? `-${argDef.shorthand}, --${argDef.name}`
						: `--${argDef.name}`;
					setFeedback(
						`${PADDING}┬─\n${PADDING}│\n${PADDING}└ ${argName} (${typeName}): ${argDef.description}`
					);
				}
			} else {
				setSuggestion("");
				setFeedback("");
			}
		};

		updateSuggestionsAndFeedback().then(() => {});
	});

	onMount(async () => {
		localStorage.setItem("lastLogin", getDate());
		document.addEventListener("mouseup", () => {
			if (!window.getSelection()?.toString()) {
				inputElement?.focus({ preventScroll: true });
			}
		});

		if (!localStorage.hasOwnProperty("start-commands")) {
			localStorage.setItem("start-commands", "helloworld");
		}
		const startupCommands = localStorage
			.getItem("start-commands")!
			.split(",")
			.filter((c) => c);
		for (const cmd of startupCommands) {
			await handleCommand(cmd, false);
		}

		// noinspection InfiniteLoopJS
		while (true) {
			const msg = await terminal.prompt(shellPrompt);
			if (msg === null) continue;
			await handleCommand(msg, true);
		}
	});

	createEffect(() => {
		if (!isBusy() || terminal.isPromptActive()) {
			inputElement?.focus();
		} else {
			terminalWrapperDiv?.focus();
		}
	});

	const parseAnsi = (text: string): AnsiSegment[] => {
		const segments: AnsiSegment[] = [];
		let currentText = "";
		let currentColor = "";
		let currentBgColor = "";

		for (let i = 0; i < text.length; i++) {
			if (text[i] === "\x1b" && text[i + 1] === "[") {
				if (currentText) {
					segments.push({
						text: currentText,
						color: currentColor,
						bgColor: currentBgColor,
					});
					currentText = "";
				}

				let code = "";
				i += 2;
				while (i < text.length && text[i] !== "m") {
					code += text[i];
					i++;
				}

				const codeParts = code.split(";");

				if (codeParts[0] === "0" || code === "") {
					currentColor = "";
					currentBgColor = "";
				} else {
					for (let j = 0; j < codeParts.length; j++) {
						const part = codeParts[j];
						const num = parseInt(part);
						if (num >= 30 && num <= 37) {
							currentColor = `color: ${getColor(num)};`;
						} else if (num >= 40 && num <= 47) {
							currentBgColor = `background-color: ${getColor(num - 10)};`;
						} else if (num >= 90 && num <= 97) {
							currentColor = `color: ${getBrightColor(num)};`;
						} else if (num >= 100 && num <= 107) {
							currentBgColor = `background-color: ${getBrightColor(num - 10)};`;
						} else if (num === 38 || num === 48) {
							const isBg = num === 48;
							const type = parseInt(codeParts[j + 1]);
							if (type === 5) {
								const colorIndex = parseInt(codeParts[j + 2]);
								const color = get256Color(colorIndex);
								if (isBg)
									currentBgColor = `background-color: ${color};`;
								else currentColor = `color: ${color};`;
								j += 2;
							} else if (type === 2) {
								const r = parseInt(codeParts[j + 2]);
								const g = parseInt(codeParts[j + 3]);
								const b = parseInt(codeParts[j + 4]);
								const rgbColor = `rgb(${r}, ${g}, ${b})`;
								if (isBg)
									currentBgColor = `background-color: ${rgbColor};`;
								else currentColor = `color: ${rgbColor};`;
								j += 4;
							}
						}
					}
				}
			} else {
				currentText += text[i];
			}
		}

		if (currentText) {
			segments.push({
				text: currentText,
				color: currentColor,
				bgColor: currentBgColor,
			});
		}
		return segments;
	};

	const getColor = (num: number) => {
		const colors = [
			"var(--black)",
			"var(--red)",
			"var(--green)",
			"var(--yellow)",
			"var(--blue)",
			"var(--magenta)",
			"var(--cyan)",
			"var(--white)",
		];
		return colors[num - 30];
	};

	const getBrightColor = (num: number) => {
		const colors = [
			"var(--bright-black)",
			"var(--bright-red)",
			"var(--bright-green)",
			"var(--bright-yellow)",
			"var(--bright-blue)",
			"var(--bright-magenta)",
			"var(--bright-cyan)",
			"var(--bright-white)",
		];
		return colors[num - 90];
	};

	const get256Color = (index: number) => {
		if (index < 8) return getColor(index + 30);
		if (index < 16) return getBrightColor(index - 8 + 90);
		if (index < 232) {
			const r = Math.floor((index - 16) / 36) * 51;
			const g = Math.floor(((index - 16) % 36) / 6) * 51;
			const b = ((index - 16) % 6) * 51;
			return `rgb(${r}, ${g}, ${b})`;
		}
		const gray = (index - 232) * 10 + 8;
		return `rgb(${gray}, ${gray}, ${gray})`;
	};

	const renderOutput = (
		output: OutputItem | null
	): JSX.Element | (JSX.Element | string)[] | undefined => {
		if (output === null) return;
		if (typeof output === "object" && output.html) {
			createEffect(() => {
				if (terminalElement) {
					const codeBlocks =
						terminalElement.querySelectorAll("pre code");
					codeBlocks.forEach((block) => {
						if (!block.classList.contains("hljs")) {
							window.hljs.highlightElement(block);
						}
					});
				}
			});
			return output.html;
		}

		const textOutput = String(output);
		const lines = textOutput.endsWith("\n")
			? textOutput.slice(0, -1).split("\n")
			: textOutput.split("\n");

		return lines.map((line, index) => {
			const segments = line
				.split(/(\[\[.*?]])/)
				.map((segment, segIndex) => {
					if (segment.startsWith("[[") && segment.endsWith("]]")) {
						const content = segment.slice(2, -2).trim();

						if (content.startsWith("cmd:")) {
							const command = content.substring(4);
							return (
								<span
									key={segIndex}
									class="command-span"
									onClick={() => {
										if (terminal.promptResolver) {
											terminal.promptResolver(command);
										}
										setInput("");
										setSuggestion("");
									}}
								>
									{command}
								</span>
							);
						}

						if (content.startsWith("href:")) {
							const url = content.substring(5);
							return (
								<a
									key={segIndex}
									href={url}
									target="_blank"
									rel="noopener noreferrer"
									class="link-span text-blue-400 underline hover:text-blue-300"
								>
									{url}
								</a>
							);
						}
					}

					return (
						<span key={segIndex}>
							{parseAnsi(segment).map(
								(ansiSegment, ansiIndex) => (
									<span
										key={ansiIndex}
										style={`${ansiSegment.color} ${ansiSegment.bgColor}`}
									>
										{ansiSegment.text}
									</span>
								)
							)}
						</span>
					);
				});

			return <div key={index}>{segments}</div>;
		});
	};

	return (
		<div
			ref={(el) => (terminalWrapperDiv = el)}
			class="h-screen flex flex-col pb-10"
			style={{
				"background-color": "var(--background)",
				color: "var(--text-color)",
			}}
			onKeyDown={handleKeyDown}
			tabindex="0"
		>
			<div class="flex-grow overflow-auto">
				<div
					ref={(el) => (terminalElement = el)}
					onScroll={handleScroll}
					aria-live="polite"
					aria-atomic="false"
					class="font-mono p-4 w-full h-full overflow-y-auto whitespace-pre-wrap"
					style={{
						"font-family": "'Fira Code', monospace",
						"max-height": "calc(100vh - 44px)",
						"background-color": "var(--background)",
					}}
				>
					<For each={history}>
						{(item) => <div>{renderOutput(item)}</div>}
					</For>
					{(!isBusy() || terminal.isPromptActive()) && (
						<>
							<div class="flex items-center w-full">
								<span style="white-space: pre;">
									{parseAnsi(terminal.getPrompt()).map(
										(segment, segIndex) => (
											<span
												key={segIndex}
												style={`${segment.color} ${segment.bgColor}`}
											>
												{segment.text}
											</span>
										)
									)}
								</span>
								<div class="flex-grow relative">
									<input
										ref={(el) => (inputElement = el)}
										type="text"
										value={input()}
										onInput={(e) =>
											setInput(e.currentTarget.value)
										}
										class="bg-transparent outline-none border-none w-full"
										autofocus
										autocomplete="off"
										aria-label="Terminal Input"
										id="prompt"
									/>
									{suggestion() && (
										<span
											class="absolute left-0 top-0 text-gray-500 pointer-events-none"
											style={`padding-left: ${input().length}ch;`}
										>
											{suggestion().substring(
												input().length
											)}
										</span>
									)}
								</div>
							</div>
							{feedback() && (
								<div class="text-gray-500 whitespace-pre">
									{parseAnsi(feedback()).map(
										(segment, segIndex) => (
											<span
												key={segIndex}
												style={`${segment.color} ${segment.bgColor}`}
											>
												{segment.text}
											</span>
										)
									)}
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default TerminalComponent;
