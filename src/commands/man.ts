import { Terminal } from "../components/Terminal";
import type {Command, DeriveArgs} from "./index";

interface ArgumentDefinition {
    name: string;
    shorthand?: string;
    optional?: boolean;
    description: string;
    type: string | { typeName?: string };
    default?: string;
}

export const meta = {
    description: "show the manual for a command",
    arguments: [
        {
            name: "command",
            shorthand: "c",
            optional: false,
            description: "the command to show the manual page for",
            type: "command"
        }
    ],
} as const;

export const handler = (
    terminal: Terminal,
    args: DeriveArgs<typeof meta.arguments>,
    _signal: AbortSignal,
    allCommands: Record<string, Command>
) => {
    const commandInfo = allCommands[args.command];
    if (!commandInfo) {
        terminal.println(`No manual entry for '${args.command}'`);
        return;
    }

    const generateManualBox = (manual: Record<string, string>): string => {
        const entries = Object.entries(manual);
        const maxKeyLength = Math.max(...entries.map(([key]) => key.length));
        const maxValueLength = Math.max(...entries.map(([, value]) => String(value).length));

        const topBorder = `+${"-".repeat(maxKeyLength + 2)}+${"-".repeat(maxValueLength + 2)}+`;
        const bottomBorder = topBorder;

        const boxContent = entries.map(([key, value]) => {
            const paddedKey = key.padEnd(maxKeyLength, ' ');
            const paddedValue = String(value).padEnd(maxValueLength, ' ');
            return `| ${paddedKey} | ${paddedValue} |`;
        }).join("\n");

        return `${topBorder}\n${boxContent}\n${bottomBorder}`;
    };

    const generateArgumentsTable = (argumentDefs: readonly ArgumentDefinition[]): string => {
        const headers = ["Argument", "Optional", "Description", "Type", "Default"];
        const columnWidths = headers.map(header => header.length);

        argumentDefs.forEach(arg => {
            const argumentText = arg.shorthand ? `-${arg.shorthand}, --${arg.name}` : `--${arg.name}`;
            const typeName = typeof arg.type === 'string' ? arg.type : (arg.type.typeName || 'custom');
            columnWidths[0] = Math.max(columnWidths[0], argumentText.length);
            columnWidths[1] = Math.max(columnWidths[1], String(arg.optional ? 'yes' : 'no').length);
            columnWidths[2] = Math.max(columnWidths[2], arg.description.length);
            columnWidths[3] = Math.max(columnWidths[3], typeName.length);
            columnWidths[4] = Math.max(columnWidths[4], String(arg.default ?? 'N/A').length);
        });

        const topBorder = `+${columnWidths.map(width => "-".repeat(width + 2)).join("+")}+`;
        const headerRow = `| ${headers.map((header, i) => header.padEnd(columnWidths[i], ' ')).join(" | ")} |`;
        const bottomBorder = topBorder;

        const tableContent = argumentDefs.map(arg => {
            const argumentText = arg.shorthand ? `-${arg.shorthand}, --${arg.name}` : `--${arg.name}`;
            const typeName = typeof arg.type === 'string' ? arg.type : (arg.type.typeName || 'custom');
            const row = [
                argumentText.padEnd(columnWidths[0], ' '),
                (arg.optional ? 'yes' : 'no').padEnd(columnWidths[1], ' '),
                arg.description.padEnd(columnWidths[2], ' '),
                typeName.padEnd(columnWidths[3], ' '),
                String(arg.default ?? 'N/A').padEnd(columnWidths[4], ' ')
            ].join(" | ");
            return `| ${row} |`;
        }).join("\n");

        return `${topBorder}\n${headerRow}\n${topBorder}\n${tableContent}\n${bottomBorder}`;
    };

    const manual = {
        name: args.command,
        description: commandInfo.description,
    };

    let manualBox = generateManualBox(manual);

    if (commandInfo.arguments && commandInfo.arguments.length > 0) {
        manualBox += "\n\n" + generateArgumentsTable(commandInfo.arguments);
    } else {
        manualBox += "\n\n" + generateManualBox({ arguments: "doesn't accept any arguments" });
    }

    terminal.println(manualBox);
};