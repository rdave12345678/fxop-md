const { Module, mode, getBuffer, toAudio, toPTT } = require("../lib");
const { ytPlay } = require("client");

Module(
	{
		pattern: "play",
		fromMe: mode,
		desc: "Fetches Music",
		type: "download",
	},
	async (message, match, client) => {
		if (!match) {
			return await message.sendReply(`\t\`\`\`Wrong Usage\n\n${message.prefix}play Just the two of us\n\nOR\n\n${message.prefix}play YTMusic URL\`\`\``);
		}
		const smsg = await message.reply("*_Searching_*");
		const audioDl = await ytPlay(match);
		const title = audioDl.details.title;
		const description = audioDl.details.description;
		const audio = audioDl.video;
		const audioInfoMsg = `\`\`\`${title}\n${description}\`\`\``;
		await smsg.edit(audioInfoMsg);
		const audioFile = await toAudio(audio, "mp3");
		return await message.sendFile(audioFile);
	},
);
