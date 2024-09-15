const { Module, mode, serialize } = require("../lib");
const { PausedChats } = require("../lib/db");
const { loadMessage } = require("../lib/db/StoreDb");
const config = require("../config");

Module(
	{
		pattern: "pause",
		fromMe: true,
		desc: "Pause the chat",
		type: "whatsapp",
	},
	async message => {
		const chatId = message.key.remoteJid;
		await PausedChats.savePausedChat(chatId);
		message.reply("Chat paused successfully.");
	},
);

Module(
	{
		pattern: "resume",
		fromMe: true,
		desc: "Resume the paused chat",
		type: "whatsapp",
	},
	async message => {
		const chatId = message.key.remoteJid;
		const pausedChat = await PausedChats.PausedChats.findOne({ where: { chatId } });
		if (pausedChat) {
			await pausedChat.destroy();
			message.reply("Chat resumed successfully.");
		} else {
			message.reply("Chat is not paused.");
		}
	},
);

Module(
	{
		pattern: "setpp",
		fromMe: true,
		desc: "Set profile picture",
		type: "whatsapp",
	},
	async (message, match, m) => {
		if (!message.reply_message.image) return await message.reply("_Reply to a photo_");
		let buff = await m.quoted.download();
		await message.setPP(message.user, buff);
		return await message.reply("_Profile Picture Updated_");
	},
);

Module(
	{
		pattern: "setname",
		fromMe: true,
		desc: "Set User name",
		type: "whatsapp",
	},
	async (message, match) => {
		if (!match) return await message.reply("_Enter name_");
		await message.updateName(match);
		return await message.reply(`_Username Updated : ${match}_`);
	},
);

Module(
	{
		pattern: "block",
		fromMe: true,
		desc: "Block a person",
		type: "whatsapp",
	},
	async (message, match) => {
		if (message.isGroup) {
			let jid = message.mention[0] || message.reply_message.jid;
			if (!jid) return await message.reply("_Reply to a person or mention_");
			await message.block(jid);
			return await message.sendMessage(`_@${jid.split("@")[0]} Blocked_`, {
				mentions: [jid],
			});
		} else {
			await message.reply("_Blocked_");
			return await message.block(message.jid);
		}
	},
);

Module(
	{
		pattern: "unblock",
		fromMe: true,
		desc: "Unblock a person",
		type: "whatsapp",
	},
	async (message, match) => {
		if (message.isGroup) {
			let jid = message.mention[0] || message.reply_message.jid;
			if (!jid) return await message.reply("_Reply to a person or mention_");
			await message.block(jid);
			return await message.sendMessage(message.jid, `_@${jid.split("@")[0]} unblocked_`, {
				mentions: [jid],
			});
		} else {
			await message.unblock(message.jid);
			return await message.reply("_User unblocked_");
		}
	},
);

Module(
	{
		pattern: "jid",
		fromMe: true,
		desc: "Give jid of chat/user",
		type: "whatsapp",
	},
	async (message, match) => {
		return await message.sendMessage(message.jid, message.mention[0] || message.reply_message.jid || message.jid);
	},
);

Module(
	{
		pattern: "dlt",
		fromMe: true,
		desc: "deletes a message",
		type: "whatsapp",
	},
	async (message, match, m, client) => {
		if (message.isGroup) {
			client.sendMessage(message.jid, { delete: message.reply_message.key });
		}
	},
);
Module(
	{
		pattern: "vv",
		fromMe: mode,
		desc: "Forwards The View once messsage",
		type: "whatsapp",
	},
	async (message, match, m) => {
		let buff = await m.quoted.download();
		return await message.sendFile(buff);
	},
);

Module(
	{
		pattern: "quoted",
		fromMe: mode,
		desc: "quoted message",
		type: "whatsapp",
	},
	async (message, match) => {
		if (!message.reply_message) return await message.reply("*Reply to a message*");
		let key = message.reply_message.key;
		let msg = await loadMessage(key.id);
		if (!msg) return await message.reply("_Message not found maybe bot might not be running at that time_");
		msg = await serialize(JSON.parse(JSON.stringify(msg.message)), message.client);
		if (!msg.quoted) return await message.reply("No quoted message found");
		await message.forward(message.jid, msg.quoted.message);
	},
);
Module(
	{
		on: "text",
		fromMe: !config.STATUS_SAVER,
		desc: "Save or Give Status Updates",
		dontAddCommandList: true,
	},
	async (message, match, m) => {
		if (message.isGroup) return;
		const triggerKeywords = ["save", "send", "sent", "snt", "give", "snd"];
		const cmdz = match.toLowerCase().split(" ")[0];
		if (triggerKeywords.some(tr => cmdz.includes(tr))) {
			const relayOptions = { messageId: m.quoted.key.id };
			return await message.client.relayMessage(message.jid, m.quoted.message, relayOptions);
		}
	},
);
