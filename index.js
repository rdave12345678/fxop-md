const express = require("express");
const path = require("path");
const config = require("./config");
const { connect, modulesJS, patch } = require("./lib");
const { fetchPlugins } = require("./lib/db/plugins");

const app = express();
const PORT = 8000;

async function initialize() {
	try {
		await patch();
		await modulesJS(path.join(__dirname, "/lib/db/"));
		await config.DATABASE.sync();
		await modulesJS(path.join(__dirname, "/plugins/"));
		await fetchPlugins();
		console.log("Modules Installed");
		await connect();
	} catch (error) {
		console.error("Initialization error:", error);
		process.exit(1);
	}
}

initialize();

app.listen(PORT);
