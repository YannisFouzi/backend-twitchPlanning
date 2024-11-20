const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Schedule = sequelize.define(
  "Schedule",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    streamer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
    },
    category: {
      type: DataTypes.STRING,
    },
    category_image_url: {
      type: DataTypes.STRING,
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    is_recurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    status: {
      type: DataTypes.ENUM("scheduled", "live", "completed", "cancelled"),
      defaultValue: "scheduled",
    },
  },
  {
    indexes: [
      { fields: ["streamer_id"] },
      { fields: ["start_time"] },
      { fields: ["end_time"] },
      { fields: ["status"] },
    ],
  }
);

module.exports = Schedule;
