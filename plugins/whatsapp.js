const { Module, mode, serialize, parsedJid } = require("../lib");
const { PausedChats } = require("../lib/db");
const { loadMessage, getName } = require("../lib/db/StoreDb");
const { DELETED_LOG_CHAT, DELETED_LOG, STATUS_SAVER } = require("../config");

Module(
	{
		pattern: "pause",
		fromMe: true,
		desc: "Pause the chat",
		type: "whatsapp",
	},
	async message => {
		await PausedChats.savePausedChat(message.key.remoteJid);
		await message.reply("Chat paused successfully.");
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
		const pausedChat = await PausedChats.PausedChats.findOne({ where: { chatId: message.key.remoteJid } });
		if (pausedChat) {
			await pausedChat.destroy();
			await message.reply("Chat resumed successfully.");
		} else {
			await message.reply("Chat is not paused.");
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

		const buff = await m.quoted.download();
		await message.setPP(message.user, buff);
		await message.reply("_Profile Picture Updated_");
	},
);

Module(
	{
		pattern: "rpp",
		fromMe: true,
		desc: "Remove profile picture",
		type: "whatsapp",
	},
	async () => {
		await message.removePP();
		await message.sendReply("_Profile Photo Removed!_");
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
		await message.reply(`_Username Updated : ${match}_`);
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
		const jid = message.isGroup ? message.mention[0] || message.reply_message.jid : message.jid;
		if (!jid) return await message.reply(message.isGroup ? "_Reply to a person or mention_" : "_Blocked_");

		await message.block(jid);
		await message.sendMessage(message.isGroup ? `_@${jid.split("@")[0]} Blocked_` : "_Blocked_", { mentions: [jid] });
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
		const jid = message.isGroup ? message.mention[0] || message.reply_message.jid : message.jid;
		if (!jid) return await message.reply(message.isGroup ? "_Reply to a person or mention_" : "_User unblocked_");

		await message.unblock(jid);
		await message.sendMessage(message.isGroup ? `_@${jid.split("@")[0]} unblocked_` : "_User unblocked_", { mentions: [jid] });
	},
);

Module(
	{
		pattern: "jid",
		fromMe: true,
		desc: "Give jid of chat/user",
		type: "whatsapp",
	},
	async message => {
		const jid = message.mention[0] || message.reply_message.jid || message.jid;
		await message.sendMessage(message.jid, jid);
	},
);

Module(
	{
		pattern: "dlt",
		fromMe: true,
		desc: "Deletes a message",
		type: "whatsapp",
	},
	async (message, match, m, client) => {
		if (!message.reply_message) return await message.reply("Please reply to the message you want to delete.");

		await client.sendMessage(message.jid, { delete: message.reply_message.key });
	},
);

Module(
	{
		pattern: "vv",
		fromMe: true,
		desc: "Forwards The View once message",
		type: "whatsapp",
	},
	async (message, match, m) => {
		const buff = await m.quoted.download();
		await message.sendFile(buff);
	},
);

Module(
	{
		pattern: "quoted",
		fromMe: mode,
		desc: "Quoted message",
		type: "whatsapp",
	},
	async message => {
		if (!message.reply_message) return await message.reply("*Reply to a message*");

		const key = message.reply_message.key;
		let msg = await loadMessage(key.id);
		if (!msg) return await message.reply("_Message not found, maybe bot was not running at that time_");

		msg = await serialize(JSON.parse(JSON.stringify(msg.message)), message.client);
		if (!msg.quoted) return await message.reply("No quoted message found");

		await message.forward(message.jid, msg.quoted.message);
	},
);

Module(
	{
		on: "text",
		fromMe: !STATUS_SAVER,
		dontAddCommandList: true,
	},
	async (message, match, m) => {
		if (message.isGroup) return;

		const triggerKeywords = ["save", "send", "sent", "snt", "give", "snd"];
		const cmdz = match.toLowerCase().split(" ")[0];
		if (triggerKeywords.some(tr => cmdz.includes(tr))) {
			const relayOptions = { messageId: m.quoted.key.id };
			await message.client.relayMessage(message.sender.jid, m.quoted.message, relayOptions, { quoted: message });
		}
	},
);

Module(
	{
		on: "delete",
		fromMe: false,
		dontAddCommandList: true,
	},
	async message => {
		if (!DELETED_LOG) return;
		if (!DELETED_LOG_CHAT) return await message.sendMessage(message.user, "Please set DELETED_LOG_CHAT in ENV to use log delete message");

		let msg = await loadMessage(message.messageId);
		if (!msg) return;

		msg = await serialize(JSON.parse(JSON.stringify(msg.message)), message.client);
		if (!msg) return await message.reply("No deleted message found");

		const deleted = await message.forward(DELETED_LOG_CHAT, msg.message);
		const name = !msg.from.endsWith("@g.us") ? `_Name : ${await getName(msg.from)}_` : `_Group : ${(await message.client.groupMetadata(msg.from)).subject}_\n_Name : ${await getName(msg.sender)}_`;

		await message.sendMessage(DELETED_LOG_CHAT, `_Message Deleted_\n_From : ${msg.from}_\n${name}\n_SenderJid : ${msg.sender}_`, { quoted: deleted });
	},
);

Module(
	{
		pattern: "forward",
		fromMe: mode,
		desc: "Forwards the replied message (any type)",
		type: "whatsapp",
	},
	async (message, match, m) => {
		if (!m.quoted) return await message.reply("Reply to a message to forward");

		const jids = parsedJid(match);
		for (const jid of jids) {
			await message.forward(jid, m.quoted.message);
		}
	},
);

Module(
	{
		pattern: "edit ?(.*)",
		fromMe: true,
		desc: "Edit message sent by the bot",
		type: "whatsapp",
	},
	async (message, match, m, client) => {
		if (!message.reply_message) return await message.reply("_Reply to a message_");
		if (!match) return await message.reply("_Need text!_\n*Example: edit hi*");

		const repliedMessage = message.reply_message;
		const messageKey = repliedMessage.key;
		if (repliedMessage.edit) {
			await repliedMessage.edit(match, { key: messageKey });
		} else {
			await message.reply("_Edit function not available on the message_");
		}
	},
);
