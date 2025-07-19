import { getDate } from "../utils";
import { Terminal } from "../components/Terminal";

function generateRandomIPv4() {
	const randomByte = () => Math.floor(Math.random() * 256);
	return `${randomByte()}.${randomByte()}.${randomByte()}.${randomByte()}`;
}

function getMotd() {
	return `Welcome to my website.
      
  System information as of ${getDate()}

   System load:           ${(Math.random() * (60 - 20) + 20).toFixed(2)}%
   Temperature:           ${Math.floor(Math.random() * (40 - 25) + 25)}°C
   Processes:             ${Math.floor(Math.random() * (155 - 60) + 60)}
   Users logged in:       0
   IPv4 address for eno1: ${generateRandomIPv4()}
  
Last login: ${localStorage.getItem("lastLogin") || "Never"}
For a list of available commands, type "[[cmd:help]]".`;
}

export const meta = {
	description: "prints the motd (message of the day)",
} as const;

export const handler = (terminal: Terminal) => {
	terminal.println(getMotd());
};
