const { Module, mode } = require("../lib/");
Module(
	{
		pattern: "ping",
		fromMe: mode,
		desc: "To check ping",
		type: "misc",
	},
	async (message, match) => {
		const start = new Date().getTime();
		await message.sendMessage(message.jid, "```Ping!```");
		const end = new Date().getTime();
		return await message.sendMessage(message.jid, "*Pong!*\n ```" + (end - start) + "``` *ms*");
	},
);
