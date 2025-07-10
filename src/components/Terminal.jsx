import { createEffect, createSignal, onMount } from "solid-js";
import { For } from "solid-js/web";
import { createStore } from "solid-js/store";
import "./Terminal.css";

const ANSI_COLORS = {
    RESET: "\x1b[0m",
    BLACK: "\x1b[30m",
    RED: "\x1b[31m",
    GREEN: "\x1b[32m",
    YELLOW: "\x1b[33m",
    BLUE: "\x1b[34m",
    MAGENTA: "\x1b[35m",
    CYAN: "\x1b[36m",
    WHITE: "\x1b[37m",
    BRIGHT_BLACK: "\x1b[90m",
    BRIGHT_RED: "\x1b[91m",
    BRIGHT_GREEN: "\x1b[92m",
    BRIGHT_YELLOW: "\x1b[93m",
    BRIGHT_BLUE: "\x1b[94m",
    BRIGHT_MAGENTA: "\x1b[95m",
    BRIGHT_CYAN: "\x1b[96m",
    BRIGHT_WHITE: "\x1b[97m",
    BG_BLACK: "\x1b[40m",
    BG_RED: "\x1b[41m",
    BG_GREEN: "\x1b[42m",
    BG_YELLOW: "\x1b[43m",
    BG_BLUE: "\x1b[44m",
    BG_MAGENTA: "\x1b[45m",
    BG_CYAN: "\x1b[46m",
    BG_WHITE: "\x1b[47m",
    BG_BRIGHT_BLACK: "\x1b[100m",
    BG_BRIGHT_RED: "\x1b[101m",
    BG_BRIGHT_GREEN: "\x1b[102m",
    BG_BRIGHT_YELLOW: "\x1b[103m",
    BG_BRIGHT_BLUE: "\x1b[104m",
    BG_BRIGHT_MAGENTA: "\x1b[105m",
    BG_BRIGHT_CYAN: "\x1b[106m",
    BG_BRIGHT_WHITE: "\x1b[107m",
    FG_BLACK_BG_WHITE: "\x1b[30;47m",
};

const shellPrompt = `${ANSI_COLORS.GREEN}root@website${ANSI_COLORS.RESET}:${ANSI_COLORS.BLUE}{cwd}${ANSI_COLORS.RESET}$ `;

class ArgumentError extends Error {
    constructor(message) {
        super(message);
        this.name = "ArgumentError";
    }
}

class InterruptError extends Error {
    constructor(message) {
        super(message);
        this.name = "InterruptError";
    }
}

class Filesystem {
    constructor() {
        this.root = {
            type: 'directory',
            name: '~',
            children: {},
        };
        this.cwd = this.root;
        this.maxSize = 1024 * 1024;
    }

    getPath(node = this.cwd) {
        if (node === this.root) return '~';
        return `${this.getPath(node.parent)}/${node.name}`;
    }

    cd(path) {
        if (path === '~' || path === '/') {
            this.cwd = this.root;
            return;
        }

        const parts = path.split('/').filter(part => part !== '');
        let current = this.cwd;

        for (const part of parts) {
            if (part === '..') {
                if (current.parent) {
                    current = current.parent;
                }
            } else if (current.children && current.children[part] && current.children[part].type === 'directory') {
                current = current.children[part];
            } else {
                throw new Error(`cd: ${part}: No such directory`);
            }
        }

        this.cwd = current;
    }

    // Create a new directory
    mkdir(name) {
        const newDirSize = JSON.stringify({type: 'directory', name, children: {}}).length;
        this.checkSizeBeforeCreation(newDirSize);

        if (this.cwd.children) {
            if (this.cwd.children[name]) {
                throw new Error(`mkdir: ${name}: File or directory already exists`);
            }

            this.cwd.children[name] = {
                type: 'directory',
                name,
                children: {},
            };

            this.save();
        }
    }

    // Create a new file
    touch(name, content = '') {
        const newFileSize = JSON.stringify({type: 'file', name, content}).length;
        this.checkSizeBeforeCreation(newFileSize);

        if (this.cwd.children) {
            if (this.cwd.children[name]) {
                throw new Error(`touch: ${name}: File already exists`);
            }

            this.cwd.children[name] = {
                type: 'file',
                name,
                content,
            };

            this.save();
        }
    }

    rm(name) {
        if (!this.cwd.children || !this.cwd.children[name]) {
            throw new Error(`rm: ${name}: No such file or directory`);
        }
        delete this.cwd.children[name];
        this.save();
    }

    save() {
        const data = JSON.stringify(this.root);

        if (data.length > this.maxSize) {
            throw new Error('Filesystem size exceeds 1MB limit');
        }

        localStorage.setItem('filesystem', data);
    }

    // Calculate the size of the filesystem
    calculateSize(node = this.root) {
        let size = JSON.stringify(node).length;
        if (node.type === 'directory' && node.children) {
            for (const child of Object.values(node.children)) {
                size += this.calculateSize(child);
            }
        }
        return size;
    }

    // Check if the filesystem size exceeds the limit before creating a new item
    checkSizeBeforeCreation(newItemSize) {
        const currentSize = this.calculateSize();
        const newSize = currentSize + newItemSize;
        if (newSize > this.maxSize) {
            throw new Error('Filesystem size exceeds 1MB limit');
        }
    }

    // Load the filesystem from localStorage
    load() {
        const data = localStorage.getItem('filesystem');
        if (data) {
            this.root = JSON.parse(data);
            this.cwd = this.root;
        }
    }
}

class Terminal {
    #setPromptMessage;
    #setCommandHistory;
    #setHistory;
    fileSystem;

    constructor(setHistory, prompt, commandHistory) {
        this.#setHistory = setHistory;

        const [getPrompt, setPrompt] = prompt;
        this.#setPromptMessage = setPrompt;
        this.getPrompt = getPrompt;

        const [history, setCommandHistory] = commandHistory;
        this.#setCommandHistory = setCommandHistory;
        this.commandHistory = history;
        this.fileSystem = new Filesystem();
        this.fileSystem.load();
    }

