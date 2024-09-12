const { SESSION_ID } = require("../config");
const PastebinAPI = require("pastebin-js");
const { exec } = require("child_process");
const { getData, setData } = require("./states");

const pastebin = new PastebinAPI("bR1GcMw175fegaIFV2PfignYVtF0b_Bl");

function decodeB64(str) {
   return Buffer.from(str, "base64").toString("utf-8");
}

async function writeSession(sid = SESSION_ID) {
   const sessId = ("" + sid).replace(/Session~/gi, "").trim();

   const { session } = await getData(sessId);
   if (session && session.status === "true") {
      console.log("\x1b[1m%s\x1b[0m", "Session already connected");
      return;
   }

   let sessionData;

   if (sessId.length > 20) {
      const decoded = decodeB64(sessId);
      if (!decoded) {
         console.error("Session error");
         exec("npm stop");
         return;
      }
      sessionData = JSON.parse(decoded);
   } else {
      try {
         const decodedData = await pastebin.getPaste(sessId);
         sessionData = { "creds.json": decodedData.toString() };
      } catch (error) {
         console.error("Invalid session id");
         exec("npm stop");
         return;
      }
   }
   for (const [fname, fdata] of Object.entries(sessionData)) {
      const content = typeof fdata === "string" ? fdata : JSON.stringify(fdata, null, 2);
      await setData(sessId, content, "true", fname);
   }

   await setData(sessId, "true", "session");

   console.log("\x1b[1m%s\x1b[0m", "Session connected");
}

module.exports = { writeSession };
