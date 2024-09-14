const { isJidGroup } = require("baileys");
const config = require("../../config");
const { DataTypes } = require("sequelize");

const chatDb = config.DATABASE.define("Chat", {
	id: {
		type: DataTypes.STRING,
		allowNull: false,
		primaryKey: true,
	},
	conversationTimestamp: {
		type: DataTypes.INTEGER,
		allowNull: false,
	},
	isGroup: {
		type: DataTypes.BOOLEAN,
		allowNull: false,
	},
});

const messageDb = config.DATABASE.define("message", {
	jid: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	message: {
		type: DataTypes.JSON,
		allowNull: false,
	},
	id: {
		type: DataTypes.STRING,
		allowNull: false,
		primaryKey: true,
	},
});

const contactDb = config.DATABASE.define("contact", {
	jid: {
		type: DataTypes.STRING,
		allowNull: false,
	},
	name: {
		type: DataTypes.STRING,
		allowNull: false,
	},
});

const saveContact = async (jid, name) => {
	if (!jid || !name) return;
	if (isJidGroup(jid)) return;
	try {
		const exists = await contactDb.findOne({ where: { jid } });
		if (exists) {
			if (exists.name === name) {
				return;
			}
			return await contactDb.update({ name }, { where: { jid } });
		} else {
			return await contactDb.create({ jid, name });
		}
	} catch (e) {
		console.log("Error in saveContact:", e.message);
	}
};

const saveMessage = async (message, user) => {
	try {
		const jid = message?.key?.remoteJid;
		const id = message?.key?.id;
		const msg = message;
		if (!id || !jid || !msg) return;
		await saveContact(user, message?.pushName);
		let exists = await messageDb.findOne({ where: { id, jid } });
		if (exists) {
			return await messageDb.update({ message: msg }, { where: { id, jid } });
		} else {
			return await messageDb.create({ id, jid, message: msg });
		}
	} catch (e) {
		console.log("Error in saveMessage:", e.message);
	}
};

const loadMessage = async id => {
	if (!id) return;
	try {
		const message = await messageDb.findOne({ where: { id } });
		return message?.dataValues || false;
	} catch (e) {
		console.log("Error in loadMessage:", e.message);
		return false;
	}
};

const saveChat = async chat => {
	if (!chat?.id || chat.id === "status@broadcast" || chat.id === "broadcast" || !chat.conversationTimestamp) return;
	const isGroup = isJidGroup(chat.id);
	try {
		let chatexists = await chatDb.findOne({ where: { id: chat.id } });
		if (chatexists) {
			return await chatDb.update({ conversationTimestamp: chat.conversationTimestamp }, { where: { id: chat.id } });
		} else {
			return await chatDb.create({
				id: chat.id,
				conversationTimestamp: chat.conversationTimestamp,
				isGroup,
			});
		}
	} catch (e) {
		console.log("Error in saveChat:", e.message);
	}
};

const getName = async jid => {
	if (!jid) return "";
	try {
		const contact = await contactDb.findOne({ where: { jid } });
		if (!contact) return jid.split("@")[0].replace(/_/g, " ");
		return contact.name;
	} catch (e) {
		console.log("Error in getName:", e.message);
		return jid?.split("@")[0].replace(/_/g, " ") || "";
	}
};

module.exports = {
	saveMessage,
	loadMessage,
	saveChat,
	getName,
};
