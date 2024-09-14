const ai = require("../lib/plugins");
const { mode, getBuffer } = require("../lib");
const astro = require("client");

ai.Module(
	{
		pattern: "animegen",
		fromMe: mode,
		desc: "Generate Images with Ai",
		type: "ai gen",
	},
	async (message, match) => {
		if (!match) return await message.sendReply("```Provide Me Words\n\n" + message.prefix + "animegen A cat and dog hugging each other.```");
		const image = await astro.animeGen(match);
		await message.send(image, { caption: match, contextInfo: { forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: "120363327841612745@newsletter", newsletterName: "animegen" } } });
	},
);

ai.Module(
	{
		pattern: "dalle",
		fromMe: mode,
		desc: "Generate Images with Ai",
		type: "ai gen",
	},
	async (message, match) => {
		if (!match) return await message.sendReply("```Provide Me Words\n\n" + message.prefix + "dalle A cat and dog hugging each other.```");
		const image = await astro.dalle(match);
		await message.send(image, { caption: match, contextInfo: { forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: "120363327841612745@newsletter", newsletterName: "dalle" } } });
	},
);
