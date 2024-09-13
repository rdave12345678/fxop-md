const plugins = require("../lib/plugins");
const { Module, mode, runtime } = require("../lib");
const { BOT_INFO, TIME_ZONE } = require("../config");

Module(
	{
		pattern: "menu",
		fromMe: mode,
		desc: "Show All Commands",
		dontAddCommandList: true,
	},
	async (message, match) => {
		if (match) {
			for (let i of plugins.commands) {
				if (i.pattern instanceof RegExp && i.pattern.test(message.prefix + match)) {
					const cmdName = i.pattern.toString().split(/\W+/)[1];
					message.reply(`\`\`\`Command: ${message.prefix}${cmdName.trim()}
Description: ${i.desc}\`\`\``);
				}
			}
		} else {
			let { prefix } = message;
			let [date, time] = new Date().toLocaleString("en-IN", { timeZone: TIME_ZONE }).split(",");
			let menu = `╭─ ${BOT_INFO.split(",")[0]}  ───
│ User: ${message.pushName}
│ Prefix : ${prefix}
│ Date: ${date}
│ Time: ${time}
│ Plugins: ${plugins.commands.length}
│ Runtime: ${runtime(process.uptime())}
╰────────────────\n`;
			let cmnd = [];
			let cmd;
			let category = [];
			plugins.commands.map((command, num) => {
				if (command.pattern instanceof RegExp) {
					cmd = command.pattern.toString().split(/\W+/)[1];
				}

				if (!command.dontAddCommandList && cmd !== undefined) {
					let type = command.type ? command.type.toLowerCase() : "misc";

					cmnd.push({ cmd, type });

					if (!category.includes(type)) category.push(type);
				}
			});
			cmnd.sort();
			category.sort().forEach(cmmd => {
				menu += `\n╭── *${cmmd.toUpperCase()}*  ────\n`;
				let comad = cmnd.filter(({ type }) => type == cmmd);
				comad.forEach(({ cmd }) => {
					menu += `\n│ ${cmd.trim()}`;
				});
				menu += `╰──────────────\n`;
			});
			menu += `_🔖Send ${prefix}menu <command name> to get detailed information of a specific command._\n*📍Eg:* _${prefix}menu plugin_`;
			return await message.send(menu);
		}
	},
);

Module(
	{
		pattern: "list",
		fromMe: mode,
		desc: "Show All Commands",
		dontAddCommandList: true,
	},
	async (message, match, { prefix }) => {
		let menu = "\t\t```Command List```\n";

		let cmnd = [];
		let cmd, desc;
		plugins.commands.map(command => {
			if (command.pattern) {
				cmd = command.pattern.toString().split(/\W+/)[1];
			}
			desc = command.desc || false;

			if (!command.dontAddCommandList && cmd !== undefined) {
				cmnd.push({ cmd, desc });
			}
		});
		cmnd.sort();
		cmnd.forEach(({ cmd, desc }, num) => {
			menu += `\`\`\`${(num += 1)} ${cmd.trim()}\`\`\`\n`;
			if (desc) menu += `Use: \`\`\`${desc}\`\`\`\n\n`;
		});
		menu += ``;
		return await message.reply(menu);
	},
);
