const { Module, isAdmin, parsedJid } = require("../lib/");
const { banUser, unbanUser, isBanned } = require("../lib/db/ban");
const moment = require("moment");

Module(
	{
		on: "message",
		fromMe: true,
		dontAddCommandList: true,
	},
	async (message, match) => {
		if (!message.isBaileys) return;
		const isban = await isBanned(message.jid);
		if (!isban) return;
		await message.reply("_Bot is banned in this chat_");
		const jid = parsedJid(message.participant);
		return await message.client.groupParticipantsUpdate(message.jid, jid, "remove");
	},
);

Module(
	{
		pattern: "antibot ?(.*)",
		fromMe: true,
		desc: "Turn antibot on or off",
		type: "group",
	},
	async (message, match, client) => {
		if (!message.isGroup) return await message.reply("_This command is for groups_");
		const isUserAdmin = await isAdmin(message.jid, message.participant, client);
		if (!isUserAdmin) return await message.reply("_You need to be an admin to use this command_");
		const chatid = message.jid;
		const command = match.trim().toLowerCase();
		if (command !== "on" && command !== "off") return await message.reply("Usage: .antibot on/off");
		const isban = await isBanned(chatid);
		if (command === "on") {
			if (isban) return await message.reply("*_Antibot Already On_*");
			await banUser(chatid);
			return await message.reply("*_Antibot Turned ON_*");
		} else if (command === "off") {
			if (!isban) return await message.reply("*_Antibot not ON in this Chat_*");
			await unbanUser(chatid);
			return await message.reply("*_Antibot turned Off_*");
		}
	},
);

Module(
	{
		pattern: "add",
		fromMe: true,
		desc: "add a person to group",
		type: "group",
	},
	async (message, match) => {
		if (!message.isGroup) return await message.reply("_This command is for groups_");

		match = match || message.reply_message.jid;
		if (!match) return await message.reply("_Mention user to add");

		const isadmin = await isAdmin(message.jid, message.user, message.client);

		if (!isadmin) return await message.reply("_I'm not admin_");
		const jid = parsedJid(match);

		await message.client.groupParticipantsUpdate(message.jid, jid, "add");

		return await message.reply(`_@${jid[0].split("@")[0]} added_`, {
			mentions: [jid],
		});
	},
);

Module(
	{
		pattern: "kick",
		fromMe: true,
		desc: "kicks a person from group",
		type: "group",
	},
	async (message, match) => {
		if (!message.isGroup) return await message.reply("_This command is for groups_");

		match = match || message.reply_message.jid;
		if (!match) return await message.reply("_Mention user to kick_");

		const isadmin = await isAdmin(message.jid, message.user, message.client);

		if (!isadmin) return await message.reply("_I'm not admin_");
		const jid = parsedJid(match);

		await message.client.groupParticipantsUpdate(message.jid, jid, "remove");

		return await message.reply(`_@${jid[0].split("@")[0]} kicked_`, {
			mentions: [jid],
		});
	},
);

Module(
	{
		pattern: "promote",
		fromMe: true,
		desc: "promote to admin",
		type: "group",
	},
	async (message, match) => {
		if (!message.isGroup) return await message.reply("_This command is for groups_");

		match = match || message.reply_message.jid;
		if (!match) return await message.reply("_Mention user to promote_");

		const isadmin = await isAdmin(message.jid, message.user, message.client);

		if (!isadmin) return await message.reply("_I'm not admin_");
		const jid = parsedJid(match);

		await message.client.groupParticipantsUpdate(message.jid, jid, "promote");

		return await message.reply(`_@${jid[0].split("@")[0]} promoted as admin_`, {
			mentions: [jid],
		});
	},
);

Module(
	{
		pattern: "demote",
		fromMe: true,
		desc: "demote from admin",
		type: "group",
	},
	async (message, match) => {
		if (!message.isGroup) return await message.reply("_This command is for groups_");

		match = match || message.reply_message.jid;
		if (!match) return await message.reply("_Mention user to demote_");

		const isadmin = await isAdmin(message.jid, message.user, message.client);

		if (!isadmin) return await message.reply("_I'm not admin_");
		const jid = parsedJid(match);

		await message.client.groupParticipantsUpdate(message.jid, jid, "demote");

		return await message.reply(`_@${jid[0].split("@")[0]} demoted from admin_`, {
			mentions: [jid],
		});
	},
);

