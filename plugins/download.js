const { Module, mode, toPTT, twitter, getJson, IronMan, getBuffer, aptoideDl } = require("../lib");
const { ytPlay } = require("client");

Module(
	{
		pattern: "apk ?(.*)",
		fromMe: mode,
		desc: "Downloads and sends an app",
		type: "download",
	},
	async (message, match) => {
		const appId = match;
		if (!appId) return await message.reply(`\`\`\`Wrong format\n\n${message.prefix}apk FreeFire\`\`\``);
		const msg = await message.reply("_Downloading " + match + "_");
		const appInfo = await aptoideDl(appId);
		const buff = await getBuffer(appInfo.link);
		await msg.edit("*_Download Success_*");
		await message.sendMessage(message.jid, buff, { mimetype: "application/vnd.android.package-archive", filename: `${appId.appname}.apk`, caption: match }, "document");
	},
);

Module(
	{
		pattern: "spotify ?(.*)",
		fromMe: mode,
		desc: "Downloads song from Spotify",
		type: "download",
	},
	async (message, match) => {
		if (!match || !match.includes("https://open.spotify.com")) return await message.reply("_Need a valid Spotify URL_");
		const { link } = await getJson(IronMan(`ironman/dl/spotify?link=${match}`));
		const buff = await toPTT(await getBuffer(link));
		await message.send(buff);
	},
);

Module(
	{
		pattern: "twitter",
		fromMe: mode,
		desc: "Download Twitter media",
		type: "download",
	},
	async (message, match) => {
		if (!match || !match.includes("https://x.com")) return await message.reply("_Invalid Twitter URL_");
		const msg = await message.reply("*_Downloading_*");
		const buff = await twitter(match);
		await msg.edit("*_Download Success_*");
		await message.send(buff);
	},
);

Module(
	{
		pattern: "video",
		fromMe: mode,
		desc: "Fetches Video",
		type: "download",
	},
	async (message, match) => {
		if (!match[1]) return message.sendReply(`\`\`\`Wrong Usage\n\n${message.prefix}video Just the two of us\`\`\``);
		const msg = await message.reply("*_Searching_*");
		const { video } = await ytPlay(match);
		await msg.edit(`*_Download Success_*`);
		await message.send(video);
	},
);

Module(
	{
		pattern: "play",
		fromMe: mode,
		desc: "Fetches Music",
		type: "download",
	},
	async (message, match) => {
		if (!match[1]) return message.sendReply(`\`\`\`Wrong Usage\n\n${message.prefix}play StarMan\`\`\``);
		const msg = await message.reply("*_Downloading_*");
		const { video } = await ytPlay(match);
		const audio = await toPTT(video, "mp3");
		await msg.edit(`*_Download Successful_*`);
		await message.send(audio);
	},
);