    print(output) {
        this.#setHistory((history) => {
            const lastEntry = history[history.length - 1];
            if (lastEntry && typeof(output) === "string" && typeof(lastEntry) === "string") {
                return [...history.slice(0, -1), lastEntry + output];
            } else {
                return [...history, output];
            }
        });
    }

    formatPrompt(promptMessage) {
        return promptMessage.replaceAll("{cwd}", this.fileSystem.getPath());
    }

    println(output) {
        this.print(typeof(output) === "string" ? output + "\n" : output);
    }

    error(error) {
        console.log(error)
        this.println(`${ANSI_COLORS.RED}${error.name}:${ANSI_COLORS.RESET} ${error.message}`);
    }

    clear() {
        this.#setHistory([]);
    }

    prompt(promptMessage) {
        promptMessage = this.formatPrompt(promptMessage);
        return new Promise((resolve) => {
            this.promptResolver = (msg) => {
                this.println(promptMessage + msg)
                resolve(msg)
            };
            this.#setPromptMessage(promptMessage)
        })
    }

    promptNumber(promptMessage = "Enter a number: ") {
        return new Promise(async (resolve) => {
            while (true) {
                const input = await this.prompt(promptMessage);
                const number = parseInt(input, 10);

                if (!isNaN(number)) {
                    resolve(number);
                    break;
                }

                this.error(new Error("You must supply a valid number"));
            }
        });
    }

    isPromptActive() {
        return this.getPrompt() !== this.formatPrompt(shellPrompt);
    }

    addCommand(cmd) {
        this.#setCommandHistory([...this.commandHistory, cmd])
    }
}

function wrapText(text, wrapLength) {
    let wrappedText = "";
    for (let i = 0; i < text.length; i += wrapLength) {
        wrappedText += text.substring(i, i + wrapLength) + "\n";
    }
    return wrappedText.trim();
}

