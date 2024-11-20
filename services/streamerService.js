const { Streamer, Schedule } = require("../models");
const imageService = require("./imageService");
const { Op } = require("sequelize");
const axios = require("axios");

class StreamerService {
  constructor() {
    this.twitchConfig = {
      headers: {
        "Client-Id": process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${process.env.TWITCH_APP_TOKEN}`,
      },
    };
  }

  async getOrCreateStreamer(twitchData) {
    try {
      let streamer = await Streamer.findOne({
        where: { twitch_id: twitchData.broadcaster_id },
      });

      if (!streamer) {
        // Compression de l'image de profil
        const compressedImageUrl = await imageService.compressAndUploadImage(
          twitchData.profile_image_url
        );

        streamer = await Streamer.create({
          twitch_id: twitchData.broadcaster_id,
          username: twitchData.broadcaster_name,
          profile_image_url: twitchData.profile_image_url,
          compressed_image_url: compressedImageUrl,
          is_active: true,
        });
      }

      return streamer;
    } catch (error) {
      console.error("Error in getOrCreateStreamer:", error);
      throw error;
    }
  }

  async updateSchedules(streamerId, scheduleData) {
    try {
      // Marquer les anciens plannings comme "completed"
      await Schedule.update(
        { status: "completed" },
        {
          where: {
            streamer_id: streamerId,
            end_time: { [Op.lt]: new Date() },
            status: "scheduled",
          },
        }
      );

      // Créer ou mettre à jour les nouveaux plannings
      const schedulePromises = scheduleData.map(async (segment) => {
        const schedule = {
          streamer_id: streamerId,
          title: segment.title,
          category: segment.category,
          category_image_url: segment.box_art_url,
          start_time: new Date(segment.start_time),
          end_time: new Date(segment.end_time),
          is_recurring: segment.is_recurring || false,
          status: "scheduled",
        };

        return Schedule.upsert(schedule, {
          where: {
            streamer_id: streamerId,
            start_time: schedule.start_time,
          },
        });
      });

      await Promise.all(schedulePromises);

      // Nettoyer les vieux plannings
      await this.cleanupOldSchedules(streamerId);
    } catch (error) {
      console.error("Error in updateSchedules:", error);
      throw error;
    }
  }

  async cleanupOldSchedules(streamerId) {
    const maxAge = new Date();
    maxAge.setDate(
      maxAge.getDate() - parseInt(process.env.MAX_SCHEDULE_AGE_DAYS)
    );

    try {
      await Schedule.destroy({
        where: {
          streamer_id: streamerId,
          end_time: { [Op.lt]: maxAge },
          status: "completed",
        },
      });
    } catch (error) {
      console.error("Error in cleanupOldSchedules:", error);
      throw error;
    }
  }

  async updateStreamerStatus() {
    try {
      const streamers = await Streamer.findAll();

      for (const streamer of streamers) {
        const hasFollowers = await streamer.countUsers();

        if (hasFollowers === 0) {
          await streamer.update({ is_active: false });
          // Optionnel : supprimer les plannings des streamers inactifs
          await Schedule.destroy({
            where: { streamer_id: streamer.id },
          });
        }
      }
    } catch (error) {
      console.error("Error in updateStreamerStatus:", error);
      throw error;
    }
  }

  async getActiveStreamersSchedules(userId, startDate, endDate) {
    try {
      return await Schedule.findAll({
        include: [
          {
            model: Streamer,
            where: { is_active: true },
            include: [
              {
                model: User,
                where: { id: userId },
                through: { attributes: [] },
              },
            ],
          },
        ],
        where: {
          start_time: { [Op.between]: [startDate, endDate] },
          status: { [Op.in]: ["scheduled", "live"] },
        },
        order: [["start_time", "ASC"]],
      });
    } catch (error) {
      console.error("Error in getActiveStreamersSchedules:", error);
      throw error;
    }
  }
}

module.exports = new StreamerService();
