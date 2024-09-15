const { Module, mode, toAudio, toPTT, twitter } = require("../lib");
const { ytPlay } = require("client");

Module(
	{
		pattern: "twitter",
		fromMe: mode,
		desc: "download twitter media",
		type: "download",
	},
	async (message, match, client) => {
		if (!match) return await message.sendReply("```Wrong format\n\n" + message.prefix + "twitter URL```");
		if (!isUrl(match)) return await message.reply("_Invaild Twitter Url_");
		const msg = await message.reply("*_Downloading_*");
		const buff = await twitter(match);
		await msg.edit("*_Download Success_*");
		return await message.send(buff);
	},
);

Module(
	{
		pattern: "video",
		fromMe: mode,
		desc: "Fetches Video",
		type: "download",
	},
	async (message, match, client) => {
		if (!match[1]) return message.sendReply(`\`\`\`Wrong Usage\n\n${message.prefix}video Just the two of us\`\`\``);
		const msg = await message.reply("*_Searching_*");
		const { video } = await ytPlay(match);
		await msg.edit(`*_Downloaded Success_*`);
		return await message.send(video);
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
		const msg = await message.reply("*_Downloading_*");
		const { video } = await ytPlay(match);
		const audio = await toPTT(video, "mp3");
		await msg.edit(`*_Downloaded Successfully_*`);
		return await message.send(audio);
	},
);
