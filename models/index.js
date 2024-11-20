const User = require("./User");
const Streamer = require("./Streamer");
const Schedule = require("./Schedule");
const UserStreamer = require("./UserStreamer");

// Définition des relations
User.belongsToMany(Streamer, {
  through: UserStreamer,
  foreignKey: "user_id",
});

Streamer.belongsToMany(User, {
  through: UserStreamer,
  foreignKey: "streamer_id",
});

Streamer.hasMany(Schedule, {
  foreignKey: "streamer_id",
  onDelete: "CASCADE",
});

Schedule.belongsTo(Streamer, {
  foreignKey: "streamer_id",
});

module.exports = {
  User,
  Streamer,
  Schedule,
  UserStreamer,
};
