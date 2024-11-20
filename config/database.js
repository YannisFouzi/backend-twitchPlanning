const { Sequelize } = require("sequelize");
require("dotenv").config();

let sequelize;

if (process.env.NODE_ENV === "production") {
  // En production, utilise l'URL de la base de données fournie par Railway
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
} else {
  // En développement, utilise les variables d'environnement locales
  sequelize = new Sequelize({
    dialect: "postgres",
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  });
}

// Tester la connexion
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connection to database has been established successfully.");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
    process.exit(1);
  }
};

// Fonction de synchronisation de la base de données
const syncDatabase = async () => {
  try {
    if (process.env.NODE_ENV !== "production") {
      await sequelize.sync({ alter: true });
      console.log("✅ Database synchronized successfully");
    } else {
      console.log(
        "⚠️ Database sync disabled in production. Use migrations instead."
      );
    }
  } catch (error) {
    console.error("❌ Error synchronizing database:", error);
    process.exit(1);
  }
};

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
};
