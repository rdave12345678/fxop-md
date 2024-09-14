const { FiletypeFromUrl, parseJid, extractUrlFromMessage } = require("./functions");
const { getStatus, getMessage } = require("./db").Greetings;

async function Greetings(data, conn) {
	const metadata = await conn.groupMetadata(data.id);
	const participants = data.participants;

	await Promise.all(
		participants.map(async user => {
			const userpp = await getUserProfilePicture(conn, user);

			switch (data.action) {
				case "add":
					await handleGroupAction(conn, data.id, metadata, user, userpp, "welcome");
					break;

				case "remove":
					await handleGroupAction(conn, data.id, metadata, user, userpp, "goodbye");
					break;

				default:
					console.log(`Unknown action: ${data.action}`);
			}
		}),
	);
}

async function getUserProfilePicture(conn, user) {
	try {
		return await conn.profilePictureUrl(user, "image");
	} catch (error) {
		console.warn(`Failed to get profile picture for ${user}: ${error.message}`);
		return "https://getwallpapers.com/wallpaper/full/3/5/b/530467.jpg";
	}
}

async function handleGroupAction(conn, groupId, metadata, user, userpp, actionType) {
	const status = await getStatus(groupId, actionType);
	if (!status) return;

	const messageData = await getMessage(groupId, actionType);
	let msg = updatedGreetings(messageData.message, user, metadata);

	const url = extractUrlFromMessage(msg);
	if (url) {
		const { type, buffer } = await FiletypeFromUrl(url);

		await sendMediaMessage(conn, groupId, type, buffer, msg, url);
	} else {
		await sendTextMessage(conn, groupId, msg);
	}
}

async function sendMediaMessage(conn, groupId, type, buffer, msg, url) {
	const caption = msg.replace(url, "").trim();
	const mentions = parseJid(msg);
	await conn.sendMessage(groupId, {
		[type]: buffer,
		caption,
		mentions,
	});
}

async function sendTextMessage(conn, groupId, msg) {
	await conn.sendMessage(groupId, {
		text: msg,
		mentions: parseJid(msg),
	});
}

function updatedGreetings(message, user, metadata) {
	return message
		.replace(/@user/gi, `@${user.split("@")[0]}`)
		.replace(/@gname/gi, metadata.subject)
		.replace(/@count/gi, metadata.participants.length);
}

module.exports = { Greetings };
