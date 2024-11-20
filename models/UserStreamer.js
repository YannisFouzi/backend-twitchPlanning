const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const UserStreamer = sequelize.define(
  "UserStreamer",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    streamer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    followed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    is_favorite: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    notifications_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    indexes: [
      { fields: ["user_id"] },
      { fields: ["streamer_id"] },
      { unique: true, fields: ["user_id", "streamer_id"] },
    ],
  }
);

module.exports = UserStreamer;
