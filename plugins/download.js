const { Module, mode } = require("../lib");
const { ytPlay } = require("client");

Module(
	{
		pattern: "video",
		fromMe: mode,
		desc: "Fetches Music",
		type: "download",
	},
	async (message, match, client) => {
		if (!match) {
			return message.sendReply(`\`\`\`Wrong Usage\n\n${message.prefix}video Just the two of us\n\nOR\n\n${message.prefix}video YOUTUBE URL\`\`\``);
		}

		const smsg = await message.reply("*_Searching_*");
		const {
			details: { title, description },
			video,
		} = await ytPlay(match);

		await message.send(video, {
			caption: `\`\`\`${description}\`\`\``,
			contextInfo: {
				forwardingScore: 999,
				isForwarded: true,
				forwardedNewsletterMessageInfo: {
					newsletterJid: "120363327841612745@newsletter",
					newsletterName: title,
				},
			},
		});

		return smsg.edit(`*_Downloaded Successfully_*`);
	},
);
