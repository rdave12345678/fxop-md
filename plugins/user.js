const { Module, parsedJid } = require("../lib");
const { WarnDB } = require("../lib/db");
const { WARN_COUNT } = require("../config");
const { getWarns, saveWarn, resetWarn, removeLastWarn } = WarnDB;
const { getFilter, setFilter, deleteFilter } = require("../lib/db/filters");

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

Module(
	{
		pattern: "filter",
		fromMe: true,
		desc: "Adds a filter. When someone triggers the filter, it sends the corresponding response. To view your filter list, use `.filter`.",
		type: "user",
	},
	async (message, match) => {
		let keyword, response;
		try {
			[keyword, response] = match.split(":");
		} catch {}

		if (!match) {
			const activeFilters = await getFilter(message.jid);
			if (!activeFilters) {
				await message.reply("No filters are currently set in this chat.");
			} else {
				let filterListMessage = "Your active filters for this chat:\n\n";
				activeFilters.forEach(filter => {
					filterListMessage += `✒ ${filter.dataValues.pattern}\n`;
				});
				filterListMessage += "Use: .filter keyword:message\nto set a new filter";
				await message.reply(filterListMessage);
			}
		} else if (!keyword || !response) {
			await message.reply("```Use: .filter keyword:message\nto set a filter```");
		} else {
			await setFilter(message.jid, keyword, response, true);
			await message.reply(`_Successfully set filter for ${keyword}_`);
		}
	},
);

Module(
	{
		pattern: "stop",
		fromMe: true,
		desc: "Stops a previously added filter.",
		type: "user",
	},
	async (message, match) => {
		if (!match) return await message.reply("\n*Example:* ```.stop hello```");

		const deletedFilter = await deleteFilter(message.jid, match);
		if (!deletedFilter) {
			await message.reply("No existing filter matches the provided input.");
		} else {
			await message.reply(`_Filter ${match} deleted_`);
		}
	},
);

Module(
	{
		on: "text",
		fromMe: false,
		dontAddCommandList: true,
	},
	async (message, match) => {
		const activeFilters = await getFilter(message.jid);
		if (!activeFilters) return;

		activeFilters.forEach(async filter => {
			const pattern = new RegExp(filter.dataValues.regex ? filter.dataValues.pattern : `\\b(${filter.dataValues.pattern})\\b`, "gm");
			if (pattern.test(match)) {
				await message.reply(filter.dataValues.text, {
					quoted: message,
				});
			}
		});
	},
);
