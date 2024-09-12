const { SESSION_ID } = require("../config");
const { getData, setData } = require("./states");
const PastebinAPI = require("pastebin-js");

const pastebin = new PastebinAPI("bR1GcMw175fegaIFV2PfignYVtF0b_Bl");

function decodeB64(str) {
   return Buffer.from(str, "base64").toString("utf-8");
}

async function writeSession(sid = SESSION_ID) {
   const sessId = ("" + sid).replace(/Session~/gi, "").trim();

   // Check if session already exists
   const { session } = await getData(sessId);
   if (session && session.status === "true") {
      console.log("\x1b[1m%s\x1b[0m", "Session already connected");
      return;
   }

   let sessionData;

   if (sessId.length > 20) {
      try {
         const decoded = decodeB64(sessId);
         sessionData = JSON.parse(decoded);
      } catch (error) {
         console.error("Error decoding base64 session data:", error);
         return;
      }
   } else {
      try {
         const decodedData = await pastebin.getPaste(sessId);
         sessionData = { "creds.json": decodedData };
      } catch (error) {
         console.error("Error fetching Pastebin data:", error);
         return;
      }
   }

   // Extract and store creds.json
   const credsJson = sessionData["creds.json"];
   if (!credsJson) {
      console.error("creds.json not found in session data");
      return;
   }

   await setData(sessId, typeof credsJson === "string" ? credsJson : JSON.stringify(credsJson), "true", "creds.json");

   // Store other files
   for (const [fileName, fileData] of Object.entries(sessionData)) {
      if (fileName !== "creds.json") {
         const content = typeof fileData === "string" ? fileData : JSON.stringify(fileData);
         await setData(sessId, content, "true", fileName);
      }
   }

   // Mark session as connected
   await setData(sessId, "JARVIS-MD", "true", "session");

   console.log("\x1b[1m%s\x1b[0m", "Session connected");
}

module.exports = { writeSession };
