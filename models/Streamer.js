const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Streamer = sequelize.define(
  "Streamer",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    twitch_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    profile_image_url: {
      type: DataTypes.STRING,
    },
    compressed_image_url: {
      type: DataTypes.STRING,
      comment: "URL de l'image compressée stockée",
    },
    followers_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    last_schedule_update: {
      type: DataTypes.DATE,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    indexes: [
      { fields: ["twitch_id"] },
      { fields: ["username"] },
      { fields: ["is_active"] },
    ],
  }
);

module.exports = Streamer;