function getMotd() {
    return `Welcome to my website.
        
  System information as of ${getDate()}

   System load:           ${(Math.random() * (60 - 20) + 20).toFixed(2)}%
   Temperature:           ${Math.floor(Math.random() * (40 - 25) + 25)}°C
   Processes:             ${Math.floor(Math.random() * (155 - 60) + 60)}
   Users logged in:       0
   IPv4 address for eno1: ${generateRandomIPv4()}
  
Last login: ${localStorage.getItem('lastLogin') || 'Never'}
For a list of available commands, type "[[help]]".`;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const argumentTypes = {
    string: {
        validate: (value) => typeof value === "string",
        parse: (val) => val,
        suggestions: (currentInput) => []
    },
    boolean: {
        validate: (value) => value === "true" || value === "false",
        parse: (val) => val === "true",
        suggestions: (currentInput) => ["true", "false"].filter(val => val.startsWith(currentInput))
    },
    command: {
        validate: (value) => commands.hasOwnProperty(value),
        parse: (val) => val,
        suggestions: (currentInput) => Object.keys(commands).filter(cmd => cmd.startsWith(currentInput))
    },
    integer: {
        validate: (value) => Number.isInteger(Number(value)),
        parse: (value) => parseInt(value, 10),
        suggestions: (currentInput) => []
    },
};

const commands = {
    /*
    rm: {
        description: "remove a file or directory",
        arguments: [
            {
                name: "name",
                shorthand: "n",
                optional: false,
                description: "the name of the file or directory to remove",
                type: "string"
            }
        ],
        handler: (terminal, args) => {
            try {
                terminal.fileSystem.rm(args.name);
            } catch (error) {
                terminal.error(error);
            }
        }
    },
    touch: {
        description: "create a new file",
        arguments: [
            {
                name: "name",
                shorthand: "n",
                optional: false,
                description: "the name of the file to create",
                type: "string"
            }
        ],
        handler: (terminal, args) => {
            try {
                terminal.fileSystem.touch(args.name);
            } catch (error) {
                terminal.error(error);
            }
        }
    },
    mkdir: {
        description: "create a new directory",
        arguments: [
            {
                name: "name",
                shorthand: "n",
                optional: false,
                description: "the name of the directory to create",
                type: "string"
            }
        ],
        handler: (terminal, args) => {
            terminal.fileSystem.mkdir(args.name);
        }
    },
    ls: {
        description: "list directory contents",
        handler: (terminal) => {
            const cwd = terminal.fileSystem.cwd;
            const contents = Object.entries(cwd.children).map(([name, node]) => {
                if (node.type === 'directory') {
                    return `${ANSI_COLORS.BLUE}${name}${ANSI_COLORS.RESET}`;
                } else {
                    return name;
                }
            }).join("  ");

            terminal.println(contents);
        }
    },
    cd: {
        description: "change the current working directory",
        arguments: [
            {
                name: "path",
                shorthand: "p",
                optional: false,
                description: "the path to change to",
                type: "string"
            }
        ],
        handler: (terminal, args) => {
            terminal.fileSystem.cd(args.path);
        }
    },
    */
    fact: {
        description: "print a random (useless) fact",
        handler: async (terminal) => {
            const fact = await fetch("https://uselessfacts.jsph.pl/api/v2/facts/random");
            const res = await fact.json();

            terminal.println(res.text);
        }
    },
    "guess-number": {
        description: "play a number guessing game",
        handler: async (terminal) => {
            const number = Math.floor(Math.random() * 1000) + 1
            let tries = 0

            while (true) {
                let guess = await terminal.promptNumber("guess: ")
                tries++
                if (guess === number) {
                    break
                }
                if (guess < number) {
                    terminal.println(`too low! (${guess} < number)`)
                }
                if (guess > number) {
                    terminal.println(`too high! (${guess} > number)`)
                }
            }

            terminal.println(`You got it! took you ${tries} tries.`)
        }
    },
    /*
    quote: {
        description: "tells a random quote using Quotable",
        handler: async (terminal) => {
            const quote = await fetch("https://api.quotable.io/random?size=10");
            const res = await quote.json();
            terminal.println(`"${res.content}"`);
            terminal.println(`  - ${res.author}`)
        }
    },
     */
    joke: {
        description: "tells a random joke using JokeAPI",
        handler: async (terminal) => {
            const joke = await fetch("https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,racist,sexist,explicit");
            const res = await joke.json();
            if (res.error) {
                throw new Error("Could not fetch a joke.");
            }

            if (res.type === "twopart") {
                terminal.println(res.setup);
                terminal.println("...");
                await delay(1500);
                terminal.println(res.delivery);
            } else if (res.type === "single") {
                terminal.println(res.joke);
            } else {
                throw new Error("Unknown error during joke handling.");
            }
        }
    },
    history: {
        description: "print command history",
        handler: (terminal) => {
            for (let i = 0; i < terminal.commandHistory.length; i++) {
                terminal.println(` ${i}  ${terminal.commandHistory[i]}`);
            }
        }
    },
    date: {
        description: "print system date and time",
        handler: (terminal) => {
            terminal.println(new Date().toLocaleString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: true,
                timeZoneName: "short"
            }).replaceAll(",", ""));
        }
    },
    "not-found": {
        description: "Redirects you to the 404 not found page",
        handler: (terminal) => {
            window.location.href = "/404";
        }
    },
    helloworld: {
        description: "prints the motd (message of the day)",
        handler: (terminal) => {
            terminal.println(getMotd());
        }
    },
    whatday: {
        description: "get the day of the week for a specific date (format: DD.MM.YYYY)",
        arguments: [
            {
                name: "date",
                shorthand: "d",
                optional: false,
                description: "the date in DD.MM.YYYY format",
                type: "string"
            }
        ],
        handler: (terminal, args) => {
            const [day, month, year] = args.date.split('.').map(Number);
            const date = new Date(year, month - 1, day);

            if (isNaN(date.getTime()) || date.getDate() !== day || date.getMonth() + 1 !== month || date.getFullYear() !== year) {
                throw new Error("Invalid date format. Please use DD.MM.YYYY.");
            }

            const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
            const dayOfWeek = days[date.getDay()];
            const monthName = date.toLocaleString('default', { month: 'long' });
            const daySuffix = day === 1 ? "st" : day === 2 ? "nd" : day === 3 ? "rd" : "th";
            const isPast = date < new Date();
            const output = `the ${day}${daySuffix} of ${monthName} of the year ${date.getFullYear()} ${isPast ? "was" : "will be"} a ${dayOfWeek}`;

            terminal.println(output);
        }
    },
    reverse: {
        description: "reverse a message",
        arguments: [
            {
                name: "text",
                shorthand: "t",
                optional: false,
                description: "the message to reverse",
                type: "string"
            }
        ],
        handler: (terminal, args) => {
            terminal.println(args.text.split('').reverse().join(''));
        }
    },
    reboot: {
        description: "reboots the website",
        handler: () => {
            window.location.reload();
        }
    },
    pascal: {
        description: "print a pascal triangle",
        arguments: [
            {
                name: "depth",
                shorthand: "d",
                optional: false,
                description: "depth of the triangle",
                type: "integer"
            }
        ],
        handler: (terminal, args) => {
            const depth = args.depth;

            if (depth <= 0) {
                throw new Error("Depth must be a positive integer.")
            }

            const generatePascalsTriangle = (depth) => {
                const triangle = [];
                for (let i = 0; i < depth; i++) {
                    triangle[i] = [];
                    triangle[i][0] = 1;
                    for (let j = 1; j < i; j++) {
                        triangle[i][j] = triangle[i - 1][j - 1] + triangle[i - 1][j];
                    }
                    triangle[i][i] = 1;
                }
                return triangle;
            };

            const triangle = generatePascalsTriangle(depth);
            const maxNumber = Math.max(...triangle[triangle.length - 1]);
            const maxNumberLength = maxNumber.toString().length;

            let output = "";
            for (let i = 0; i < triangle.length; i++) {
                output += " ".repeat((triangle.length - i - 1) * (maxNumberLength + 1));
                for (let j = 0; j < triangle[i].length; j++) {
                    output += triangle[i][j].toString().padStart(maxNumberLength, " ") + " ";
                }
                output += "\n";
            }

            terminal.println(output);
        }
    },
    factor: {
        description: "print prime factors of a number",
        arguments: [
            {
                name: "number",
                shorthand: "n",
                optional: false,
                description: "number to factorize",
                type: "integer",
            },
        ],
        handler: (terminal, args) => {
            const isPrime = (i) => {
                if (i === 2) return true;
                for (let j = 2; j < Math.pow(i, 0.5) + 1; ++j) {
                    if (i % j === 0) return false;
                }
                return true;
            };
            const prime = (n) => {
                let result = [];
                for (let i = 2; i < Math.pow(n, 0.5); i++) {
                    if (n % i === 0 && isPrime(i)) result.push(i);
                    if (n % i === 0 && isPrime(n / i)) result.push(n / i);
                }
                return result.sort((a, b) => a - b);
            };

            terminal.println(`${args.number}: ${ANSI_COLORS.YELLOW}${prime(args.number).join(`${ANSI_COLORS.RESET}, ${ANSI_COLORS.YELLOW}`)}`);
        }
    },
    code: {
        description: "show the src code of a command",
        arguments: [
            {
                name: "command",
                shorthand: "c",
                optional: false,
                description: "",
                type: "command"
            }
        ],
        handler: (terminal, args) => {
            terminal.println({ html: (
                    <pre><code class="language-javascript">{commands[args.command].handler.toString()}</code></pre>
                ) });
        }
    },
    rand: {
        description: "generate a random number within a specified range",
        arguments: [
            {
                name: "min",
                optional: true,
                default: "1",
                description: "the minimum value (inclusive)",
                type: "integer",
            },
            {
                name: "max",
                optional: true,
                default: "100",
                description: "the maximum value (inclusive)",
                type: "integer",
            },
            {
                name: "float",
                shorthand: "f",
                optional: true,
                default: "false",
                description: "whether to generate a floating-point number instead of an integer",
                type: "boolean",
            },
        ],
        handler: (terminal, args) => {
            const min = args.min;
            const max = args.max;
            const isFloat = args.float;

            if (min > max) {
                throw new Error("The minimum value must be less than or equal to the maximum value.")
            }

            if (isFloat) {
                const randomFloat = Math.random() * (max - min) + min;
                terminal.println(randomFloat.toFixed(4));
            } else {
                const randomInt = Math.floor(Math.random() * (max - min + 1)) + min;
                terminal.println(randomInt.toString());
            }
        },
    },
    href: {
        description: "open a link in another tab",
        arguments: [
            {
                name: "url",
                shorthand: "u",
                optional: false,
                description: "url to open",
                type: "string"
            }
        ],
        handler: (terminal, args) => {
            window.open(args.url, '_blank');
        }
    },
    fibo: {
        description: "prints the Fibonacci sequence",
        arguments: [
            {
                name: "number",
                shorthand: "n",
                optional: true,
                default: "10",
                description: "number of elements to print",
                type: "integer",
            },
            {
                name: "phi",
                shorthand: "p",
                optional: true,
                default: "false",
                description: "calculate the golden ratio using the last two elements",
                type: "boolean",
            }
        ],
        handler: (terminal, args) => {
            const n = args.number;
            const calculatePhi = args.phi;

            if (n <= 0) {
                throw new Error("The number of elements to print must be greater than 0.")
            }

            let fibSequence = [0, 1];
            for (let i = 2; i < n; i++) {
                fibSequence.push(fibSequence[i - 1] + fibSequence[i - 2]);
            }

            let output = fibSequence.slice(0, n).join("\n");

            if (calculatePhi && n >= 2) {
                const last = fibSequence[n - 1];
                const secondLast = fibSequence[n - 2];
                const phi = last / secondLast;
                output += `\n${ANSI_COLORS.YELLOW}Golden Ratio (φ): ${phi}`;
            }

            terminal.println(output);
        }
    },
    echo: {
        description: "echoes your input",
        arguments: [
            {
                name: "input",
                shorthand: "i",
                optional: true,
                default: " ",
                type: "string",
                description: "",
            }
        ],
        handler: (terminal, args) => {
            terminal.println(args.input);
        }
    },
    calendar: {
        description: "prints a textual calendar",
        arguments: [
            {
                name: "month",
                shorthand: "m",
                optional: true,
                description: "The month to display (1-12)",
                type: "integer",
            },
            {
                name: "year",
                shorthand: "y",
                optional: true,
                description: "The year to display",
                type: "integer",
            },
        ],
        handler: (terminal, args) => {
            const now = new Date();
            const year = args.year || now.getFullYear();
            const month = args.month ? args.month - 1 : now.getMonth();

            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const daysInMonth = lastDay.getDate();
            const firstDayOfWeek = firstDay.getDay();

            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const monthName = monthNames[month];

            let calendar = `     ${ANSI_COLORS.YELLOW}${monthName} ${year}     \n`;
            calendar += "Mo Tu We Th Fr Sa Su\n";

            let day = 1;
            let today = new Date().getDate();
            for (let i = 0; i < 6; i++) {
                for (let j = 0; j < 7; j++) {
                    if (i === 0 && j < (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1)) {
                        calendar += "   ";
                    } else if (day <= daysInMonth) {
                        if (day === today && now.getMonth() === month && now.getFullYear() === year) {
                            calendar += `${ANSI_COLORS.FG_BLACK_BG_WHITE}${day < 10 ? " " : ""}${day} ${ANSI_COLORS.RESET}`;
                        } else {
                            calendar += (day < 10 ? " " : "") + day + " ";
                        }
                        day++;
                    } else {
                        calendar += "   ";
                    }
                }
                calendar += "\n";
                if (day > daysInMonth) {
                    break;
                }
            }

            terminal.println(calendar);
        }
    },
    pi: {
        description: "calculate π to the n-th digit",
        arguments: [
            {
                name: "digits",
                shorthand: "d",
                optional: true,
                default: "100",
                description: "Number of digits",
                type: "integer",
            },
            {
                name: "wrap",
                shorthand: "w",
                optional: true,
                default: "true",
                description: "Whether to split the output into lines",
                type: "boolean",
            }
        ],
        handler: (terminal, args) => {
            let i = 1n
            let x = 3n * (10n ** (BigInt(args.digits - 2) + 20n))
            let pi = x

            while (x > 0) {
                x = x * i / ((i + 1n) * 4n)
                pi += x / (i + 2n)
                i += 2n
            }

            let res = "3." + (pi / (10n ** 20n)).toString().slice(1)
            if (args.wrap) {
                res = wrapText(res, 75);
            }

            terminal.println(res);
        }
    },
    help: {
        description: "shows the help menu",
        handler: (terminal) => {
            terminal.println(` Welcome to the help menu!
 Here are some commands to try:

    [[lscmds]] ${commands["lscmds"].description}
    [[man]]    ${commands["man"].description}`);
        }
    },
    letters: {
        description: "converts the input into ASCII art",
        arguments: [
            {
                name: "text",
                shorthand: "t",
                optional: false,
                description: "the text to convert to ASCII art",
                type: "string"
            }
        ],
        handler: (terminal, args) => {
            const mappings = {
                "a": "          \n          \n .oooo.   \n`P  )88b  \n .oP\"888  \nd8(  888  \n`Y888\"\"8o \n          \n          \n          ",
                "b": " .o8       \n\"888       \n 888oooo.  \n d88' `88b \n 888   888 \n 888   888 \n `Y8bod8P' \n           \n           \n           ",
                "c": "          \n          \n .ooooo.  \nd88' `\"Y8 \n888       \n888   .o8 \n`Y8bod8P' \n          \n          \n          ",
                "d": "      .o8  \n     \"888  \n .oooo888  \nd88' `888  \n888   888  \n888   888  \n`Y8bod88P\" \n           \n           \n           ",
                "e": "          \n          \n .ooooo.  \nd88' `88b \n888ooo888 \n888    .o \n`Y8bod8P' \n          \n          \n          ",
                "f": " .o88o. \n 888 `\" \no888oo  \n 888    \n 888    \n 888    \no888o   \n        \n        \n        ",
                "g": "           \n           \n .oooooooo \n888' `88b  \n888   888  \n`88bod8P'  \n`8oooooo.  \nd\"     YD  \n\"Y88888P'  \n           ",
                "h": "oooo        \n`888        \n 888 .oo.   \n 888P\"Y88b  \n 888   888  \n 888   888  \no888o o888o \n            \n            \n            ",
                "i": " o8o  \n `\"'  \noooo  \n`888  \n 888  \n 888  \no888o \n      \n      \n      ",
                "j": "    o8o \n    `\"' \n   oooo \n   `888 \n    888 \n    888 \n    888 \n    888 \n.o. 88P \n`Y888P  ",
                "k": "oooo        \n`888        \n 888  oooo  \n 888 .8P'   \n 888888.    \n 888 `88b.  \no888o o888o \n            \n            \n            ",
                "l": "oooo  \n`888  \n 888  \n 888  \n 888  \n 888  \no888o \n      \n      \n      ",
                "m": "                  \n                  \nooo. .oo.  .oo.   \n`888P\"Y88bP\"Y88b  \n 888   888   888  \n 888   888   888  \no888o o888o o888o \n                  \n                  \n                  ",
                "n": "            \n            \nooo. .oo.   \n`888P\"Y88b  \n 888   888  \n 888   888  \no888o o888o \n            \n            \n            ",
                "o": "          \n          \n .ooooo.  \nd88' `88b \n888   888 \n888   888 \n`Y8bod8P' \n          \n          \n          ",
                "p": "           \n           \noo.ooooo.  \n 888' `88b \n 888   888 \n 888   888 \n 888bod8P' \n 888       \no888o      \n           ",
                "q": "           \n           \n .ooooo oo \nd88' `888  \n888   888  \n888   888  \n`V8bod888  \n      888. \n      8P'  \n      \"    ",
                "r": "         \n         \noooo d8b \n`888\"\"8P \n 888     \n 888     \nd888b    \n         \n         \n         ",
                "s": "         \n         \n .oooo.o \nd88(  \"8 \n`\"Y88b.  \no.  )88b \n8\"\"888P' \n         \n         \n         ",
                "t": "    .   \n  .o8   \n.o888oo \n  888   \n  888   \n  888 . \n  \"888\" \n        \n        \n        ",
                "u": "            \n            \noooo  oooo  \n`888  `888  \n 888   888  \n 888   888  \n `V88V\"V8P' \n            \n            \n            ",
                "v": "            \n            \noooo    ooo \n `88.  .8'  \n  `88..8'   \n   `888'    \n    `8'     \n            \n            \n            ",
                "w": "                 \n                 \noooo oooo    ooo \n `88. `88.  .8'  \n  `88..]88..8'   \n   `888'`888'    \n    `8'  `8'     \n                 \n                 \n                 ",
                "x": "            \n            \noooo    ooo \n `88b..8P'  \n   Y888'    \n .o8\"'88b   \no88'   888o \n            \n            \n            ",
                "y": "            \n            \noooo    ooo \n `88.  .8'  \n  `88..8'   \n   `888'    \n    .8'     \n.o..P'      \n`Y8P'       \n            ",
                "z": "           \n           \n  oooooooo \n d'\"\"7d8P  \n   .d8P'   \n .d8P'  .P \nd8888888P  \n           \n           \n           ",
                "A": "      .o.       \n     .888.      \n    .8\"888.     \n   .8' `888.    \n  .88ooo8888.   \n .8'     `888.  \no88o     o8888o \n                \n                \n                ",
                "B": "oooooooooo.  \n`888'   `Y8b \n 888     888 \n 888oooo888' \n 888    `88b \n 888    .88P \no888bood8P'  \n             \n             \n             ",
                "C": "  .oooooo.   \n d8P'  `Y8b  \n888          \n888          \n888          \n`88b    ooo  \n `Y8bood8P'  \n             \n             \n             ",
                "D": "oooooooooo.   \n`888'   `Y8b  \n 888      888 \n 888      888 \n 888      888 \n 888     d88' \no888bood8P'   \n              \n              \n              ",
                "E": "oooooooooooo \n`888'     `8 \n 888         \n 888oooo8    \n 888    \"    \n 888       o \no888ooooood8 \n             \n             \n             ",
                "F": "oooooooooooo \n`888'     `8 \n 888         \n 888oooo8    \n 888    \"    \n 888         \no888o        \n             \n             \n             ",
                "G": "  .oooooo.    \n d8P'  `Y8b   \n888           \n888           \n888     ooooo \n`88.    .88'  \n `Y8bood8P'   \n              \n              \n              ",
                "H": "ooooo   ooooo \n`888'   `888' \n 888     888  \n 888ooooo888  \n 888     888  \n 888     888  \no888o   o888o \n              \n              \n              ",
                "I": "ooooo \n`888' \n 888  \n 888  \n 888  \n 888  \no888o \n      \n      \n      ",
                "J": "   oooo \n   `888 \n    888 \n    888 \n    888 \n    888 \n.o. 88P \n`Y888P  \n        \n        ",
                "K": "oooo    oooo \n`888   .8P'  \n 888  d8'    \n 88888[      \n 888`88b.    \n 888  `88b.  \no888o  o888o \n             \n             \n             ",
                "L": "ooooo        \n`888'        \n 888         \n 888         \n 888         \n 888       o \no888ooooood8 \n             \n             \n             ",
                "M": "ooo        ooooo \n`88.       .888' \n 888b     d'888  \n 8 Y88. .P  888  \n 8  `888'   888  \n 8    Y     888  \no8o        o888o \n                 \n                 \n                 ",
                "N": "ooooo      ooo \n`888b.     `8' \n 8 `88b.    8  \n 8   `88b.  8  \n 8     `88b.8  \n 8       `888  \no8o        `8  \n               \n               \n               ",
                "O": "  .oooooo.   \n d8P'  `Y8b  \n888      888 \n888      888 \n888      888 \n`88b    d88' \n `Y8bood8P'  \n             \n             \n             ",
                "P": "ooooooooo.   \n`888   `Y88. \n 888   .d88' \n 888ooo88P'  \n 888         \n 888         \no888o        \n             \n             \n             ",
                "Q": "  .oooooo.      \n d8P'  `Y8b     \n888      888    \n888      888    \n888      888    \n`88b    d88b    \n `Y8bood8P'Ybd' \n                \n                \n                ",
                "R": "ooooooooo.   \n`888   `Y88. \n 888   .d88' \n 888ooo88P'  \n 888`88b.    \n 888  `88b.  \no888o  o888o \n             \n             \n             ",
                "S": " .oooooo..o \nd8P'    `Y8 \nY88bo.      \n `\"Y8888o.  \n     `\"Y88b \noo     .d8P \n8\"\"88888P'  \n            \n            \n            ",
                "T": "ooooooooooooo \n8'   888   `8 \n     888      \n     888      \n     888      \n     888      \n    o888o     \n              \n              \n              ",
                "U": "ooooo     ooo \n`888'     `8' \n 888       8  \n 888       8  \n 888       8  \n `88.    .8'  \n   `YbodP'    \n              \n              \n              ",
                "V": "oooooo     oooo \n `888.     .8'  \n  `888.   .8'   \n   `888. .8'    \n    `888.8'     \n     `888'      \n      `8'       \n                \n                \n                ",
                "W": "oooooo   oooooo     oooo \n `888.    `888.     .8'  \n  `888.   .8888.   .8'   \n   `888  .8'`888. .8'    \n    `888.8'  `888.8'     \n     `888'    `888'      \n      `8'      `8'       \n                         \n                         \n                         ",
                "X": "ooooooo  ooooo \n `8888    d8'  \n   Y888..8P    \n    `8888'     \n   .8PY888.    \n  d8'  `888b   \no888o  o88888o \n               \n               \n               ",
                "Y": "oooooo   oooo \n `888.   .8'  \n  `888. .8'   \n   `888.8'    \n    `888'     \n     888      \n    o888o     \n              \n              \n              ",
                "Z": " oooooooooooo \nd'\"\"\"\"\"\"d888' \n      .888P   \n     d888'    \n   .888P      \n  d888'    .P \n.8888888888P  \n              \n              \n              ",
                "0": "  .oooo.   \n d8P'`Y8b  \n888    888 \n888    888 \n888    888 \n`88b  d88' \n `Y8bd8P'  \n           \n           \n           ",
                "1": "  .o  \no888  \n 888  \n 888  \n 888  \n 888  \no888o \n      \n      \n      ",
                "2": "  .oooo.   \n.dP\"\"Y88b  \n      ]8P' \n    .d8P'  \n  .dP'     \n.oP     .o \n8888888888 \n           \n           \n           ",
                "3": "  .oooo.   \n.dP\"\"Y88b  \n      ]8P' \n    <88b.  \n     `88b. \no.   .88P  \n`8bd88P'   \n           \n           \n           ",
                "4": "      .o   \n    .d88   \n  .d'888   \n.d'  888   \n88ooo888oo \n     888   \n    o888o  \n           \n           \n           ",
                "5": "  oooooooo \n dP\"\"\"\"\"\"\" \nd88888b.   \n    `Y88b  \n      ]88  \no.   .88P  \n`8bd88P'   \n           \n           \n           ",
                "6": "    .ooo   \n  .88'     \n d88'      \nd888P\"Ybo. \nY88[   ]88 \n`Y88   88P \n `88bod8'  \n           \n           \n           ",
                "7": " ooooooooo \nd\"\"\"\"\"\"\"8' \n      .8'  \n     .8'   \n    .8'    \n   .8'     \n  .8'      \n           \n           \n           ",
                "8": " .ooooo.   \nd88'   `8. \nY88..  .8' \n `88888b.  \n.8'  ``88b \n`8.   .88P \n `boood8'  \n           \n           \n           ",
                "9": " .ooooo.   \n888' `Y88. \n888    888 \n `Vbood888 \n      888' \n    .88P'  \n  .oP'     \n           \n           \n           ",
                "!": ".o. \n888 \n888 \nY8P \n`8' \n.o. \nY8P \n    \n    \n    ",
                "?": " .oooooo.  \ndP'   `Y8b \n88o   .d8P \n`\"' .d8P'  \n   `88'    \n   .o.     \n   Y8P     \n           \n           \n           ",
                ".": "    \n    \n    \n    \n    \n.o. \nY8P \n    \n    \n    ",
                ",": "    \n    \n    \n    \n    \n.o. \nY8P \n '  \n    \n    ",
                " ": "          \n          \n          \n          \n          \n          \n          \n          \n          \n          ",
            };

            const text = args.text;
            const asciiLines = [];

            for (let i = 0; i < 10; i++) {
                asciiLines.push("");
            }

            for (let i = 0; i < text.length; i++) {
                const char = text[i];
                if (mappings[char]) {
                    const charLines = mappings[char].split("\n");

                    for (let j = 0; j < charLines.length; j++) {
                        asciiLines[j] += charLines[j] + " ";
                    }
                } else {
                    throw new Error(`Character '${char}' not supported`)
                }
            }

            terminal.println(asciiLines.join("\n"));
        }
    },
    lscmds: {
        description: "list all available commands",
        handler: (terminal) => {
            const commandList = Object.keys(commands);

            let output = "";
            const columns = 10;

            for (let i = 0; i < commandList.length; i += columns) {
                const row = commandList.slice(i, i + columns);
                output += "  " + row.map(cmd => (`[[${cmd}]]  `)).join("") + "\n";
            }

            output += `\n  - in total, ${commandList.length} commands have been implemented\n`;
            output += "  - use `[[man]] <cmd>` to get more information about a command\n";

            terminal.println(output);
        }
    },
    man: {
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
        handler: (terminal, args) => {
            const generateManualBox = (manual) => {
                const entries = Object.entries(manual);
                const maxKeyLength = Math.max(...entries.map(([key]) => key.length));
                const maxValueLength = Math.max(...entries.map(([_, value]) => value.length));

                const topBorder = `+${"-".repeat(maxKeyLength + 2)}+${"-".repeat(maxValueLength + 2)}+`;
                const bottomBorder = topBorder;

                let boxContent = entries.map(([key, value]) => {
                    const paddedKey = key.padEnd(maxKeyLength, ' ');
                    const paddedValue = value.padEnd(maxValueLength, ' ');
                    return `| ${paddedKey} | ${paddedValue} |`;
                }).join("\n");

                return `${topBorder}\n${boxContent}\n${bottomBorder}`;
            };

            const generateArgumentsTable = (arguments2) => {
                const headers = ["Argument", "Optional", "Description", "Type", "Default"];
                const columnWidths = headers.map(header => header.length);

                arguments2.forEach(arg => {
                    const argumentText = arg.shorthand ? `-${arg.shorthand}, --${arg.name}` : `--${arg.name}`;
                    columnWidths[0] = Math.max(columnWidths[0], argumentText.length);

                    columnWidths[1] = Math.max(columnWidths[1], arg.optional ? 'yes'.length : 'no'.length);
                    columnWidths[2] = Math.max(columnWidths[2], arg.description.length);
                    columnWidths[3] = Math.max(columnWidths[3], arg.type.length);
                    columnWidths[4] = Math.max(columnWidths[4], (arg.default || 'N/A').length);
                });

                const topBorder = `+${columnWidths.map(width => "-".repeat(width + 2)).join("+")}+`;
                const headerRow = `| ${headers.map((header, i) => header.padEnd(columnWidths[i], ' ')).join(" | ")} |`;
                const bottomBorder = topBorder;

                let tableContent = arguments2.map(arg => {
                    const argumentText = arg.shorthand ? `-${arg.shorthand}, --${arg.name}` : `--${arg.name}`;

                    const row = [
                        argumentText.padEnd(columnWidths[0], ' '),
                        (arg.optional ? 'yes' : 'no').padEnd(columnWidths[1], ' '),
                        arg.description.padEnd(columnWidths[2], ' '),
                        arg.type.padEnd(columnWidths[3], ' '),
                        (arg.default || 'N/A').padEnd(columnWidths[4], ' ')
                    ].join(" | ");
                    return `| ${row} |`;
                }).join("\n");

                return `${topBorder}\n${headerRow}\n${topBorder}\n${tableContent}\n${bottomBorder}`;
            };

            const command = args.command;
            const commandInfo = commands[command];
            if (!commandInfo) {
                terminal.println(`No manual entry for '${command}'`);
                return;
            }

            const manual = {
                name: command,
                description: commandInfo.description,
            };

            let manualBox = generateManualBox(manual);

            if (commandInfo.arguments && commandInfo.arguments.length > 0) {
                manualBox += "\n\n" + generateArgumentsTable(commandInfo.arguments);
            } else {
                manualBox += "\n\n" + generateManualBox({ arguments: "doesn't accept any arguments" });
            }

            terminal.println(manualBox);
        }
    },
    clear: {
        description: "clears the terminal",
        handler: (terminal) => {
            terminal.clear();
        },
    }
};

