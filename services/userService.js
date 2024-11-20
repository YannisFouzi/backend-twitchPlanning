const { User, Streamer } = require("../models");
const axios = require("axios");
const jwt = require("jsonwebtoken");

class UserService {
  constructor() {
    this.twitchApiUrl = "https://api.twitch.tv/helix";
    this.twitchAuthUrl = "https://id.twitch.tv/oauth2/token";
  }

  async authenticateWithTwitch(code) {
    try {
      // Échanger le code contre un token
      const tokenResponse = await axios.post(this.twitchAuthUrl, null, {
        params: {
          client_id: process.env.TWITCH_CLIENT_ID,
          client_secret: process.env.TWITCH_CLIENT_SECRET,
          code,
          grant_type: "authorization_code",
          redirect_uri: process.env.CORS_ORIGIN,
        },
      });

      const { access_token, refresh_token } = tokenResponse.data;

      // Récupérer les informations de l'utilisateur
      const userResponse = await axios.get(`${this.twitchApiUrl}/users`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Client-Id": process.env.TWITCH_CLIENT_ID,
        },
      });

      const twitchUser = userResponse.data.data[0];

      // Créer ou mettre à jour l'utilisateur dans notre base
      const [user] = await User.findOrCreate({
        where: { twitch_id: twitchUser.id },
        defaults: {
          username: twitchUser.login,
          email: twitchUser.email,
          profile_image_url: twitchUser.profile_image_url,
        },
      });

      // Mettre à jour les tokens
      await user.update({
        access_token,
        refresh_token,
        last_login: new Date(),
      });

      // Générer un JWT pour notre API
      const jwt_token = jwt.sign(
        { userId: user.id, twitchId: user.twitch_id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return {
        user: {
          id: user.id,
          username: user.username,
          profile_image_url: user.profile_image_url,
        },
        token: jwt_token,
      };
    } catch (error) {
      console.error("Error in authenticateWithTwitch:", error);
      throw error;
    }
  }

  async refreshTwitchToken(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user || !user.refresh_token) {
        throw new Error("No refresh token available");
      }

      const response = await axios.post(this.twitchAuthUrl, null, {
        params: {
          grant_type: "refresh_token",
          refresh_token: user.refresh_token,
          client_id: process.env.TWITCH_CLIENT_ID,
          client_secret: process.env.TWITCH_CLIENT_SECRET,
        },
      });

      const { access_token, refresh_token } = response.data;
      await user.update({ access_token, refresh_token });

      return access_token;
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw error;
    }
  }

  async getUserFollowedStreamers(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [
          {
            model: Streamer,
            through: { attributes: ["is_favorite", "notifications_enabled"] },
          },
        ],
      });

      if (!user) {
        throw new Error("User not found");
      }

      return user.Streamers;
    } catch (error) {
      console.error("Error in getUserFollowedStreamers:", error);
      throw error;
    }
  }
}

module.exports = new UserService();