Module(
	{
		pattern: "mute",
		fromMe: true,
		desc: "mute group",
		type: "group",
	},
	async (message, match, m, client) => {
		if (!message.isGroup) return await message.reply("_This command is for groups_");
		if (!isAdmin(message.jid, message.user, message.client)) return await message.reply("_I'm not admin_");
		await client.groupSettingUpdate(message.jid, "announcement");
		return await message.send("_Group Muted_");
	},
);

Module(
	{
		pattern: "unmute",
		fromMe: true,
		desc: "unmute group",
		type: "group",
	},
	async (message, match, m, client) => {
		if (!message.isGroup) return await message.reply("_This command is for groups_");
		if (!isAdmin(message.jid, message.user, message.client)) return await message.reply("_I'm not admin_");
		await client.groupSettingUpdate(message.jid, "not_announcement");
		return await message.send("_Group Unmuted_");
	},
);

Module(
	{
		pattern: "gjid",
		fromMe: true,
		desc: "gets jid of all group members",
		type: "group",
	},
	async (message, match, m, client) => {
		if (!message.isGroup) return await message.reply("_This command is for groups_");
		let { participants } = await client.groupMetadata(message.jid);
		let participant = participants.map(u => u.id);
		let str = "╭──〔 *Group Jids* 〕\n";
		participant.forEach(result => {
			str += `├ *${result}*\n`;
		});
		str += `╰──────────────`;
		message.reply(str);
	},
);

Module(
	{
		pattern: "tagall",
		fromMe: true,
		desc: "mention all users in group",
		type: "group",
	},
	async (message, match) => {
		if (!message.isGroup) return;
		const { participants } = await message.client.groupMetadata(message.jid);
		let teks = "";
		for (let mem of participants) {
			teks += ` @${mem.id.split("@")[0]}\n`;
		}
		message.sendMessage(message.jid, teks.trim(), {
			mentions: participants.map(a => a.id),
		});
	},
);

Module(
	{
		pattern: "tag",
		fromMe: true,
		desc: "mention all users in group",
		type: "group",
	},
	async (message, match) => {
		console.log("match");
		match = match || message.reply_message.text;
		if (!match) return message.reply("_Enter or reply to a text to tag_");
		if (!message.isGroup) return;
		const { participants } = await message.client.groupMetadata(message.jid);
		message.sendMessage(message.jid, match, {
			mentions: participants.map(a => a.id),
		});
	},
);

Module(
	{
		pattern: "ginfo",
		fromMe: true,
		desc: "get group info",
		type: "group",
	},
	async (message, match, m, client) => {
		if (!message.isGroup) return await message.reply("_This command is for groups_");
		const { subject, owner, desc, participants, creation } = await client.groupMetadata(message.jid);
		const admins = participants.filter(p => p.admin).map(p => p.id);
		const creationDate = new Date(creation * 1000).toLocaleString();
		let info = `*Group Name:* ${subject}\n`;
		info += `*Owner:* @${owner.split("@")[0]}\n`;
		info += `*Creation Date:* ${creationDate}\n`;
		info += `*Total Participants:* ${participants.length}\n`;
		info += `*Total Admins:* ${admins.length}\n`;
		info += `*Description:* ${desc || "No description"}`;
		return await message.reply(info, { mentions: [owner, ...admins] });
	},
);

Module(
	{
		pattern: "admins",
		fromMe: true,
		desc: "get group admins",
		type: "group",
	},
	async (message, match, m, client) => {
		if (!message.isGroup) return await message.reply("_This command is for groups_");
		const { participants } = await client.groupMetadata(message.jid);
		const admins = participants.filter(p => p.admin).map(p => p.id);
		let adminList = "*Group Admins:*\n";
		admins.forEach((admin, index) => {
			adminList += `${index + 1}. @${admin.split("@")[0]}\n`;
		});
		return await message.reply(adminList, { mentions: admins });
	},
);

Module(
	{
		pattern: "gdesc",
		fromMe: true,
		desc: "change group description",
		type: "group",
	},
	async (message, match, m, client) => {
		if (!message.isGroup) return await message.reply("_This command is for groups_");
		if (!isAdmin(message.jid, message.user, message.client)) return await message.reply("_I'm not admin_");
		if (!match) return await message.reply("_Provide the new group description_");
		await client.groupUpdateDescription(message.jid, match);
		return await message.reply("_Group description updated_");
	},
);

Module(
	{
		pattern: "gname",
		fromMe: true,
		desc: "change group name",
		type: "group",
	},
	async (message, match, m, client) => {
		if (!message.isGroup) return await message.reply("_This command is for groups_");
		if (!isAdmin(message.jid, message.user, message.client)) return await message.reply("_I'm not admin_");
		if (!match) return await message.reply("_Provide the new group name_");
		await client.groupUpdateSubject(message.jid, match);
		return await message.reply("_Group name updated_");
	},
);

