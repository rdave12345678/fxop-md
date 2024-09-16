const pino = require("pino");
const path = require("path");
const fs = require("fs");
const plugins = require("./plugins");
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, delay, makeCacheableSignalKeyStore, DisconnectReason } = require("baileys");
const { PausedChats } = require("./db");
const config = require("../config");
const { serialize } = require("./serialize");
const { Greetings } = require("./Greetings");
const { getAntilink, incrementWarn } = require("./db/antilink");
const { Image, Message, Sticker, Video, AllMessage } = require("./class");
const { loadMessage, saveMessage, saveChat, getName } = require("./db/StoreDb");
const { connectSession } = require("./auth");
const cron = require("node-cron");
const moment = require("moment");

global.muteSchedules = new Map();

function scheduleGroupMuteUnmute(jid, muteTime, unmuteTime, conn) {
	if (global.muteSchedules.has(jid)) {
		global.muteSchedules.get(jid).forEach(task => task.stop());
	}

	const tasks = [];

	if (muteTime) {
		console.log(`Scheduling mute at ${muteTime.format("HH:mm")} for group: ${jid}`);
		const muteCron = cron.schedule(
			`${muteTime.minute()} ${muteTime.hour()} * * *`,
			async () => {
				try {
					await conn.groupSettingUpdate(jid, "announcement");
					await conn.sendMessage(jid, { text: "_Group has been muted_" });
					console.log(`Group ${jid} muted at ${moment().format("HH:mm:ss")}`);
				} catch (error) {
					console.error("Error muting group:", error);
				}
			},
			{
				scheduled: true,
				timezone: config.TIME_ZONE,
			},
		);
		tasks.push(muteCron);
	}
	if (unmuteTime) {
		console.log(`Scheduling unmute at ${unmuteTime.format("HH:mm")} for group: ${jid}`);
		const unmuteCron = cron.schedule(
			`${unmuteTime.minute()} ${unmuteTime.hour()} * * *`,
			async () => {
				try {
					await conn.groupSettingUpdate(jid, "not_announcement");
					await conn.sendMessage(jid, { text: "_Group has been unmuted_" });
					console.log(`Group ${jid} unmuted at ${moment().format("HH:mm:ss")}`);
				} catch (error) {
					console.error("Error unmuting group:", error);
				}
			},
			{
				scheduled: true,
				timezone: config.TIME_ZONE,
			},
		);
		tasks.push(unmuteCron);
	}
	global.muteSchedules.set(jid, tasks);

	console.log(`Tasks scheduled for group: ${jid}.`);
}

function initializeSchedules(conn) {
	global.muteSchedules.forEach((schedule, jid) => {
		const muteTask = schedule.find(task => task.expression.includes("announcement"));
		const unmuteTask = schedule.find(task => task.expression.includes("not_announcement"));

		const muteTime = muteTask ? muteTask.expression.split(" ") : null;
		const unmuteTime = unmuteTask ? unmuteTask.expression.split(" ") : null;

		if (muteTime) {
			scheduleGroupMuteUnmute(jid, moment().set({ hour: muteTime[1], minute: muteTime[0] }), null, conn);
		}

		if (unmuteTime) {
			scheduleGroupMuteUnmute(jid, null, moment().set({ hour: unmuteTime[1], minute: unmuteTime[0] }), conn);
		}
	});
}

const logger = pino({ level: "silent" });
const connect = async () => {
	const sessionDir = "../session";
	if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir);
	await connectSession();

	const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, sessionDir));
	//	const { version } = await fetchLatestBaileysVersion();

	const conn = makeWASocket({
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, logger),
		},
		printQRInTerminal: false,
		logger,
		browser: Browsers.macOS("Desktop"),
		downloadHistory: false,
		syncFullHistory: false,
		markOnlineOnConnect: false,
		emitOwnEvents: true,
		//	version,
		getMessage: async key => (loadMessage(key.id) || {}).message || { conversation: null },
	});

	conn.ev.on("connection.update", handleConnectionUpdate(conn));
	conn.ev.on("creds.update", saveCreds);
	conn.ev.on("group-participants.update", async data => Greetings(data, conn));
	conn.ev.on("chats.update", async chats => chats.forEach(async chat => await saveChat(chat)));
	conn.ev.on("messages.upsert", handleMessages(conn));

	const handleErrors = async err => {
		const { message, stack } = err;
		const fileName = stack?.split("\n")[1]?.trim();
		const errorText = `\`\`\`Error: ${message}\nIn: ${fileName}\`\`\``;
		await conn.sendMessage(conn.user.id, { text: errorText });
		console.log(message, fileName);
	};

	process.on("unhandledRejection", handleErrors);
	process.on("uncaughtException", handleErrors);

	return conn;
};

