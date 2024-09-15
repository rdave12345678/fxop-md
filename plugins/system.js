const { Module, mode, runtime, commands, removePluginHandler, installPluginHandler, listPluginsHandler } = require("../lib");
const util = require("util");
const { BOT_INFO, TIME_ZONE } = require("../config");
const { exec } = require("child_process");

Module(
	{
		pattern: "ping ?(.*)",
		fromMe: mode,
		desc: "Bot response in milliseconds.",
		type: "system",
	},
	async message => {
		const start = new Date().getTime();
		const msg = await message.reply("Checking");
		const end = new Date().getTime();
		const responseTime = (end - start) / 1000;
		await msg.edit(`\`\`\`Responce Rate ${responseTime} secs\`\`\``);
	},
);

Module(
	{
		pattern: "restart",
		fromMe: true,
		desc: "Restarts Bot",
		type: "system",
	},
	async (msg, match, client) => {
		await msg.sendReply("*_Restarting_*");
		await exec(require("../package.json").scripts.start);
	},
);

Module(
	{
		pattern: "shutdown",
		fromMe: true,
		desc: "stops the bot",
		type: "system",
	},
	async (message, match) => {
		await message.sendReply("*_Shutting Down_*");
		await exec(require("../package.json").scripts.stop);
	},
);

Module(
	{
		pattern: "runtime",
		fromMe: true,
		desc: "Check uptime of bot",
		type: "system",
	},
	async (message, match) => {
		message.reply(`*Alive ${runtime(process.uptime())}*`);
	},
);

Module(
	{
		pattern: "install",
		fromMe: true,
		desc: "Installs External plugins",
		type: "system",
	},
	installPluginHandler,
);
Module(
	{
		pattern: "plugin",
		fromMe: true,
		desc: "Plugin list",
		type: "system",
	},
	listPluginsHandler,
);
Module(
	{
		pattern: "remove",
		fromMe: true,
		desc: "Remove external plugins",
		type: "system",
	},
	removePluginHandler,
);

Module(
	{
		pattern: "menu",
		fromMe: mode,
		description: "Show All Commands",
		dontAddCommandList: true,
	},
	async (message, query) => {
		if (query) {
			for (const plugin of commands) {
				if (plugin.pattern && plugin.pattern.test(message.prefix + query)) {
					const commandName = plugin.pattern.toString().split(/\W+/)[2]; // Changed this line
					return message.reply(`\`\`\`Command: ${message.prefix}${commandName.trim()}
Description: ${plugin.description || "No description available"}\`\`\``);
				}
			}
			return message.reply("Command not found.");
		} else {
			const { prefix } = message;
			const [currentDate, currentTime] = new Date().toLocaleString("en-IN", { timeZone: TIME_ZONE }).split(",");
			let menuText = `\`\`\`╭─ ${BOT_INFO.split(";")[0]}  ───
│ User: ${message.pushName}
│ Prefix: ${prefix}
│ Date: ${currentDate}
│ Time: ${currentTime}
│ Plugins: ${commands.length}
│ Runtime: ${runtime(process.uptime())}
╰────────────────\`\`\`\n`;

			const commandList = [];
			const categories = new Set();

			commands.forEach(command => {
				if (command.pattern && !command.dontAddCommandList) {
					const commandName = command.pattern.toString().split(/\W+/)[2]; // Changed this line
					const category = command.type ? command.type.toLowerCase() : "misc";
					commandList.push({ name: commandName, category });
					categories.add(category);
				}
			});

			commandList.sort((a, b) => a.name.localeCompare(b.name));
			Array.from(categories)
				.sort()
				.forEach(category => {
					menuText += `\n\`\`\`╭── ${category.toUpperCase()} ────`;
					const categoryCommands = commandList.filter(cmd => cmd.category === category);
					categoryCommands.forEach(({ name }) => {
						menuText += `\n│ ${name.toUpperCase().trim()}`;
					});
					menuText += `\n╰──────────────\`\`\`\n`;
				});
			return await message.send(menuText.trim());
		}
	},
);

Module(
	{
		pattern: "list",
		fromMe: mode,
		description: "Show All Commands",
		dontAddCommandList: true,
	},
	async (message, query, { prefix }) => {
		let commandListText = "\t\t```Command List```\n";
		const commandList = [];

		commands.forEach(command => {
			if (command.pattern && !command.dontAddCommandList) {
				const commandName = command.pattern.toString().split(/\W+/)[2]; // Changed this line
				const description = command.desc || command.info || "No description available";
				commandList.push({ name: commandName, description });
			}
		});

		commandList.sort((a, b) => a.name.localeCompare(b.name));
		commandList.forEach(({ name, description }, index) => {
			commandListText += `\`\`\`${index + 1} ${name.trim()}\`\`\`\n`;
			commandListText += `Use: \`\`\`${description}\`\`\`\n\n`;
		});

		return await message.send(commandListText);
	},
);

const preBuiltFunctions = {
	log: (message, ...args) => message.send(args.join(" ")), // Update to accept message
	fetch: async url => {
		const response = await require("node-fetch")(url);
		return response.text();
	},
	jsKeywords: {
		undefined: undefined,
		null: null,
		true: true,
		false: false,
		NaN: NaN,
		Infinity: Infinity,
		String: String,
		Number: Number,
		Object: Object,
		Array: Array,
		Function: Function,
		RegExp: RegExp,
		Date: Date,
		Error: Error,
		Promise: Promise,
		let: "let",
		const: "const",
		var: "var",
		if: "if",
		else: "else",
		switch: "switch",
		case: "case",
		default: "default",
		for: "for",
		while: "while",
		do: "do",
		break: "break",
		continue: "continue",
		return: "return",
		try: "try",
		catch: "catch",
		finally: "finally",
		throw: "throw",
		class: "class",
		extends: "extends",
		super: "super",
		import: "import",
		export: "export",
		new: "new",
		delete: "delete",
		typeof: "typeof",
		instanceof: "instanceof",
		in: "in",
		this: "this",
		void: "void",
		with: "with",
		yield: "yield",
		async: "async",
		await: "await",
		debugger: "debugger",
		eval: "eval",
		arguments: "arguments",
	},
};

Module(
	{
		on: "text",
		fromMe: false,
		dontAddCommandList: true,
	},
	async (message, match) => {
		const content = message.text;
		if (!content) return;
		if (!(content.startsWith(">") || content.startsWith("$"))) return;

		const evalCmd = content.slice(1).trim();

		try {
			if (preBuiltFunctions.jsKeywords.hasOwnProperty(evalCmd)) {
				const result = preBuiltFunctions.jsKeywords[evalCmd];
				await message.reply(util.inspect(result, { depth: null }));
				return;
			}
			preBuiltFunctions.log(`Evaluating command: ${evalCmd}`);

			let result = await eval(`
							(async () => {
									try {
											const result = ${evalCmd};
											return result instanceof Promise ? await result : result;
									} catch (err) {
											return 'Error: ' + err.message;
									}
							})();
					`);

			if (typeof result !== "string") {
				result = util.inspect(result, { depth: null });
			}
			preBuiltFunctions.log(`Result: ${result}`);

			await message.reply(result);
		} catch (error) {
			preBuiltFunctions.log(`Error: ${error.message}`);
			await message.reply(`Error: ${error.message}`);
		}
	},
);
