const { Module, qrcode, Bitly, mode, isUrl, readQr } = require("../lib/");
const config = require("../config");
Module(
	{
		pattern: "vv",
		fromMe: mode,
		desc: "Forwards The View once messsage",
		type: "tool",
	},
	async (message, match, conn, m) => {
		let buff = await m.quoted.download();
		return await message.sendFile(buff);
	},
);

Module(
	{
		on: "text",
		fromMe: !config.STATUS_SAVER,
		desc: "Save or Give Status Updates",
		dontAddCommandList: true,
		type: "Tool",
	},
	async (message, match, m) => {
		try {
			if (message.isGroup) return;
			const triggerKeywords = ["save", "send", "sent", "snt", "give", "snd"];
			const cmdz = match.toLowerCase().split(" ")[0];
			if (triggerKeywords.some(tr => cmdz.includes(tr))) {
				const relayOptions = { messageId: m.quoted.key.id };
				return await message.client.relayMessage(message.jid, m.quoted.message, relayOptions);
			}
		} catch (error) {
			console.error("[Error]:", error);
		}
	},
);

Module(
	{
		pattern: "qr",
		fromMe: mode,
		desc: "Read/Write Qr.",
		type: "Tool",
	},
	async (message, match, m) => {
		match = match || message.reply_message.text;

		if (match) {
			let buff = await qrcode(match);
			return await message.sendMessage(message.jid, buff, {}, "image");
		} else if (message.reply_message.image) {
			const buffer = await m.quoted.download();
			readQr(buffer)
				.then(async data => {
					return await message.sendMessage(message.jid, data);
				})
				.catch(async error => {
					console.error("Error:", error.message);
					return await message.sendMessage(message.jid, error.message);
				});
		} else {
			return await message.sendMessage(message.jid, "*Example : qr test*\n*Reply to a qr image.*");
		}
	},
);

Module(
	{
		pattern: "bitly",
		fromMe: mode,
		desc: "Converts Url to bitly",
		type: "tool",
	},
	async (message, match) => {
		match = match || message.reply_message.text;
		if (!match) return await message.reply("_Reply to a url or enter a url_");
		if (!isUrl(match)) return await message.reply("_Not a url_");
		let short = await Bitly(match);
		return await message.reply(short.link);
	},
);
