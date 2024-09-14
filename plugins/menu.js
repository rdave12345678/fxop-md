const pluginManager = require("../lib/plugins");
const { Module, mode, runtime } = require("../lib");
const { BOT_INFO, TIME_ZONE } = require("../config");

Module(
	{
		pattern: "menu",
		fromMe: mode,
		description: "Show All Commands",
		dontAddCommandList: true,
	},
	async (message, query) => {
		if (query) {
			for (const plugin of pluginManager.commands) {
				if (plugin.pattern instanceof RegExp && plugin.pattern.test(message.prefix + query)) {
					const commandName = plugin.pattern.toString().split(/\W+/)[1];
					message.reply(`\`\`\`Command: ${message.prefix}${commandName.trim()}
Description: ${plugin.description}\`\`\``);
				}
			}
		} else {
			const { prefix } = message;
			const [currentDate, currentTime] = new Date().toLocaleString("en-IN", { timeZone: TIME_ZONE }).split(",");
			let menuText = `\`\`\`╭─ ${BOT_INFO.split(";")[0]}  ───
│ User: ${message.pushName}
│ Prefix: ${prefix}
│ Date: ${currentDate}
│ Time: ${currentTime}
│ Plugins: ${pluginManager.commands.length}
│ Runtime: ${runtime(process.uptime())}
╰────────────────\`\`\`\n`;
			const commands = [];
			const categories = [];

			pluginManager.commands.forEach(command => {
				if (command.pattern instanceof RegExp) {
					const commandName = command.pattern.toString().split(/\W+/)[1];

					if (!command.dontAddCommandList && commandName !== undefined) {
						const category = command.type ? command.type.toLowerCase() : "misc";
						commands.push({ name: commandName, category });

						if (!categories.includes(category)) {
							categories.push(category);
						}
					}
				}
			});

			commands.sort((a, b) => a.name.localeCompare(b.name));
			categories.sort().forEach(category => {
				menuText += `\n\`\`\`╭── ${category.toUpperCase()} ────`;
				const categoryCommands = commands.filter(cmd => cmd.category === category);
				categoryCommands.forEach(({ name }) => {
					menuText += `\n│ ${name.toUpperCase().trim()}`;
				});
				menuText += `\n╰──────────────\`\`\`\n`;
			});

			menuText += `_🔖Send ${prefix}menu <command name> to get detailed information of a specific command._\n*📍Eg:* _${prefix}menu plugin_`;
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
		const commands = [];

		pluginManager.commands.forEach(command => {
			if (command.pattern) {
				const commandName = command.pattern.toString().split(/\W+/)[1];
				const description = command.description || false;

				if (!command.dontAddCommandList && commandName !== undefined) {
					commands.push({ name: commandName, description });
				}
			}
		});

		commands.sort((a, b) => a.name.localeCompare(b.name));
		commands.forEach(({ name, description }, index) => {
			commandListText += `\`\`\`${index + 1} ${name.trim()}\`\`\`\n`;
			if (description) {
				commandListText += `Use: \`\`\`${description}\`\`\`\n\n`;
			}
		});

		return await message.send(commandListText);
	},
);
