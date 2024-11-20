'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Users table
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      twitch_id: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: Sequelize.STRING,
      profile_image_url: Sequelize.STRING,
      last_login: Sequelize.DATE,
      access_token: Sequelize.STRING,
      refresh_token: Sequelize.STRING,
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Streamers table
    await queryInterface.createTable('Streamers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      twitch_id: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false
      },
      profile_image_url: Sequelize.STRING,
      compressed_image_url: Sequelize.STRING,
      followers_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      last_schedule_update: Sequelize.DATE,
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Schedules table
    await queryInterface.createTable('Schedules', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      streamer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Streamers',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      title: Sequelize.STRING,
      category: Sequelize.STRING,
      category_image_url: Sequelize.STRING,
      start_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_recurring: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      status: {
        type: Sequelize.ENUM('scheduled', 'live', 'completed', 'cancelled'),
        defaultValue: 'scheduled'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // UserStreamers table (junction table)
    await queryInterface.createTable('UserStreamers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      streamer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Streamers',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      followed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      is_favorite: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      notifications_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('Users', ['twitch_id']);
    await queryInterface.addIndex('Streamers', ['twitch_id']);
    await queryInterface.addIndex('Streamers', ['username']);
    await queryInterface.addIndex('Streamers', ['is_active']);
    await queryInterface.addIndex('Schedules', ['streamer_id']);
    await queryInterface.addIndex('Schedules', ['start_time']);
    await queryInterface.addIndex('Schedules', ['end_time']);
    await queryInterface.addIndex('Schedules', ['status']);
    await queryInterface.addIndex('UserStreamers', ['user_id']);
    await queryInterface.addIndex('UserStreamers', ['streamer_id']);
    await queryInterface.addIndex('UserStreamers', ['user_id', 'streamer_id'], {
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('UserStreamers');
    await queryInterface.dropTable('Schedules');
    await queryInterface.dropTable('Streamers');
    await queryInterface.dropTable('Users');
  }
};