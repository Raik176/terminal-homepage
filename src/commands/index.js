const commandMetaLoaders = import.meta.glob('./*.{js,jsx}', {
    import: 'meta',
});

const commandModuleLoaders = import.meta.glob('./*.{js,jsx}');
const commandSourceLoaders = import.meta.glob('./*.{js,jsx}', { query: '?raw', import: 'default' });

async function buildCommands() {
    const commands = {};
    for (const path in commandMetaLoaders) {
        if (path.endsWith('index.js')) continue;

        const commandName = path.replace('./', '').replace(/\.(js|jsx)$/, '');
        const meta = await commandMetaLoaders[path]();

        commands[commandName] = {
            ...meta,
            loader: commandModuleLoaders[path],
            sourceLoader: commandSourceLoaders[path],
        };
    }
    return commands;
}

export const commandsPromise = buildCommands();

export const getCommandList = async () => {
    const commands = await commandsPromise;
    return Object.keys(commands);
};

export const argumentTypes = {
    string: {
        validate: (value) => typeof value === "string",
        parse: (val) => val,
        suggestions: () => [],
    },
    boolean: {
        validate: (value) => value === "true" || value === "false",
        parse: (val) => val === "true",
        suggestions: (currentInput) => ["true", "false"].filter(val => val.startsWith(currentInput)),
    },
    command: {
        validate: async (value) => (await getCommandList()).includes(value),
        parse: (val) => val,
        suggestions: async (currentInput) => (await getCommandList()).filter(cmd => cmd.startsWith(currentInput)),
    },
    integer: {
        validate: (value) => Number.isInteger(Number(value)),
        parse: (value) => parseInt(value, 10),
        suggestions: () => [],
    },
};

export async function getCommandHandler(commandName) {
    const commands = await commandsPromise;
    const command = commands[commandName];
    if (command && command.loader) {
        const module = await command.loader();
        return module.handler;
    }
    throw new Error(`Command handler not found for ${commandName}`);
}