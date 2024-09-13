const path = require("path");
const config = require("./config");
const { connect, modulesJS, patch } = require("./lib");
const { fetchPlugins } = require("./lib/db/plugins");

async function initialize() {
	try {
		await patch();
		await modulesJS(path.join(__dirname, "/lib/db/"));
		console.log("Syncing Database");
		await config.DATABASE.sync();
		await modulesJS(path.join(__dirname, "/plugins/"));
		await fetchPlugins();
		console.log("Modules Installed");
		return await connect();
	} catch (error) {
		console.error("Initialization error:", error);
		return process.exit(1);
	}
}

initialize();
