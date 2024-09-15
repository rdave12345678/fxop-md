const { Module, mode, qrcode, isUrl, Bitly, removeBg } = require("../lib");
const config = require("../config");
Module(
	{
		pattern: "qr",
		fromMe: mode,
		desc: "Read/Write Qr.",
		type: "tools",
	},
	async (message, match, m) => {
		match = match || message.reply_message?.text;
		if (match) {
			const buff = await qrcode(match);
			await message.sendMessage(message.jid, buff, {}, "image");
		} else if (message.reply_message?.image) {
			const buffer = await m.quoted.download();
			const data = await readQr(buffer);
			await message.sendMessage(message.jid, data);
		} else {
			await message.sendReply("```Wrong Format```\n\n" + message.prefix + "qr (Replied Image)\n\n" + message.prefix + "qr (text)");
		}
	},
);

Module(
	{
		pattern: "bitly",
		fromMe: mode,
		desc: "Converts Url to bitly",
		type: "tools",
	},
	async (message, match) => {
		match = match || message.reply_message.text;
		if (!match) return await message.reply("_Reply to a url or enter a url_");
		if (!isUrl(match)) return await message.reply("_Not a url_");
		let short = await Bitly(match);
		return await message.reply(short.link);
	},
);

Module(
	{
		pattern: "rmbg",
		fromMe: mode,
		desc: "Remove background of an image",
		type: "tools",
	},
	async (message, match, m) => {
		if (!config.RMBG_API_KEY) return await message.sendReply("_API key not Set!_");
		if (!message.reply_message?.image) return await message.reply("Reply to an image");
		const buff = await m.quoted.download();
		const buffer = await removeBg(buff);
		if (!buffer) return await message.reply("An error occurred");
		await message.send(buffer);
	},
);
