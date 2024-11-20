const streamerService = require("../services/streamerService");
const userService = require("../services/userService");
const { Op } = require("sequelize");
const { User, Streamer, Schedule, UserStreamer } = require("../models");

class MainController {
  // Authentification et gestion utilisateur
  async authenticateUser(req, res) {
    try {
      const { code } = req.body;
      const userData = await userService.authenticateWithTwitch(code);

      if (!userData) {
        return res.status(401).json({ error: "Authentication failed" });
      }

      return res.json(userData);
    } catch (error) {
      console.error("Authentication error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Récupération des plannings
  async getSchedules(req, res) {
    try {
      const { userId } = req.params;
      const { startDate, endDate } = req.query;

      // Convertir les dates
      const start = new Date(parseInt(startDate));
      const end = new Date(parseInt(endDate));

      // Vérifier si une mise à jour est nécessaire
      await this.checkAndUpdateSchedules(userId);

      // Récupérer les plannings
      const schedules = await streamerService.getActiveStreamersSchedules(
        userId,
        start,
        end
      );

      return res.json(schedules);
    } catch (error) {
      console.error("Error fetching schedules:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Mise à jour des plannings si nécessaire
  async checkAndUpdateSchedules(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [
          {
            model: Streamer,
            where: { is_active: true },
            through: UserStreamer,
          },
        ],
      });

      if (!user) {
        throw new Error("User not found");
      }

      const updatePromises = user.Streamers.map(async (streamer) => {
        const needsUpdate = await this.needsScheduleUpdate(streamer);
        if (needsUpdate) {
          await streamerService.updateSchedulesFromTwitch(streamer.id);
        }
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error in checkAndUpdateSchedules:", error);
      throw error;
    }
  }

  // Vérifie si les plannings d'un streamer doivent être mis à jour
  async needsScheduleUpdate(streamer) {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    return (
      !streamer.last_schedule_update ||
      streamer.last_schedule_update < threeMinutesAgo
    );
  }

  // Gestion des préférences utilisateur
  async updateUserPreferences(req, res) {
    try {
      const { userId } = req.params;
      const { streamerId, notifications, favorite } = req.body;

      await UserStreamer.update(
        {
          notifications_enabled: notifications,
          is_favorite: favorite,
        },
        {
          where: {
            user_id: userId,
            streamer_id: streamerId,
          },
        }
      );

      return res.json({ success: true });
    } catch (error) {
      console.error("Error updating preferences:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  // Endpoint de nettoyage manuel (protégé par auth admin)
  async triggerCleanup(req, res) {
    try {
      // Vérifier l'authentification admin
      if (!req.isAdmin) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      // Nettoyer les vieux plannings
      await Schedule.destroy({
        where: {
          end_time: {
            [Op.lt]: new Date(
              Date.now() -
                process.env.MAX_SCHEDULE_AGE_DAYS * 24 * 60 * 60 * 1000
            ),
          },
          status: "completed",
        },
      });

      // Mettre à jour le statut des streamers
      await streamerService.updateStreamerStatus();

      return res.json({ success: true });
    } catch (error) {
      console.error("Error in cleanup:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = new MainController();
