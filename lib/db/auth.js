const { DataTypes } = require("sequelize");
const config = require("../config");
const auth = config.DATABASE.define(
   "auth",
   {
      jid: {
         type: DataTypes.STRING,
         allowNull: false,
      },
      message: {
         type: DataTypes.JSON,
         allowNull: false,
      },
      name: {
         type: DataTypes.STRING,
         allowNull: false,
      },
      status: {
         type: DataTypes.STRING,
         allowNull: false,
      },
   },
   {
      uniqueKeys: {
         unique_jid_message_status: {
            fields: ["jid", "name"],
         },
      },
   }
);
module.exports = auth;
