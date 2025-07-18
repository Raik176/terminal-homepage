export const meta = {
    description: "shows the help menu",
};

export const handler = (terminal, args, signal, allCommands) => {
    try {
        const lscmdsDesc = allCommands.lscmds.description;
        const manDesc = allCommands.man.description;

        terminal.println(` Welcome to the help menu!
 Here are some commands to try:

    [[cmd:lscmds]] ${lscmdsDesc}
    [[cmd:man]]    ${manDesc}`);

    } catch (e) {
        terminal.error(new Error("Could not load help information."));
    }
};