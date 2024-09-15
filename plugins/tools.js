const { Module, mode, qrcode, isUrl, Bitly, removeBg, tinyurl, ssweb, shortenurl } = require("../lib");
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
		const msg = await message.reply("_Processing Image!_");
		const buff = await m.quoted.download();
		const buffer = await removeBg(buff);
		await msg.edit("*_Opration Success_*");
		await message.send(buffer);
	},
);

Module(
	{
		pattern: "tinyurl",
		fromMe: mode,
		desc: "Shortens Link with TinyURL",
		type: "tools",
	},
	async (message, match, m) => {
		match = match || message.reply_message.text;
		if (!match) return await message.sendReply("```Wrong format\n\n" + message.prefix + "tinyurl URL\n\nOR REPLY A MESSAGE```");
		if (!isUrl(match)) return await message.sendReply("_Invaild Url_");
		const msg = await message.reply("_Shorting Link_");
		const shorten_text = await tinyurl(match);
		await msg.edit("*_Opreation Success_*");
		return await message.send(shorten_text);
	},
);

Module(
	{
		pattern: "fullss",
		fromMe: mode,
		desc: "ScreenShot Websites",
		type: "tools",
	},
	async (message, match, m) => {
		if (!match) return await message.sendReply("_Provide Url_");
		if (!isUrl(match)) return await message.sendReply("_Not A URL" + message.pushName + "_");
		const msg = await message.reply("_Processing URL_");
		const buff = await ssweb(match);
		await msg.edit("*_Success_*");
		return await message.send(buff);
	},
);
