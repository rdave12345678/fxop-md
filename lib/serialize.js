const { downloadContentFromMessage, getContentType } = require("baileys");
const fs = require("fs").promises;
const fetch = require("node-fetch");
const { fromBuffer } = require("file-type");
const path = require("path");
const NodeCache = require("node-cache");
const Queue = require("better-queue");
const { v4: uuidv4 } = require("uuid");
const { writeExifImg, writeExifVid, imageToWebp, videoToWebp } = require("./exif");
const { parsedJid } = require("./functions");
const config = require("../config");

const mediaCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

const messageQueue = new Queue(
	async function (task, cb) {
		try {
			await processMessage(task.msg, task.conn);
			cb(null, "Message processed successfully");
		} catch (error) {
			cb(error);
		}
	},
	{ concurrent: 5 },
);

const logger = {
	info: message => console.log(`[INFO] ${message}`),
	error: message => console.error(`[ERROR] ${message}`),
	warn: message => console.warn(`[WARN] ${message}`),
};

const mimeMap = {
	imageMessage: "image",
	videoMessage: "video",
	stickerMessage: "sticker",
	documentMessage: "document",
	audioMessage: "audio",
	gifMessage: "gif",
	voiceMessage: "voice",
};

async function serialize(msg, conn) {
	try {
		conn.logger = logger;

		if (msg.key) {
			msg.id = msg.key.id;
			msg.isSelf = msg.key.fromMe;
			msg.from = msg.key.remoteJid;
			msg.isGroup = msg.from.endsWith("@g.us");
			msg.sender = msg.isGroup ? msg.key.participant : msg.isSelf ? conn.user.id : msg.from;
			msg.sudo = config.SUDO.split(",").includes(parsedJid(msg.sender)[0].split("@")[0]) || msg.key.fromMe;
		}

		if (msg.message) {
			msg.type = getContentType(msg.message);
			msg.mentions = msg.message[msg.type]?.contextInfo?.mentionedJid || [];

			msg.quoted = await extractQuotedMessage(msg);
			msg.body = extractMessageBody(msg);

			msg.download = pathFile => downloadMedia(msg.message, pathFile);
			msg.getMedia = () => handleMedia(msg.message, msg.type);

			conn.client = msg;
			conn.bot = msg;
			extendConnFunctions(conn);
		}
		messageQueue.push({ msg, conn });

		return msg;
	} catch (error) {
		logger.error(`Error in serialize: ${error.message}`);
		throw error;
	}
}

async function extractQuotedMessage(msg) {
	try {
		const quoted = msg.message[msg.type]?.contextInfo;
		if (quoted && quoted.quotedMessage) {
			let quotedMsg = {
				type: "normal",
				stanzaId: quoted.stanzaId,
				sender: quoted.participant,
				message: quoted.quotedMessage,
			};

			if (quoted.quotedMessage["ephemeralMessage"]) {
				const type = Object.keys(quoted.quotedMessage.ephemeralMessage.message)[0];
				quotedMsg = {
					type: type === "viewOnceMessageV2" ? "view_once" : "ephemeral",
					stanzaId: quoted.stanzaId,
					sender: quoted.participant,
					message: type === "viewOnceMessageV2" ? quoted.quotedMessage.ephemeralMessage.message.viewOnceMessageV2.message : quoted.quotedMessage.ephemeralMessage.message,
				};
			} else if (quoted.quotedMessage["viewOnceMessageV2"]) {
				quotedMsg = {
					type: "view_once",
					stanzaId: quoted.stanzaId,
					sender: quoted.participant,
					message: quoted.quotedMessage.viewOnceMessageV2.message,
				};
			} else if (quoted.quotedMessage["viewOnceMessageV2Extension"]) {
				quotedMsg = {
					type: "view_once_audio",
					stanzaId: quoted.stanzaId,
					sender: quoted.participant,
					message: quoted.quotedMessage.viewOnceMessageV2Extension.message,
				};
			}

			quotedMsg.isSelf = quotedMsg.sender === conn.user.id;
			quotedMsg.mtype = Object.keys(quotedMsg.message)[0];
			quotedMsg.text = extractMessageBody(quotedMsg);
			quotedMsg.key = {
				id: quotedMsg.stanzaId,
				fromMe: quotedMsg.isSelf,
				remoteJid: msg.from,
			};
			quotedMsg.download = pathFile => downloadMedia(quotedMsg.message, pathFile);

			return quotedMsg;
		}
	} catch (error) {
		logger.error(`Error in extractQuotedMessage: ${error.message}`);
	}
	return null;
}

