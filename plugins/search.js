const { Module, getJson } = require("../lib");

Module(
	{
		pattern: "fx1",
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
