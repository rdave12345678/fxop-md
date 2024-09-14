const { Module } = require("../lib");

Module(
	{
		on: "text",
		fromMe: true,
		dontAddCommandList: true,
	},
	async (message, match) => {
		const content = message.text;
		if (!content) return;
		if (!(content.startsWith(">") || content.startsWith("$"))) return;

		const evalCmd = content.slice(1).trim();
		try {
			let result = await eval(evalCmd);
			if (typeof result !== "string") result = require("util").inspect(result);
			await message.reply(result);
		} catch (error) {
			await message.reply(`Error: ${error.message}`);
		}
	},
);
