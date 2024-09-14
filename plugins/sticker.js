const config = require("../config");
const { Module, mode, toAudio, webp2mp4 } = require("../lib/");

Module(
	{
		pattern: "sticker",
		fromMe: mode,
		desc: "Converts Photo/video/text to sticker",
		type: "converter",
	},
	async (message, match, m) => {
		if (!message.reply_message && (!message.reply_message.video || !message.reply_message.sticker || !message.reply_message.text)) return await message.reply("_Reply to photo/video/text_");
		var buff;
		buff = await m.quoted.download();
		message.sendMessage(message.jid, buff, { packname: config.PACKNAME, author: config.AUTHOR }, "sticker");
	},
);

Module(
	{
		pattern: "take",
		fromMe: mode,
		desc: "Converts Photo or video to sticker",
		type: "converter",
	},
	async (message, match, m) => {
		if (!message.reply_message.sticker) return await message.reply("_Reply to a sticker_");
		const packname = config.STICKER_PACK.split(";")[0];
		const author = config.STICKER_PACK.split(";")[1];
		let buff = await m.quoted.download();
		message.sendMessage(message.jid, buff, { packname, author }, "sticker");
	},
);

Module(
	{
		pattern: "photo",
		fromMe: mode,
		desc: "Changes sticker to Photo",
		type: "converter",
	},
	async (message, match, m) => {
		if (!message.reply_message.sticker) return await message.reply("_Not a sticker_");
		let buff = await m.quoted.download();
		return await message.sendMessage(message.jid, buff, {}, "image");
	},
);

Module(
	{
		pattern: "mp3",
		fromMe: mode,
		desc: "converts video/voice to mp3",
		type: "downloader",
	},
	async (message, match, m) => {
		let buff = await m.quoted.download();
		console.log(typeof buff);
		buff = await toAudio(buff, "mp3");
		console.log(typeof buff);
		return await message.sendMessage(message.jid, buff, { mimetype: "audio/mpeg" }, "audio");
	},
);

Module(
	{
		pattern: "mp4",
		fromMe: mode,
		desc: "converts video/voice to mp4",
		type: "downloader",
	},
	async (message, match, m) => {
		if (!message.reply_message.video || !message.reply_message.sticker || !message.reply_message.audio) return await message.reply("_Reply to a sticker/audio/video_");
		let buff = await m.quoted.download();
		if (message.reply_message.sticker) {
			buff = await webp2mp4(buff);
		} else {
			buff = await toAudio(buff, "mp4");
		}
		return await message.sendMessage(message.jid, buff, { mimetype: "video/mp4" }, "video");
	},
);

Module(
	{
		pattern: "img",
		fromMe: mode,
		desc: "Converts Sticker to image",
		type: "converter",
	},
	async (message, match, m) => {
		if (!message.reply_message.sticker) return await message.reply("_Reply to a sticker_");
		let buff = await m.quoted.download();
		return await message.sendMessage(message.jid, buff, {}, "image");
	},
);