Module(
	{
		pattern: "gpp",
		fromMe: true,
		desc: "change group profile picture",
		type: "group",
	},
	async (message, match, m, client) => {
		if (!message.isGroup) return await message.reply("_This command is for groups_");
		if (!isAdmin(message.jid, message.user, message.client)) return await message.reply("_I'm not admin_");
		if (!message.reply_message || !message.reply_message.image) return await message.reply("_Reply to an image to set as group profile picture_");
		const media = await m.quoted.download();
		await client.updateProfilePicture(message.jid, media);
		return await message.reply("_Group profile picture updated_");
	},
);

Module(
	{
		pattern: "requests",
		fromMe: true,
		desc: "view join requests",
		type: "group",
	},
	async (message, match, m, client) => {
		if (!message.isGroup) return await message.reply("_This command is for groups_");
		if (!isAdmin(message.jid, message.user, message.client)) return await message.reply("_I'm not admin_");
		const requests = await client.groupRequestParticipantsList(message.jid);
		if (requests.length === 0) return await message.reply("_No pending join requests_");
		let requestList = "*Pending Join Requests:*\n";
		requests.forEach((request, index) => {
			requestList += `${index + 1}. @${request.jid.split("@")[0]}\n`;
		});
		return await message.reply(requestList, { mentions: requests.map(r => r.jid) });
	},
);

Module(
	{
		pattern: "accept",
		fromMe: true,
		desc: "accept join request",
		type: "group",
	},
	async (message, match, m, client) => {
		if (!message.isGroup) return await message.reply("_This command is for groups_");
		if (!isAdmin(message.jid, message.user, message.client)) return await message.reply("_I'm not admin_");
		if (!match) return await message.reply("_Provide the number or mention the user to accept_");
		const jid = parsedJid(match)[0];
		await client.groupRequestParticipantsUpdate(message.jid, [jid], "approve");
		return await message.reply(`_@${jid.split("@")[0]} accepted to the group_`, { mentions: [jid] });
	},
);

Module(
	{
		pattern: "reject",
		fromMe: true,
		desc: "reject join request",
		type: "group",
	},
	async (message, match, m, client) => {
		if (!message.isGroup) return await message.reply("_This command is for groups_");
		if (!isAdmin(message.jid, message.user, message.client)) return await message.reply("_I'm not admin_");
		if (!match) return await message.reply("_Provide the number or mention the user to reject_");
		const jid = parsedJid(match)[0];
		await client.groupRequestParticipantsUpdate(message.jid, [jid], "reject");
		return await message.reply(`_@${jid.split("@")[0]} rejected from the group_`, { mentions: [jid] });
	},
);

Module(
	{
		pattern: "common",
		fromMe: true,
		desc: "find common participants between two groups",
		type: "group",
	},
	async (message, match, m, client) => {
		if (!message.isGroup) return await message.reply("_This command is for groups_");
		if (!match) return await message.reply("_Provide the JID of another group to compare_");

		const group1 = message.jid;
		const group2 = match.trim();

		try {
			const [metadata1, metadata2] = await Promise.all([client.groupMetadata(group1), client.groupMetadata(group2)]);

			const participants1 = new Set(metadata1.participants.map(p => p.id));
			const participants2 = new Set(metadata2.participants.map(p => p.id));

			const commonParticipants = [...participants1].filter(p => participants2.has(p));

			if (commonParticipants.length === 0) {
				return await message.reply("_No common participants found between the two groups_");
			}

			let commonList = "*Common Participants:*\n";
			commonParticipants.forEach((participant, index) => {
				commonList += `${index + 1}. @${participant.split("@")[0]}\n`;
			});

			return await message.reply(commonList, { mentions: commonParticipants });
		} catch (error) {
			console.error(error);
			return await message.reply("_Error occurred while fetching group data_");
		}
	},
);

Module(
	{
		pattern: "diff",
		fromMe: true,
		desc: "find participants in one group but not in another",
		type: "group",
	},
	async (message, match, m, client) => {
		if (!message.isGroup) return await message.reply("_This command is for groups_");
		if (!match) return await message.reply("_Provide the JID of another group to compare_");

		const group1 = message.jid;
		const group2 = match.trim();

		try {
			const [metadata1, metadata2] = await Promise.all([client.groupMetadata(group1), client.groupMetadata(group2)]);

			const participants1 = new Set(metadata1.participants.map(p => p.id));
			const participants2 = new Set(metadata2.participants.map(p => p.id));

			const uniqueParticipants = [...participants1].filter(p => !participants2.has(p));

			if (uniqueParticipants.length === 0) {
				return await message.reply("_No unique participants found in this group_");
			}

			let uniqueList = "*Participants unique to this group:*\n";
			uniqueParticipants.forEach((participant, index) => {
				uniqueList += `${index + 1}. @${participant.split("@")[0]}\n`;
			});

			return await message.reply(uniqueList, { mentions: uniqueParticipants });
		} catch (error) {
			console.error(error);
			return await message.reply("_Error occurred while fetching group data_");
		}
	},
);

