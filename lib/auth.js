const fs = require("fs").promises;
const path = require("path");
const { SESSION_ID } = require("../config");
const PastebinAPI = require("pastebin-js");
const { exec } = require("child_process");

const sessPath = path.resolve(__dirname, "../session");
const pastebin = new PastebinAPI("bR1GcMw175fegaIFV2PfignYVtF0b_Bl");

async function mkSessDir() {
	await fs.mkdir(sessPath, { recursive: true });
}

function decodeB64(str) {
	return Buffer.from(str, "base64").toString("utf-8");
}

async function wFile(fp, data) {
	await fs.writeFile(fp, data);
}

async function cleanupAndExit() {
	console.error("\x1b[1m%s\x1b[0m", "Invaild Session");
	try {
		await fs.rm(sessPath, { recursive: true, force: true });
		console.log("Session directory deleted.");
	} catch (error) {
		console.error("Error deleting session directory:", error);
	}
	process.exit(1);
}

async function connectSession(sid = SESSION_ID) {
	try {
		await mkSessDir();
		const sessId = ("" + sid).replace(/Session~/gi, "").trim();

		if (sessId.length > 20) {
			const decoded = decodeB64(sessId);
			if (!decoded) {
				throw new Error("Session decoding error");
			}
			const parsed = JSON.parse(decoded);

			if (parsed["creds.json"]) {
				for (const [fname, fdata] of Object.entries(parsed)) {
					const content = typeof fdata === "string" ? fdata : JSON.stringify(fdata, null, 2);
					await wFile(path.join(sessPath, fname), content);
				}
			} else {
				await wFile(path.join(sessPath, "creds.json"), JSON.stringify(parsed, null, 2));
			}
		} else {
			const decodedData = await pastebin.getPaste(sessId);
			if (!decodedData) {
				throw new Error("Invalid session ID");
			}
			await wFile(path.join(sessPath, "creds.json"), decodedData.toString());
		}
	} catch (error) {
		console.error("Error:", error.message);
		await cleanupAndExit();
	}
}

module.exports = { connectSession };
