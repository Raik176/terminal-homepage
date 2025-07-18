export const meta = {
    description: "play a number guessing game",
};

export const handler = async (terminal, args, signal) => {
    const number = Math.floor(Math.random() * 1000) + 1
    let tries = 0

    while (true) {
        let guess = await terminal.promptNumber("guess: ", signal)
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
};