function getDate() {
    const formattedDate = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
        hour12: false,
    }).format(new Date());

    return formattedDate.replace(/(\w+)\s+(\d+)/, '$1\u00A0$2');
}

function generateRandomIPv4() {
    const randomByte = () => Math.floor(Math.random() * 256);
    return `${randomByte()}.${randomByte()}.${randomByte()}.${randomByte()}`;
}

function TerminalComponent() {
    const [input, setInput] = createSignal("");
    const [history, setHistory] = createStore([]);
    const [historyIndex, setHistoryIndex] = createSignal(-1);
    let inputElement;
    let terminalElement;
    const [suggestion, setSuggestion] = createSignal("");
    const [feedback, setFeedback] = createSignal("");
    const [abortController, setAbortController] = createSignal();

    let wasAtBottom = true;
    const updateScroll = () => {
        if (terminalElement && wasAtBottom) {
            terminalElement.scrollTop = terminalElement.scrollHeight;
        }
    };
    const terminal = new Terminal(setHistory, createSignal(shellPrompt), createStore([]));

    createEffect(updateScroll, [feedback(), history]);

    const withAbortHandler = (handler) => {
        if (handler === undefined || handler === null) return () => {}
        return async (terminal, args, signal) => {
            return new Promise((resolve, reject) => {
                const onAbort = () => {
                    reject(new InterruptError("Pressed [^C]"));
                };

                signal.addEventListener("abort", onAbort, { once: true });

                handler(terminal, args);
                signal.removeEventListener("abort", onAbort);
                resolve();
            });
        };
    }

    const handleCommand = async (cmd, addToHistory = false) => {
        if (cmd === "") return;

        if (terminalElement) {
            wasAtBottom =
                terminalElement.scrollHeight - terminalElement.scrollTop ===
                terminalElement.clientHeight;
        }

        let actualCmd = cmd.trimStart();
        let [command, ...args] = actualCmd.split(/\s+/);

        if (addToHistory) {
            terminal.addCommand(actualCmd);
            setHistoryIndex(-1);
        }

        let commandHandler = commands[command];

        if (commandHandler) {
            const controller = new AbortController();
            setAbortController(controller);
            let cmdArgs = {}
            if (commandHandler.arguments) {
                const parsedArgs = parseArguments(actualCmd, args, commandHandler.arguments);
                if (parsedArgs.error) {
                    terminal.error(new ArgumentError(parsedArgs.error));
                    return
                } else {
                    cmdArgs = parsedArgs.args;
                }
            }
            try {
                //await withAbortHandler(commandHandler.handler)(terminal, cmdArgs, controller.signal);
                await commandHandler.handler(terminal, cmdArgs);
            } catch (err) {
                terminal.error(err);
            }
        } else {
            terminal.println(`${command}: command not found`)
        }

        updateScroll();
    };

    if (!localStorage.hasOwnProperty("start-commands")) {
        localStorage.setItem("start-commands", "helloworld");
    }
    localStorage.getItem("start-commands").split(",").forEach(async (cmd) => {
        await handleCommand(cmd);
    });

    const parseArguments = (cmd, args, argumentDefinitions) => {
        const parsedArgs = {};
        let i = 0;

        while (i < args.length) {
            const arg = args[i];
            if (arg.startsWith("--")) {
                const argName = arg.slice(2);
                const argDef = argumentDefinitions.find(def => def.name === argName);
                if (!argDef) {
                    return { error: `Unknown option: '${arg}'. Use 'man' to see available options.` };
                }
                if (i + 1 >= args.length) {
                    return { error: `Missing value for option: '${arg}'. Expected a value of type '${argDef.type}'.` };
                }
                const value = args[i + 1];
                const type = argDef.type || "string";
                if (!argumentTypes[type].validate(value)) {
                    return { error: `Invalid value for option '${arg}': expected type '${type}', but got '${value}'.` };
                }
                parsedArgs[argDef.name] = argumentTypes[type].parse(value);
                i += 2;
            } else if (arg.startsWith("-")) {
                const shorthand = arg.slice(1);
                const argDef = argumentDefinitions.find(def => def.shorthand === shorthand);
                if (!argDef) {
                    return { error: `Unknown shorthand option: '${arg}'. Use 'man' to see available options.` };
                }
                if (i + 1 >= args.length) {
                    return { error: `Missing value for option: '${arg}'. Expected a value of type '${argDef.type}'.` };
                }
                const value = args[i + 1];
                const type = argDef.type || "string";
                if (!argumentTypes[type].validate(value)) {
                    return { error: `Invalid value for option '${arg}': expected type '${type}', but got '${value}'.` };
                }
                parsedArgs[argDef.name] = argumentTypes[type].parse(value);
                i += 2;
            } else {
                const argDef = argumentDefinitions[i];
                if (!argDef) {
                    return { error: `Unexpected argument: '${arg}' at position ${i + 1}. Use 'man' to see the correct usage.` };
                }
                const value = arg;
                const type = argDef.type || "string";
                if (!argumentTypes[type].validate(value)) {
                    return { error: `Invalid value for argument '${argDef.name}': expected type '${type}', but got '${value}'.` };
                }
                parsedArgs[argDef.name] = argumentTypes[type].parse(value);
                i += 1;
            }
        }

        for (const argDef of argumentDefinitions) {
            if (!parsedArgs[argDef.name] && argDef.optional && argDef.default !== undefined) {
                parsedArgs[argDef.name] = argumentTypes[argDef.type].parse(argDef.default);
            }
        }

        for (const argDef of argumentDefinitions) {
            if (!argDef.optional && !parsedArgs[argDef.name]) {
                return { error: `Missing required argument: '${argDef.name}'. This argument is required and must be of type '${argDef.type}'.` };
            }
        }

        return { args: parsedArgs };
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            if (terminal.promptResolver !== null) {
                terminal.promptResolver(input());
            }
            setInput("");
            setSuggestion("");
            setFeedback("");
        } else if (e.key === "Tab" && suggestion()) {
            e.preventDefault();
            setInput(suggestion());
            setSuggestion("");
        } else if (e.ctrlKey && e.key === 'c') {
            const controller = abortController();
            if (controller) {
                controller.abort();
            }
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (historyIndex() < terminal.commandHistory.length - 1) {
                setHistoryIndex(historyIndex() + 1);
                setInput(terminal.commandHistory[terminal.commandHistory.length - 1 - historyIndex()]);
            }
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (historyIndex() > 0) {
                setHistoryIndex(historyIndex() - 1);
                setInput(terminal.commandHistory[terminal.commandHistory.length - 1 - historyIndex()]);
            } else if (historyIndex() === 0) {
                setHistoryIndex(-1);
                setInput("");
            }
        }
    };

    const getPromptLength = () => {
        const strippedPrompt = terminal.getPrompt().replace(/\x1b\[[0-9;]*m/g, "");
        return strippedPrompt.length;
    };

    createEffect(() => {
        if (terminalElement) {
            wasAtBottom =
                terminalElement.scrollHeight - terminalElement.scrollTop ===
                terminalElement.clientHeight;
        }

        const currentInput = input().trimStart();

        if (currentInput === "" || terminal.isPromptActive()) {
            setFeedback("");
            setSuggestion("");
            return;
        }

        const splitCommand = currentInput.split(/\s+/);

        if (splitCommand.length > 0) {
            const command = splitCommand[0];
            const feedbackCommand = Object.keys(commands).filter((cmd) =>
                cmd === command
            ).at(0);
            const commandSuggestions = Object.keys(commands).filter((cmd) =>
                cmd.startsWith(command)
            );

            if (feedbackCommand) {
                const commandInfo = commands[feedbackCommand];

                let feedbackText = `${" ".repeat(getPromptLength())}┬${"-".repeat(command.length - 1)}\n`;
                feedbackText += `${" ".repeat(getPromptLength())}│\n`;
                feedbackText += `${" ".repeat(getPromptLength())}└ "\x1b[35m${commandInfo.description}\x1b[0m"\n`;

                if (command === feedbackCommand && commandInfo.arguments) {
                    commandInfo.arguments.forEach((arg) => {
                        feedbackText += `${" ".repeat(getPromptLength())}   --${arg.name} (${arg.optional ? "optional " : ""}${arg.type}): ${arg.description}\n`;
                    });
                }

                setFeedback(feedbackText);
            } else {
                setFeedback(`${" ".repeat(getPromptLength())}┬${"-".repeat(command.length - 1)}\n${" ".repeat(getPromptLength())}│\n${" ".repeat(getPromptLength())}└ \x1b[31mcommand not found.`);
            }

            if (commandSuggestions.length > 0) {
                setSuggestion(commandSuggestions[0]);
            } else {
                setSuggestion("");
            }
        } else {
            setFeedback("");
            setSuggestion("");
        }
    });

    onMount(async () => {
        localStorage.setItem('lastLogin', getDate());

        document.addEventListener("mouseup", () => {
            if (!window.getSelection().toString()) {
                if (inputElement) {
                    inputElement.focus();
                }
            }
        });

        while (true) {
            const msg = await terminal.prompt(shellPrompt);
            await handleCommand(msg, true);
        }
    });

    createEffect(() => {
        if (inputElement) {
            inputElement.focus();
        }
    });

    const parseAnsi = (text) => {
        const segments = [];
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
                while (text[i] !== "m") {
                    code += text[i];
                    i++;
                }

                const codeParts = code.split(";");

                if (codeParts[0] === "0") {
                    currentColor = "";
                    currentBgColor = "";
                } else {
                    codeParts.forEach((part) => {
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
                            const next = parseInt(codeParts[codeParts.indexOf(part) + 1]);
                            if (next === 5) {
                                const colorIndex = parseInt(codeParts[codeParts.indexOf(part) + 2]);
                                const color = get256Color(colorIndex);
                                if (isBg) {
                                    currentBgColor = `background-color: ${color};`;
                                } else {
                                    currentColor = `color: ${color};`;
                                }
                            } else if (next === 2) {
                                const r = parseInt(codeParts[codeParts.indexOf(part) + 2]);
                                const g = parseInt(codeParts[codeParts.indexOf(part) + 3]);
                                const b = parseInt(codeParts[codeParts.indexOf(part) + 4]);
                                const rgbColor = `rgb(${r}, ${g}, ${b})`;
                                if (isBg) {
                                    currentBgColor = `background-color: ${rgbColor};`;
                                } else {
                                    currentColor = `color: ${rgbColor};`;
                                }
                            }
                        }
                    });
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

    const getColor = (num) => {
        const colors = ["black", "red", "#34dc34", "yellow", "blue", "magenta", "cyan", "white"];
        return colors[num - 30];
    };

    const getBrightColor = (num) => {
        const colors = ["gray", "lightcoral", "lightgreen", "yellow", "lightblue", "violet", "lightcyan", "white"];
        return colors[num - 90];
    };

    const get256Color = (index) => {
        if (index < 16) {
            return getColor(index + 30);
        } else if (index < 232) {
            const r = Math.floor((index - 16) / 36) * 51;
            const g = Math.floor(((index - 16) % 36) / 6) * 51;
            const b = ((index - 16) % 6) * 51;
            return `rgb(${r}, ${g}, ${b})`;
        } else {
            const gray = (index - 232) * 10 + 8;
            return `rgb(${gray}, ${gray}, ${gray})`;
        }
    };

    const renderOutput = (output) => {
        if (output === null) return;
        if (output.html) {
            const htmlOutput = output.html;

            createEffect(() => {
                if (terminalElement) {
                    htmlOutput.querySelectorAll("pre code").forEach((code) => {
                        hljs.highlightElement(code);
                    });
                }
            });

            return output.html;
        }
        return output.split("\n").map((line, index) => {
            if (line.trim() === "") {
                return <div key={index}><span key={0}> </span></div>;
            }

            const segments = line.split(/(\[\[.*?]])/).map((segment, segIndex) => {
                const isCommand = segment.startsWith("[[") && segment.endsWith("]]");
                if (isCommand) {
                    const command = segment.slice(2, -2).trim();
                    if (commands[command]) {
                        return (
                            <span
                                key={segIndex}
                                class="command-span"
                                onClick={() => { //Totally not hacky
                                    setInput(command);
                                    handleKeyDown({
                                        key: "Enter"
                                    })
                                }}
                            >
                                {command}
                            </span>
                        );
                    }
                }
                return (
                    <span key={segIndex}>
                    {parseAnsi(segment).map((ansiSegment, ansiIndex) => (
                        <span key={ansiIndex} style={`${ansiSegment.color} ${ansiSegment.bgColor}`}>
                            {ansiSegment.text}
                        </span>
                    ))}
                </span>
                );
            }); // dw

            return <div key={index}>{segments}</div>;
        });
    };

    return (
        <div class="h-screen flex flex-col bg-gray-900">
            <div class="flex-grow overflow-auto">
                <div ref={(el) => (terminalElement = el)}
                     class="bg-black text-white font-mono p-4 w-full h-full overflow-y-auto"
                     style="font-family: 'Fira Code', monospace; font-display: swap; max-height: 100vh;">
                    <For each={history}>
                        {(item) => (
                            <div style="white-space: pre-wrap;">
                                {renderOutput(item)}
                            </div>
                        )}
                    </For>

                    <div class="flex items-center w-full">
                        <span style="white-space: pre;">
                            {parseAnsi(terminal.getPrompt()).map((segment, segIndex) => (
                                <span key={segIndex} style={`${segment.color} ${segment.bgColor}`}>
                                    {segment.text}
                                </span>
                            ))}
                        </span>
                        <div class="flex-grow relative">
                            <input
                                ref={(el) => (inputElement = el)}
                                type="text"
                                value={input()}
                                onInput={(e) => setInput(e.currentTarget.value)}
                                onKeyDown={handleKeyDown}
                                class="bg-black text-white outline-none border-none w-full"
                                autofocus
                                aria-label="Enter a command in the terminal"
                                id="prompt"
                            />
                            {suggestion() && (
                                <span class="absolute left-0 top-0 text-gray-500" style={`left: ${input().length}ch;`}>
                                    {suggestion().substring(input().length)}
                                </span>
                            )}
                        </div>
                    </div>

                    {feedback() && (
                        <div class="text-gray-500 whitespace-pre">
                            {parseAnsi(feedback()).map((segment, segIndex) => (
                                <span key={segIndex} style={`${segment.color} ${segment.bgColor}`}>
                                    {segment.text}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TerminalComponent;