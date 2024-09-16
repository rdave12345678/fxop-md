const { Module, mode } = require("../lib");
const { getAntilink, updateAntilink, createAntilink, deleteAntilink } = require("../lib/db/antilink");

Module(
	{
		pattern: "antilink",
		fromMe: mode,
		desc: "Manage antilink settings",
		type: "group",
	},
	async (message, match) => {
		const groupId = message.jid;
		let antilink = await getAntilink(groupId);
		const fullCommand = message.text || "";
		const args = fullCommand.split(/\s+/).slice(1);
		const action = args[0] ? args[0].toLowerCase() : "";

		console.log("Full command:", fullCommand);
		console.log("Parsed arguments:", args);

		if (!action) {
			if (antilink) {
				await message.reply(`Antilink status:
Enabled: ${antilink.isEnabled}
Action: ${antilink.action}
Allowed links: ${antilink.allowedLinks.join(", ")}`);
			} else {
				await message.reply('Antilink is not set up for this group. Use ".antilink on" to enable it.');
			}
			return;
		}

		switch (action) {
			case "on":
				if (!antilink) {
					antilink = await createAntilink(groupId);
				}
				await updateAntilink(groupId, { isEnabled: true });
				await message.reply("Antilink has been enabled for this group.");
				break;

			case "off":
				if (antilink) {
					await updateAntilink(groupId, { isEnabled: false });
					await message.reply("Antilink has been disabled for this group.");
				} else {
					await message.reply("Antilink is not set up for this group.");
				}
				break;

			case "set":
				if (!antilink) {
					antilink = await createAntilink(groupId);
				}
				if (args.length < 3) {
					await message.reply("Invalid syntax. Use: .antilink set <action|allow> <value>");
					return;
				}
				const setting = args[1].toLowerCase();
				const value = args.slice(2).join(" ");
				switch (setting) {
					case "action":
						if (["kick", "warn", "delete", "all"].includes(value)) {
							await updateAntilink(groupId, { action: value });
							await message.reply(`Antilink action set to: ${value}`);
						} else {
							await message.reply("Invalid action. Use kick, warn, delete, or all.");
						}
						break;
					case "allow":
						const allowedLinks = value.split(",").map(link => link.trim());
						await updateAntilink(groupId, { allowedLinks });
						await message.reply(`Allowed links updated: ${allowedLinks.join(", ")}`);
						break;
					default:
						await message.reply("Invalid setting. Use action or allow.");
				}
				break;

			case "status":
				if (antilink) {
					await message.reply(`Antilink status:
Enabled: ${antilink.isEnabled}
Action: ${antilink.action}
Allowed links: ${antilink.allowedLinks.join(", ")}`);
				} else {
					await message.reply("Antilink is not set up for this group.");
				}
				break;

			default:
				await message.reply(`Usage:
.antilink on - Enable antilink
.antilink off - Disable antilink
.antilink set action <kick|warn|delete|all> - Set antilink action
.antilink set allow <link1,link2,...> - Set allowed links
.antilink status - Check antilink status`);
		}
	},
);
