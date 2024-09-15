const { Module, parsedJid } = require("../lib");
const { WarnDB } = require("../lib/db");
const { WARN_COUNT } = require("../config");
const { getWarns, saveWarn, resetWarn, removeLastWarn } = WarnDB;

Module(
	{
		pattern: "warn",
		fromMe: true,
		desc: "Warn a user",
		type: "user",
	},
	async (message, match) => {
		const userId = message.mention[0] || message.reply_message?.jid;
		if (!userId) return message.reply("_Mention or reply to someone_");
		let reason = message?.reply_message?.text || match;
		reason = reason.replace(/@(\d+)/, "").trim();
		reason = reason || "Reason not provided";

		const warnInfo = await saveWarn(userId, reason);
		await message.reply(`_User @${userId.split("@")[0]} warned._ \n_Warn Count: ${warnInfo.warnCount}._ \n_Reason: ${reason}_`, { mentions: [userId] });

		if (warnInfo.warnCount >= WARN_COUNT) {
			const jid = parsedJid(userId);
			await message.sendMessage(message.jid, "Warn limit exceeded. Kicking user.");
			return await message.client.groupParticipantsUpdate(message.jid, jid, "remove");
		}
	},
);

Module(
	{
		pattern: "rwarn",
		fromMe: true,
		desc: "Reset warnings for a user",
		type: "user",
	},
	async message => {
		const userId = message.mention[0] || message.reply_message?.jid;
		if (!userId) return message.reply("_Mention or reply to someone_");
		await resetWarn(userId);
		return await message.reply(`_Warnings for @${userId.split("@")[0]} reset_`, {
			mentions: [userId],
		});
	},
);

Module(
	{
		pattern: "delwarn",
		fromMe: true,
		desc: "Remove the last warning for a user",
		type: "user",
	},
	async message => {
		const userId = message.mention[0] || message.reply_message?.jid;
		if (!userId) return message.reply("_Mention or reply to someone_");

		const updatedWarn = await removeLastWarn(userId);
		if (updatedWarn) {
			return await message.reply(`_Last warning removed for @${userId.split("@")[0]}._ \n_Current Warn Count: ${updatedWarn.warnCount}._`, { mentions: [userId] });
		} else {
			return await message.reply(`_No warnings found for @${userId.split("@")[0]}._`, {
				mentions: [userId],
			});
		}
	},
);

Module(
	{
		pattern: "getwarns",
		fromMe: true,
		desc: "Show warnings for a user",
		type: "user",
	},
	async message => {
		const userId = message.mention[0] || message.reply_message?.jid;
		if (!userId) return message.reply("_Mention or reply to someone_");

		const warnInfo = await getWarns(userId);
		if (warnInfo) {
			const warningList = warnInfo.reasons.map((reason, index) => `${index + 1}. ${reason}`).join("\n");
			return await message.reply(`_Warnings for @${userId.split("@")[0]}:_ \n_Total Warns: ${warnInfo.warnCount}_ \n\n${warningList}`, { mentions: [userId] });
		} else {
			return await message.reply(`_No warnings found for @${userId.split("@")[0]}._`, {
				mentions: [userId],
			});
		}
	},
);
