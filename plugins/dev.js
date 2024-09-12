const { Module } = require("../lib");
Module(
 {
  on: "text",
  fromMe: true,
  dontAddCommandList: true,
 },
 async (message, match) => {
  const messageText = message.text || message.message?.text || "";
  if (messageText.startsWith("$") || messageText.startsWith(">")) {
   const code = messageText.slice(1).trim();
   try {
    const result = eval(code);
    const output = typeof result === "string" ? result : JSON.stringify(result, null, 2);
    await message.reply(`Execution Result:\n\`\`\`\n${output}\n\`\`\``);
   } catch (error) {
    await message.reply(`Error:\n\`\`\`\n${error.message}\n\`\`\``);
   }
  }
 }
);