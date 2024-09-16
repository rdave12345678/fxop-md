const { DataTypes } = require("sequelize");
const config = require("../../config");

const Antilink = config.DATABASE.define("Antilink", {
	groupId: {
		type: DataTypes.STRING,
		allowNull: false,
		unique: true,
	},
	isEnabled: {
		type: DataTypes.BOOLEAN,
		defaultValue: false,
	},
	action: {
		type: DataTypes.ENUM("kick", "warn", "delete", "all"),
		defaultValue: "delete",
	},
	allowedLinks: {
		type: DataTypes.TEXT,
		defaultValue: "",
		get() {
			const rawValue = this.getDataValue("allowedLinks");
			return rawValue ? rawValue.split(",") : [];
		},
		set(val) {
			this.setDataValue("allowedLinks", Array.isArray(val) ? val.join(",") : val);
		},
	},
});

async function getAntilink(groupId) {
	return await Antilink.findOne({ where: { groupId } });
}

async function createAntilink(groupId) {
	return await Antilink.create({ groupId });
}

async function updateAntilink(groupId, data) {
	const antilink = await Antilink.findOne({ where: { groupId } });
	if (!antilink) {
		return null;
	}

	if (data.allowedLinks !== undefined) {
		data.allowedLinks = Array.isArray(data.allowedLinks) ? data.allowedLinks.join(",") : data.allowedLinks;
	}

	return await antilink.update(data);
}

async function deleteAntilink(groupId) {
	return await Antilink.destroy({ where: { groupId } });
}

async function incrementWarn(groupId, userId) {
	const warn = await getOrCreateWarn(groupId, userId);
	warn.warnCount += 1;
	await warn.save();
	return warn;
}

async function resetWarn(groupId, userId) {
	const warn = await getOrCreateWarn(groupId, userId);
	warn.warnCount = 0;
	await warn.save();
	return warn;
}

module.exports = {
	Antilink,
	createAntilink,
	getAntilink,
	updateAntilink,
	deleteAntilink,
	incrementWarn,
	resetWarn,
};
