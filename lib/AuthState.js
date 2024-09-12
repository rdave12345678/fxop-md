const { SESSION_ID } = require("../config");
const { setSession, getSession, delSession } = require("./db/session");
const { proto, initAuthCreds, BufferJSON } = require("baileys");

const AuthState = async () => {
   const saveSession = (data, fileName) => {
      return setSession(JSON.stringify(data, BufferJSON.replacer), fileName, SESSION_ID);
   };

   const readSession = async fileName => {
      try {
         const sessionData = await getSession(fileName, SESSION_ID);
         return JSON.parse(sessionData, BufferJSON.reviver);
      } catch (error) {
         return null;
      }
   };

   const removeSession = async fileName => {
      try {
         await delSession(fileName, SESSION_ID);
      } catch {}
   };

   const creds = (await readSession("creds.json")) || initAuthCreds();

   return {
      state: {
         creds,
         keys: {
            get: async (type, ids) => {
               const data = {};
               await Promise.all(
                  ids.map(async id => {
                     let value = await readSession(`${type}-${id}.json`);
                     if (type === "app-state-sync-key" && value) {
                        value = proto.Message.AppStateSyncKeyData.fromObject(value);
                     }
                     data[id] = value;
                  })
               );
               return data;
            },
            set: async data => {
               const promises = [];
               for (const type in data) {
                  for (const id in data[type]) {
                     const value = data[type][id];
                     const fileName = `${type}-${id}.json`;
                     promises.push(value ? saveSession(value, fileName) : removeSession(fileName));
                  }
               }
               await Promise.all(promises);
            },
         },
      },
      saveCreds: () => {
         return saveSession(creds, "creds.json");
      },
   };
};

module.exports = {
   AuthState,
};
