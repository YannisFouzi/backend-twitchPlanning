const express = require("express");
const router = express.Router();
const mainController = require("../controllers/mainController");
const { authenticateUser, isAdmin } = require("../middleware/auth");

// Routes publiques
router.post("/auth/twitch", mainController.authenticateUser);

// Routes protégées (nécessitent une authentification)
router.use(authenticateUser);

// Routes utilisateur
router.get("/users/:userId/schedules", mainController.getSchedules);
router.patch(
  "/users/:userId/preferences",
  mainController.updateUserPreferences
);

// Routes admin
router.post("/admin/cleanup", isAdmin, mainController.triggerCleanup);

module.exports = router;
