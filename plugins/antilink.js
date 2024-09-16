const { Module, mode } = require("../lib");
const { getAntilink, updateAntilink, createAntilink } = require("../lib/db/antilink");

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
    const [action] = match.split(" ");

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

      case "kick":
        if (!antilink) {
          antilink = await createAntilink(groupId);
        }
        await updateAntilink(groupId, { action: "kick" });
        await message.reply("Antilink action set to: kick");
        break;

      case "all":
        if (!antilink) {
          antilink = await createAntilink(groupId);
        }
        await updateAntilink(groupId, { action: "all" });
        await message.reply("Antilink action set to: all");
        break;

      case "get":
        if (antilink) {
          await message.reply(`Antilink status:
Enabled: ${antilink.isEnabled}
Action: ${antilink.action}`);
        } else {
          await message.reply("Antilink is not set up for this group.");
        }
        break;

      default:
        await message.reply(`Usage:
.antilink on - Enable antilink
.antilink off - Disable antilink
.antilink kick - Set action to kick
.antilink all - Set action to all (kick, warn, delete)
.antilink get - Check antilink status`);
    }
  }
);