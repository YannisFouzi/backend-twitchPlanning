const cron = require("node-cron");
const streamerService = require("../services/streamerService");
const imageService = require("../services/imageService");
const { Streamer, Schedule } = require("../models");
const { Op } = require("sequelize");

class ScheduleWorker {
  constructor() {
    // Mise à jour des plannings toutes les 3 minutes
    this.schedulesUpdateJob = cron.schedule("*/3 * * * *", () => {
      this.updateAllSchedules();
    });

    // Nettoyage quotidien à 4h du matin
    this.cleanupJob = cron.schedule("0 4 * * *", () => {
      this.performDailyCleanup();
    });

    // Vérification du statut des streamers une fois par semaine
    this.streamerStatusJob = cron.schedule("0 5 * * 0", () => {
      this.updateStreamerStatuses();
    });
  }

  async updateAllSchedules() {
    try {
      console.log("🔄 Starting scheduled update of all schedules...");

      const activeStreamers = await Streamer.findAll({
        where: { is_active: true },
      });

      const updatePromises = activeStreamers.map(async (streamer) => {
        try {
          await streamerService.updateSchedulesFromTwitch(streamer.id);
          await streamer.update({
            last_schedule_update: new Date(),
          });
        } catch (error) {
          console.error(
            `Error updating schedules for streamer ${streamer.username}:`,
            error
          );
        }
      });

      await Promise.all(updatePromises);
      console.log("✅ Scheduled update completed");
    } catch (error) {
      console.error("❌ Error in scheduled update:", error);
    }
  }

  async performDailyCleanup() {
    try {
      console.log("🧹 Starting daily cleanup...");

      // 1. Nettoyer les vieux plannings
      const maxAge = new Date();
      maxAge.setDate(
        maxAge.getDate() - parseInt(process.env.MAX_SCHEDULE_AGE_DAYS)
      );

      await Schedule.destroy({
        where: {
          end_time: { [Op.lt]: maxAge },
          status: "completed",
        },
      });

      // 2. Nettoyer les images inutilisées
      await imageService.cleanupUnusedImages();

      // 3. Mettre à jour les statuts des streams terminés
      await Schedule.update(
        { status: "completed" },
        {
          where: {
            end_time: { [Op.lt]: new Date() },
            status: { [Op.in]: ["scheduled", "live"] },
          },
        }
      );

      console.log("✅ Daily cleanup completed");
    } catch (error) {
      console.error("❌ Error in daily cleanup:", error);
    }
  }

  async updateStreamerStatuses() {
    try {
      console.log("👥 Starting weekly streamer status update...");
      await streamerService.updateStreamerStatus();
      console.log("✅ Streamer status update completed");
    } catch (error) {
      console.error("❌ Error updating streamer statuses:", error);
    }
  }

  // Méthode pour arrêter proprement les workers
  stopAllJobs() {
    this.schedulesUpdateJob.stop();
    this.cleanupJob.stop();
    this.streamerStatusJob.stop();
    console.log("⏹️ All scheduled jobs stopped");
  }
}

module.exports = new ScheduleWorker();
