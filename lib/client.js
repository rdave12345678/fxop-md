const pino = require("pino");
const path = require("path");
const fs = require("fs");
const plugins = require("./plugins");
const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, Browsers, delay, makeCacheableSignalKeyStore, DisconnectReason } = require("baileys");
const { PausedChats } = require("./db");
const config = require("../config");
const { serialize } = require("./serialize");
const { Greetings } = require("./Greetings");
const { Image, Message, Sticker, Video, AllMessage } = require("./class");
const { loadMessage, saveMessage, saveChat, getName } = require("./db/StoreDb");
const { connectSession } = require("./auth");
const logger = pino({ level: "silent" });
const connect = async () => {
	const sessionDir = "../session";
	if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir);
	await connectSession();

	const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, sessionDir));
	const { version } = await fetchLatestBaileysVersion();

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
		version,
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

module.exports = { connect };