const handleConnectionUpdate = conn => async s => {
	const { connection, lastDisconnect } = s;
	if (connection === "connecting") console.log("Connecting to WhatsApp...");
	else if (connection === "open") {
		console.log("\x1b[1m%s\x1b[0m", "Connected");
		const packageVersion = require("../package.json").version;
		const totalPlugins = plugins.commands.length;
		const workType = config.WORK_TYPE;
		const alive = `\`\`\`FX CONNECTED\nVersion: ${packageVersion}\nTotal Plugins: ${totalPlugins}\nWorktype: ${workType}\`\`\``;
		initializeSchedules(conn);
		conn.sendMessage(conn.user.id, { text: alive });
	} else if (connection === "close") {
		if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
			connect();
			console.log("Reconnecting...");
		} else {
			console.log("Connection closed. Device logged out.");
			await delay(3000);
			process.exit(0);
		}
	}
};

const handleMessages = conn => async m => {
	if (m.type !== "notify") return;
	let msg = await serialize(JSON.parse(JSON.stringify(m.messages[0])), conn);
	await saveMessage(m.messages[0], msg.sender);
	if (config.AUTO_READ) await conn.readMessages(msg.key);
	if (config.AUTO_STATUS_READ && msg.from === "status@broadcast") await conn.readMessages(msg.key);

	let text_msg = msg.body;
	if (!msg) return;

	const regex = new RegExp(`${config.HANDLERS}( ?resume)`, "is");
	const isResume = regex.test(text_msg);
	const chatId = msg.from;
	const pausedChats = await PausedChats.getPausedChats();

	if (pausedChats.some(pausedChat => pausedChat.chatId === chatId && !isResume)) return;

	if (config.ANTILINK && msg.from.endsWith("@g.us")) {
		const antilink = await getAntilink(msg.from);
		if (antilink && antilink.isEnabled) {
			const groupMetadata = await conn.groupMetadata(msg.from);
			const isAdmin = groupMetadata.participants.find(p => p.id === msg.sender)?.admin;
			if (!isAdmin) {
				const containsLink = checkForLinks(text_msg);
				if (containsLink) {
					const isAllowedLink = checkAllowedLinks(text_msg, antilink.allowedLinks);
					if (!isAllowedLink) {
						await handleAntilinkAction(antilink.action, msg, conn);
						if (antilink.action === "delete" || antilink.action === "all") return;
					}
				}
			}
		}
	}

	if (config.LOGS) {
		const name = await getName(msg.sender);
		const chatInfo = msg.from.endsWith("@g.us") ? (await conn.groupMetadata(msg.from)).subject : msg.from;
		console.log(`${chatInfo}\n${name}: ${text_msg ? text_msg : msg.type}`);
	}

	var whats;
	plugins.commands.map(async command => {
		if (command.fromMe && !msg.devs && !msg.sudo) return;

		const handleCommand = (Instance, args) => {
			whats = new Instance(conn, msg);
			command.function(whats, ...args, msg, conn, m);
		};

		if (text_msg && command.pattern) {
			let iscommand = text_msg.match(command.pattern);
			if (iscommand) {
				let [, prefix, , match] = iscommand;
				match = match ? match : false;
				msg.prefix = prefix;
				msg.command = [prefix, iscommand[2]].join("");
				handleCommand(Message, [match]);
			}
		} else {
			switch (command.on) {
				case "text":
					if (text_msg) handleCommand(Message, [text_msg]);
					break;
				case "image":
					if (msg.type === "imageMessage") handleCommand(Image, [text_msg]);
					break;
				case "sticker":
					if (msg.type === "stickerMessage") handleCommand(Sticker, []);
					break;
				case "video":
					if (msg.type === "videoMessage") handleCommand(Video, []);
					break;
				case "delete":
					if (msg.type === "protocolMessage") {
						whats = new Message(conn, msg);
						whats.messageId = msg.message.protocolMessage.key?.id;
						command.function(whats, msg, conn, m);
					}
					break;
				case "message":
					handleCommand(AllMessage, []);
					break;
				default:
					break;
			}
		}
	});
};

function checkForLinks(text) {
	const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
	return urlRegex.test(text);
}

function checkAllowedLinks(text, allowedLinks) {
	return allowedLinks.some(link => text.includes(link));
}

async function handleAntilinkAction(action, msg, conn) {
	switch (action) {
		case "kick":
			await conn.groupParticipantsUpdate(msg.from, [msg.sender], "remove");
			break;
		case "warn":
			const warn = await incrementWarn(msg.from, msg.sender);
			if (warn.warnCount >= 3) {
				await conn.groupParticipantsUpdate(msg.from, [msg.sender], "remove");
			} else {
				await conn.sendMessage(msg.from, { text: `@${msg.sender.split("@")[0]}, you have been warned for sending a link. Warning ${warn.warnCount}/3`, mentions: [msg.sender] });
			}
			break;
		case "delete":
			await conn.sendMessage(msg.from, { delete: msg.key });
			break;
		case "all":
			await conn.groupParticipantsUpdate(msg.from, [msg.sender], "remove");
			await conn.sendMessage(msg.from, { delete: msg.key });
			break;
	}
}
module.exports = { connect, scheduleGroupMuteUnmute };