Module(
	{
		pattern: "invite",
		fromMe: true,
		desc: "Generate invite link for the current group",
		type: "group",
	},
	async (message, match, m, client) => {
		if (!message.isGroup) return await message.reply("_This command is for groups_");

		try {
			const groupMetadata = await client.groupMetadata(message.jid);
			const isUserAdmin = await isAdmin(message.jid, message.participant, client);

			if (!isUserAdmin) {
				return await message.reply("_You need to be an admin to use this command_");
			}

			const inviteCode = await client.groupInviteCode(message.jid);
			const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

			const replyMessage = `*Group Invite Link*\n\n` + `*Group:* ${groupMetadata.subject}\n` + `*Link:* ${inviteLink}\n\n` + `_Note: This invite link can be revoked by group admins._`;

			return await message.reply(replyMessage);
		} catch (error) {
			console.error(error);
			return await message.reply("_Error occurred while generating invite link_");
		}
	},
);

const muteSchedules = {};

Module(
	{
		pattern: "automute ?(.*)",
		fromMe: true,
		desc: "Schedule group mute",
		type: "group",
	},
	async (message, match, m, client) => {
		if (!message.isGroup) return await message.reply("_This command is for groups_");
		if (!match) return await message.reply("_Provide time in HH:mm format_");

		const isUserAdmin = await isAdmin(message.jid, message.participant, client);
		if (!isUserAdmin) return await message.reply("_You need to be an admin to use this command_");

		const [hours, minutes] = match.split(":").map(Number);
		if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
			return await message.reply("_Invalid time format. Use HH:mm (e.g., 14:30)_");
		}

		const muteTime = moment().set({ hours, minutes, seconds: 0 });
		if (muteTime.isBefore(moment())) {
			muteTime.add(1, "day");
		}

		muteSchedules[message.jid] = {
			mute: muteTime.toDate(),
			unmute: null,
		};

		await message.reply(`_Group will be muted at ${muteTime.format("HH:mm")} daily_`);
	},
);

Module(
	{
		pattern: "autounmute ?(.*)",
		fromMe: true,
		desc: "Schedule group unmute",
		type: "group",
	},
	async (message, match, m, client) => {
		if (!message.isGroup) return await message.reply("_This command is for groups_");
		if (!match) return await message.reply("_Provide time in HH:mm format_");

		const isUserAdmin = await isAdmin(message.jid, message.participant, client);
		if (!isUserAdmin) return await message.reply("_You need to be an admin to use this command_");

		const [hours, minutes] = match.split(":").map(Number);
		if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
			return await message.reply("_Invalid time format. Use HH:mm (e.g., 14:30)_");
		}

		const unmuteTime = moment().set({ hours, minutes, seconds: 0 });
		if (unmuteTime.isBefore(moment())) {
			unmuteTime.add(1, "day");
		}

		if (!muteSchedules[message.jid]) {
			muteSchedules[message.jid] = { mute: null, unmute: null };
		}
		muteSchedules[message.jid].unmute = unmuteTime.toDate();

		await message.reply(`_Group will be unmuted at ${unmuteTime.format("HH:mm")} daily_`);
	},
);

Module(
	{
		on: "message",
	},
	async (message, match, m, client) => {
		if (!message.isGroup) return;

		const now = new Date();
		const schedule = muteSchedules[message.jid];

		if (schedule) {
			if (schedule.mute && moment(now).format("HH:mm") === moment(schedule.mute).format("HH:mm")) {
				try {
					await client.groupSettingUpdate(message.jid, "announcement");
					await client.sendMessage(message.jid, { text: "_Group has been muted_" });
				} catch (error) {
					console.error("Error muting group:", error);
				}
			}

			if (schedule.unmute && moment(now).format("HH:mm") === moment(schedule.unmute).format("HH:mm")) {
				try {
					await client.groupSettingUpdate(message.jid, "not_announcement");
					await client.sendMessage(message.jid, { text: "_Group has been unmuted_" });
				} catch (error) {
					console.error("Error unmuting group:", error);
				}
			}
		}
	},
);
