const auth = require("./db/auth");

async function setData(jid, message, status, name) {
   try {
      let results = [];
      const existingEntries = await auth.findAll({
         where: {
            jid: jid,
            name: name,
         },
      });

      if (existingEntries && existingEntries.length > 0) {
         for (let entry of existingEntries) {
            entry.message = message;
            entry.status = status;
            await entry.save();
            results.push(entry);
         }
      } else {
         const newEntry = await auth.create({
            jid: jid,
            message: message,
            name: name,
            status: status,
         });
         results.push(newEntry);
      }
      return results;
   } catch (error) {
      console.error("Error occurred while setting message and messageId:", error);
      return false;
   }
}

async function getData(jid) {
   try {
      const entries = await auth.findAll({
         where: {
            jid: jid,
         },
      });

      if (!entries) {
         return null;
      }

      const result = {};
      entries.forEach(entry => {
         result[entry.name] = {
            message: entry.message,
            jid: entry.jid,
            status: entry.status,
         };
      });
      return result;
   } catch (error) {
      console.error("Error occurred while getting greetings by jid:", error);
      return false;
   }
}

module.exports = {
   getData,
   setData,
};
