const config = require("../../config");
const { DataTypes } = require("sequelize");

const sessionDB = config.DATABASE.define("store-session-json", {
   prekey: {
      type: DataTypes.STRING,
      allowNull: false,
   },
   session_id: {
      type: DataTypes.STRING,
      allowNull: false,
   },
   session: {
      type: DataTypes.TEXT,
      allowNull: false,
   },
});

exports.setSession = async (sessionData, prekey, sessionId) => {
   const existingSessions = await sessionDB.findAll({
      where: {
         prekey: prekey,
         session_id: sessionId,
      },
   });

   if (existingSessions.length < 1) {
      await sessionDB.create({
         prekey: prekey,
         session_id: sessionId,
         session: sessionData,
      });
   } else {
      await existingSessions[0].update({
         session: sessionData,
      });
   }
   return true;
};

exports.getSession = async (prekey, sessionId) => {
   const sessions = await sessionDB.findAll({
      where: {
         prekey: prekey,
         session_id: sessionId,
      },
   });

   if (sessions.length < 1) {
      return false;
   } else {
      return sessions[0].dataValues.session;
   }
};

exports.delSession = async (prekey, sessionId) => {
   const sessions = await sessionDB.findAll({
      where: {
         prekey: prekey,
         session_id: sessionId,
      },
   });

   if (sessions.length < 1) {
      return false;
   } else {
      return await sessions[0].destroy();
   }
};
