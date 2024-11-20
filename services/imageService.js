const sharp = require("sharp");
const axios = require("axios");
const path = require("path");
const fs = require("fs").promises;

class ImageService {
  constructor() {
    this.imagePath = path.join(__dirname, "../public/images");
    this.ensureImageDirectory();
  }

  async ensureImageDirectory() {
    try {
      await fs.access(this.imagePath);
    } catch {
      await fs.mkdir(this.imagePath, { recursive: true });
    }
  }

  async compressAndUploadImage(imageUrl) {
    try {
      // Télécharger l'image
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
      });
      const buffer = Buffer.from(response.data);

      // Générer un nom de fichier unique
      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}.webp`;
      const outputPath = path.join(this.imagePath, fileName);

      // Compresser l'image
      await sharp(buffer)
        .resize(150, 150) // Redimensionner à une taille raisonnable
        .webp({ quality: 80 }) // Convertir en WebP avec une bonne qualité
        .toFile(outputPath);

      // Retourner l'URL de l'image compressée
      return `/images/${fileName}`;
    } catch (error) {
      console.error("Error in compressAndUploadImage:", error);
      return null;
    }
  }

  async cleanupUnusedImages() {
    try {
      // Obtenir la liste des images référencées dans la base de données
      const streamers = await Streamer.findAll({
        attributes: ["compressed_image_url"],
      });
      const usedImages = new Set(
        streamers
          .map((s) => s.compressed_image_url)
          .filter((url) => url)
          .map((url) => path.basename(url))
      );

      // Lire le répertoire des images
      const files = await fs.readdir(this.imagePath);

      // Supprimer les images non utilisées
      for (const file of files) {
        if (!usedImages.has(file)) {
          await fs.unlink(path.join(this.imagePath, file));
        }
      }
    } catch (error) {
      console.error("Error in cleanupUnusedImages:", error);
    }
  }
}

module.exports = new ImageService();
