const { Module, mode, qrcode, isUrl, Bitly, removeBg, tinyurl, ssweb, shortenurl, upload } = require("../lib");
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
			await message.sendReply(`\`\`\`Wrong Format\`\`\`\n\n${message.prefix}qr (Replied Image)\n\n${message.prefix}qr (text)`);
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
		const short = await Bitly(match);
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
		await msg.edit("*_Operation Success_*");
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
	async (message, match) => {
		match = match || message.reply_message.text;
		if (!match) return await message.sendReply(`\`\`\`Wrong format\n\n${message.prefix}tinyurl URL\n\nOR REPLY A MESSAGE\`\`\``);
		if (!isUrl(match)) return await message.sendReply("_Invalid URL_");
		const msg = await message.reply("_Shortening Link_");
		const shortenText = await tinyurl(match);
		await msg.edit("*_Operation Success_*");
		return await message.send(shortenText);
	},
);

Module(
	{
		pattern: "fullss",
		fromMe: mode,
		desc: "Screenshot Websites",
		type: "tools",
	},
	async (message, match) => {
		if (!match) return await message.sendReply("_Provide URL_");
		if (!isUrl(match)) return await message.sendReply("_Not A URL_");
		const msg = await message.reply("_Processing URL_");
		const buff = await ssweb(match);
		await msg.edit("*_Success_*");
		return await message.send(buff);
	},
);

Module(
	{
		pattern: "shortlink",
		fromMe: mode,
		desc: "Shortens link URL",
		type: "tools",
	},
	async (message, match) => {
		if (!match) return await message.sendReply("_Provide URL_");
		if (!isUrl(match)) return await message.sendReply("_Not A URL_");
		const msg = await message.reply("_Shortening Link_");
		const shortenedTxt = await shortenurl(match);
		await msg.edit("*_Success_*");
		return await message.send(shortenedTxt);
	},
);

Module(
	{
		pattern: "upload",
		fromMe: mode,
		desc: "Uploads Image",
		type: "tools",
	},
	async (message, match, m) => {
		if (!message.reply_message) return await message.reply("_Reply Image_");
		const msg = await message.reply("_Uploading File_");
		const buff = await m.quoted.download();
		const url = await upload(buff);
		return await msg.edit(`*IMAGE UPLOADED: ${url}*`);
	},
);
