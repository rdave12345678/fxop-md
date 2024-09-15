const { Module, mode, toAudio, toPTT } = require("../lib");
const { ytPlay } = require("client");

Module(
	{
		pattern: "video",
		fromMe: mode,
		desc: "Fetches Video",
		type: "download",
	},
	async (message, match, client) => {
		if (!match[1]) return message.sendReply(`\`\`\`Wrong Usage\n\n${message.prefix}video Just the two of us\`\`\``);

		const smsg = await message.reply("*_Searching_*");
		const {
			details: { title, description },
			video,
		} = await ytPlay(match);
		await message.send(video, { caption: `\`\`\`${description}\`\`\``, contextInfo: { forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: "120363327841612745@newsletter", newsletterName: title } } });
		return smsg.edit(`*_Downloaded Successfully_*`);
	},
);

Module(
	{
		pattern: "play",
		fromMe: mode,
		desc: "Fetches Music",
		type: "download",
	},
	async (message, match, client) => {
		if (!match[1]) return message.sendReply(`\`\`\`Wrong Usage\n\n${message.prefix}play StarMan\`\`\``);
		const smsg = await message.reply("*_Downloading_*");
		const {
			details: { title, description },
			video,
		} = await ytPlay(match);
		const audio = await toPTT(video, "mp3");
		await message.send(audio, { caption: `\`\`\`${description}\`\`\``, contextInfo: { forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: "120363327841612745@newsletter", newsletterName: title } } });
		return smsg.edit(`*_Downloaded Successfully_*`);
	},
);
