import { createSignal, Show } from "solid-js";

function CodeBlock({ codeString, commandName }) {
    const [isCollapsed, setIsCollapsed] = createSignal(false);

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed());
    };

    return (
        <div
            class="font-mono my-2 rounded-md"
            style={{ border: '1px solid var(--bright-black)' }}
        >
            <div
                onClick={toggleCollapse}
                class="flex items-center p-2 cursor-pointer select-none hover:bg-[var(--bright-black)] transition-colors rounded-t-md"
                style={{ 'background-color': 'var(--selection-bg)' }}
            >
                <span class="w-4 text-center mr-3" style={{ color: 'var(--green)' }}>
                    {isCollapsed() ? '▶' : '▼'}
                </span>
                <span style={{ color: 'var(--text-color)' }}>
                    Source for <span class="font-bold" style={{ color: 'var(--bright-white)' }}>{commandName}</span>
                </span>
            </div>

            <Show when={!isCollapsed()}>
                <div class="p-3 overflow-x-auto rounded-b-md" style={{ 'background-color': 'var(--background)' }}>
                    <pre>
                        <code
                            class="language-javascript"
                            ref={el => {
                                if (el) {
                                    delete el.dataset.highlighted;
                                    // noinspection JSUnresolvedReference
                                    window.hljs.highlightElement(el);
                                }
                            }}
                        >
                            {codeString}
                        </code>
                    </pre>
                </div>
            </Show>
        </div>
    );
}

export const meta = {
    description: "show the source code of a command",
    arguments: [
        {
            name: "command",
            shorthand: "c",
            optional: false,
            description: "the command to show the source code for",
            type: "command"
        }
    ]
};

export const handler = async (terminal, args, signal, allCommands) => {
    const commandName = args.command;
    const commandToDisplay = allCommands[commandName];

    if (!commandToDisplay || !commandToDisplay.sourceLoader) {
        terminal.error(new Error(`Could not find source loader for command '${commandName}'.`));
        return;
    }

    try {
        const sourceCode = await commandToDisplay.sourceLoader();
        terminal.println({
            html: (
                <CodeBlock codeString={sourceCode.trim()} commandName={commandName} />
            )
        });

    } catch (e) {
        terminal.error(new Error(`Could not get source for command '${commandName}'. Details: ${e.message}`));
    }
};