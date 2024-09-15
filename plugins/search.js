const { Module, mode, getJson, lyrics, sleep } = require("../lib");
const moment = require("moment");
const getFloor = function (number) {
	return Math.floor(number);
};
Module(
	{
		pattern: "fx1",
		fromMe: mode,
		desc: "Fetches the latest forex news",
		type: "search",
	},
	async message => {
		const apiUrl = "https://api.polygon.io/v2/reference/news?apiKey=Y4iTYoJANwppB8I3Bm4QVWdV5oXlvc45";
		const data = await getJson(apiUrl);
		if (!data.results || data.results.length === 0) return message.send("*No forex news available at the moment.*");
		const output = data.results.map((article, index) => `*Title:* ${article.title}\n` + `*Publisher:* ${article.publisher.name}\n` + `*Published UTC:* ${article.published_utc}\n` + `*Article URL:* ${article.article_url}\n` + (index < data.results.length - 1 ? "---\n\n" : "")).join("");

		return message.send(output, { quoted: message });
	},
);

Module(
	{
		pattern: "fxstatus",
		fromMe: mode,
		desc: "Fetches the current status of the forex market",
		type: "search",
	},
	async message => {
		const apiUrl = "https://api.polygon.io/v1/marketstatus/now?apiKey=Y4iTYoJANwppB8I3Bm4QVWdV5oXlvc45";
		const data = await getJson(apiUrl);

		if (!data) return message.send("*Failed to fetch forex market status.*");

		const output = `*Forex Market Status:*\n` + `After Hours: ${data.afterHours ? "Closed" : "Open"}\n` + `Market: ${data.market ? "Open" : "Closed"}\n\n` + `*Currencies:*\n` + `Crypto: ${data.currencies.crypto}\n` + `FX: ${data.currencies.fx}\n\n` + `*Exchanges:*\n` + `NASDAQ: ${data.exchanges.nasdaq}\n` + `NYSE: ${data.exchanges.nyse}\n` + `OTC: ${data.exchanges.otc}\n\n` + `*Indices Groups:*\n` + `S&P: ${data.indicesGroups.s_and_p}\n` + `Societe Generale: ${data.indicesGroups.societe_generale}\n` + `MSCI: ${data.indicesGroups.msci}\n` + `FTSE Russell: ${data.indicesGroups.ftse_russell}\n` + `MStar: ${data.indicesGroups.mstar}\n` + `MStarC: ${data.indicesGroups.mstarc}\n` + `CCCY: ${data.indicesGroups.cccy}\n` + `CGI: ${data.indicesGroups.cgi}\n` + `NASDAQ: ${data.indicesGroups.nasdaq}\n` + `Dow Jones: ${data.indicesGroups.dow_jones}\n\n` + `*Server Time:* ${data.serverTime}`;

		return message.send(output, { quoted: message });
	},
);

Module(
	{
		pattern: "fxpairs",
		fromMe: mode,
		desc: "Fetches a list of active forex currency pairs",
		type: "search",
	},
	async message => {
		const apiUrl = "https://api.polygon.io/v3/reference/tickers?market=fx&active=true&apiKey=Y4iTYoJANwppB8I3Bm4QVWdV5oXlvc45";
		const data = await getJson(apiUrl);
		if (!data || !data.results || data.results.length === 0) return message.send("*Failed to fetch forex currency pairs.*");
		const output = data.results.map(pair => `${pair.ticker}: ${pair.name}`).join("\n");

		return message.send(`*Active Forex Currency Pairs:*\n\n${output}`, { quoted: message });
	},
);

Module(
	{
		pattern: "fxange",
		fromMe: mode,
		desc: "Fetches the latest foreign exchange rates against the US Dollar",
		type: "search",
	},
	async (message, match) => {
		const currencyCode = match || "USD";
		const apiUrl = `https://api.exchangerate-api.com/v4/latest/${currencyCode}`;
		const data = await getJson(apiUrl);

		if (!data || !data.rates) return message.send(`*Failed to fetch exchange rates for ${currencyCode}.*`);
		const output = Object.entries(data.rates)
			.map(([currency, rate]) => `${currency}: ${rate.toFixed(4)}`)
			.join("\n");

		return message.send(`*Foreign Exchange Rates (${data.base})*\n\n${output}`, { quoted: message });
	},
);

Module(
	{
		pattern: "stocks",
		fromMe: mode,
		desc: "Fetches a list of active stock tickers",
		type: "search",
	},
	async (message, match) => {
		const limit = match || 100;
		const apiUrl = `https://api.polygon.io/v3/reference/tickers?active=true&limit=${limit}&apiKey=Y4iTYoJANwppB8I3Bm4QVWdV5oXlvc45`;
		const data = await getJson(apiUrl);
		if (!data || !data.results || data.results.length === 0) return message.send("*No active stock tickers found.*");
		const output = data.results.map(ticker => `${ticker.ticker}: ${ticker.name}`).join("\n");
		return message.send(`*Active Stock Tickers (Limit: ${limit}):*\n\n${output}`, { quoted: message });
	},
);
Module(
	{
		pattern: "weather ?(.*)",
		fromMe: mode,
		desc: "weather info",
		type: "search",
	},
	async (message, match) => {
		if (!match) return await message.send("*Example : weather delhi*");
		const data = await getJson(`http://api.openweathermap.org/data/2.5/weather?q=${match}&units=metric&appid=060a6bcfa19809c2cd4d97a212b19273&language=en`).catch(() => {});
		if (!data) return await message.send(`_${match} not found_`);
		const { name, timezone, sys, main, weather, visibility, wind } = data;
		const degree = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"][getFloor(wind.deg / 22.5 + 0.5) % 16];
		return await message.send(`*Name :* ${name}\n*Country :* ${sys.country}\n*Weather :* ${weather[0].description}\n*Temp :* ${getFloor(main.temp)}°\n*Feels Like :* ${getFloor(main.feels_like)}°\n*Humidity :* ${main.humidity}%\n*Visibility  :* ${visibility}m\n*Wind* : ${wind.speed}m/s ${degree}\n*Sunrise :* ${moment.utc(sys.sunrise, "X").add(timezone, "seconds").format("hh:mm a")}\n*Sunset :* ${moment.utc(sys.sunset, "X").add(timezone, "seconds").format("hh:mm a")}`);
	},
);

Module(
	{
		pattern: "lyrics ?(.*)",
		fromMe: mode,
		desc: "Serach lyrics of Song",
		type: "search",
	},
	async (message, match) => {
		if (!match) return await message.sendReply(`\`\`\`Wrong formart\n\n${message.prefix}lyrics Just the two of Us\`\`\``);
		const msg = await message.reply("_Searching for '" + match + "'_");
		const songLyrics = await lyrics(match);
		await msg.edit("_Lyrics Found!_");
		await sleep(1500);
		return await msg.edit(songLyrics);
	},
);

