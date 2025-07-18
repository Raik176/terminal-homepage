export const meta = {
    description: "list all available commands",
};

export const handler = (terminal, args, signal, allCommands) => {
    const commandList = Object.keys(allCommands);
    let output = "";
    const columns = 10;

    for (let i = 0; i < commandList.length; i += columns) {
        const row = commandList.slice(i, i + columns);
        output += "  " + row.map(cmd => (`[[cmd:${cmd}]]  `)).join("") + "\n";
    }

    output += `\n  - in total, ${commandList.length} commands have been implemented\n`;
    output += "  - use `[[cmd:man]] <cmd>` to get more information about a command\n";

    terminal.println(output);
};