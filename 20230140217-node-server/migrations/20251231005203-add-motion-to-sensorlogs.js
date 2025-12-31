"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("SensorLogs", "motion", {
      type: Sequelize.BOOLEAN, // Tipe data True/False
      allowNull: true,
      defaultValue: false,
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("SensorLogs", "motion");
  },
};