function extractMessageBody(msg) {
	try {
		return msg.message.conversation || msg.message[msg.type]?.text || msg.message[msg.type]?.caption || (msg.type === "listResponseMessage" && msg.message[msg.type].singleSelectReply.selectedRowId) || (msg.type === "buttonsResponseMessage" && msg.message[msg.type].selectedButtonId) || (msg.type === "templateButtonReplyMessage" && msg.message[msg.type].selectedId) || "";
	} catch (error) {
		logger.error(`Error in extractMessageBody: ${error.message}`);
		return "";
	}
}

async function handleMedia(message, type) {
	try {
		switch (type) {
			case "imageMessage":
			case "videoMessage":
			case "stickerMessage":
			case "documentMessage":
			case "audioMessage":
				return await downloadMedia(message, null);
			case "gifMessage":
				break;
			case "voiceMessage":
				break;
			default:
				throw new Error(`Unsupported media type: ${type}`);
		}
	} catch (error) {
		logger.error(`Error in handleMedia: ${error.message}`);
		throw error;
	}
}

async function downloadMedia(message, pathFile) {
	try {
		let type = Object.keys(message)[0];
		let mes = message;

		if (type === "templateMessage") {
			mes = message.templateMessage.hydratedFourRowTemplate;
			type = Object.keys(mes)[0];
		} else if (type === "interactiveResponseMessage") {
			mes = message.interactiveResponseMessage;
			type = Object.keys(mes)[0];
		} else if (type === "buttonsMessage") {
			mes = message.buttonsMessage;
			type = Object.keys(mes)[0];
		}
		const cacheKey = `${type}_${mes[type].url || uuidv4()}`;
		const cachedMedia = mediaCache.get(cacheKey);
		if (cachedMedia) {
			return cachedMedia;
		}

		const stream = await downloadContentFromMessage(mes[type], mimeMap[type]);
		const buffer = Buffer.concat(await stream.toBuffer());

		if (pathFile) {
			await fs.writeFile(pathFile, buffer);
			mediaCache.set(cacheKey, pathFile);
			return pathFile;
		} else {
			mediaCache.set(cacheKey, buffer);
			return buffer;
		}
	} catch (error) {
		logger.error(`Error in downloadMedia: ${error.message}`);
		throw error;
	}
}

function extendConnFunctions(conn) {
	conn.getFile = async (PATH, returnAsFilename) => {
		try {
			let res, filename;
			let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], "base64") : /^https?:\/\//.test(PATH) ? await (res = await fetch(PATH)).buffer() : fs.existsSync(PATH) ? ((filename = PATH), await fs.readFile(PATH)) : typeof PATH === "string" ? PATH : Buffer.alloc(0);

			if (!Buffer.isBuffer(data)) throw new TypeError("Result is not a buffer");

			let type = (await fromBuffer(data)) || {
				mime: "application/octet-stream",
				ext: ".bin",
			};

			if (data && returnAsFilename && !filename) {
				filename = path.join(__dirname, "../" + new Date() * 1 + "." + type.ext);
				await fs.writeFile(filename, data);
			}

			return {
				res,
				filename,
				...type,
				data,
			};
		} catch (error) {
			logger.error(`Error in getFile: ${error.message}`);
			throw error;
		}
	};

	conn.sendImageAsSticker = async (jid, buff, options = {}) => {
		try {
			let buffer;
			if (options && (options.packname || options.author)) {
				buffer = await writeExifImg(buff, options);
			} else {
				buffer = await imageToWebp(buff);
			}
			await conn.sendMessage(jid, { sticker: { url: buffer }, ...options }, options);
		} catch (error) {
			logger.error(`Error in sendImageAsSticker: ${error.message}`);
			throw error;
		}
	};

	conn.sendVideoAsSticker = async (jid, buff, options = {}) => {
		try {
			let buffer;
			if (options && (options.packname || options.author)) {
				buffer = await writeExifVid(buff, options);
			} else {
				buffer = await videoToWebp(buff);
			}
			await conn.sendMessage(jid, { sticker: { url: buffer }, ...options }, options);
		} catch (error) {
			logger.error(`Error in sendVideoAsSticker: ${error.message}`);
			throw error;
		}
	};
}
async function processMessage(msg, conn) {
	try {
		logger.info(`Processing message: ${msg.id}`);
	} catch (error) {
		logger.error(`Error in processMessage: ${error.message}`);
		throw error;
	}
}

module.exports = { serialize, downloadMedia };
