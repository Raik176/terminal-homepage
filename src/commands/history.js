export const meta = {
    description: "print command history",
};

export const handler = (terminal) => {
    for (let i = 0; i < terminal.commandHistory.length; i++) {
        terminal.println(` ${i}  ${terminal.commandHistory[i]}`);
    }
};