const { Module, mode, getJson, getBuffer, askAi, enhanceImage, bing } = require("../lib");

Module(
	{
		pattern: "gpt",
		fromMe: mode,
		desc: "Chat with Gpt",
		type: "fx ai",
	},
	async (message, match, client) => {
		if (!match) return await message.sendReply(`\`\`\`Hello ${message.pushName} how can I Help You Today?\n\n${message.prefix}gpt Write Me A Joke\`\`\``);
		const msg = await message.reply("_Thinking About It 🤔_");
		const response = await askAi("gpt", match);
		return await msg.edit(`*${message.pushName}: ${match}*\n\n*GPT:* \`\`\`${response.response}\`\`\``);
	},
);

Module(
	{
		pattern: "aoyo",
		fromeMe: mode,
		desc: "Chat with Aoyo",
		type: "fx ai",
	},
	async (message, match, client) => {
		if (!match) return await message.sendReply(`\`\`\`Hello ${message.pushName} I'm Aoyo, ask questions by using,\n\n${message.prefix}aoyo What is the Capital of France\`\`\``);
		const msg = await message.reply(`_${message.pushName} wait still while I Research_`);
		const response = await askAi("aoyo", match);
		return await msg.edit(`*${message.senderName.toUpperCase()}*, ` + response.result);
	},
);

Module(
	{
		pattern: "bingai",
		fromMe: mode,
		desc: "Interact with MSBing",
		type: "fx ai",
	},
	async (message, match, client) => {
		if (!match) return await message.sendReply(`\`\`\`${message.pushName} Give Me A Query\n\n${message.prefix}bingai When is Champions League Resuming Again?\`\`\``);
		const msg = await message.reply(`_${message.senderName} searching for (${match})_`);
		const res = await bing(match);
		return await msg.edit(res);
	},
);

Module(
	{
		pattern: "dalle",
		fromeMe: mode,
		desc: "Generate Images",
		type: "fx ai",
	},
	async (message, match, client) => {
		if (!match) return await message.sendReply(`\`\`\`Wrong format ${message.senderName}\n\n${message.prefix}dalle A futurisc Car\`\`\``);
		const msg = await await message.reply("_Generating " + match + "_");
		const res = await askAi("dalle", match);
		const buff = await getBuffer(res);
		await msg.edit("_Successfully Generated " + match + "_");
		return await message.send(buff, { caption: match });
	},
);

Module(
	{
		pattern: "blackbox",
		fromeMe: mode,
		desc: "Generate Codes Snippets",
		type: "fx ai",
	},
	async (message, match, client) => {
		if (!match) return await message.sendReply(`\`\`\`Wrong format ${message.senderName}\n\n${message.prefix}blackbox Python code snippet using the requests and BeautifulSoup libraries to get you started with web scraping\`\`\``);
		const msg = await message.reply("_Generating Code for_\n" + match + "");
		const res = await askAi("blackbox", match);
		return await msg.edit(res.result);
	},
);

Module(
	{
		pattern: "animegen",
		fromMe: mode,
		desc: "Generate Images",
		type: "fx ai",
	},
	async (message, match, client) => {
		const prefix = message.prefix;
		const name = message.senderName;
		if (!match) return await message.sendReply(`\`\`\`Wrong format ${name}\n\n${prefix}animegen An Image of A Cat & Dog\`\`\``);
		const msg = await message.reply("_Generating Image Of " + match + "_");
		const res = await askAi("prodia", match);
		const buff = await getBuffer(res);
		await msg.edit("_Successfully Generated Image of " + match + "_");
		return await message.send(buff, { caption: match });
	},
);

Module(
	{
		pattern: "gpt2",
		fromMe: mode,
		desc: "Gpt BackUP LOL",
		type: "fx ai",
	},
	async (message, match, client) => {
		if (!match) return await message.sendReply(`\`\`\`Wrong Format ${message.senderName}\n\n${message.prefix}gpt2 Write a Breife History on WW2\`\`\``);
		const msg = await message.reply(`_Sure! ${message.senderName}, let me think about ${match}_`);
		const res = await askAi("chatgpt", match);
		return await msg.edit(res);
	},
);

Module(
	{
		pattern: "enhance",
		fromMe: mode,
		desc: "Enhances Images",
		type: "fx ai",
	},
	async (message, match, m, client) => {
		if (!message.reply_message?.image) return await message.sendReply("```" + message.senderName + " Reply An Image To Enhance!```");
		const msg = await message.reply("_Enhancing Image_");
		const img = await m.quoted.download();
		const buff = await enhanceImage(img);
		await msg.edit("_Image Enhanced Success_");
		return await message.send(buff, { caption: "_Enhanced Image_" });
	},
);
