const { SensorLog } = require("../models");

exports.receiveSensorData = async (req, res) => {
  try {
    const { suhu, kelembaban, cahaya, motion } = req.body;

    const newData = await SensorLog.create({
      suhu: parseFloat(suhu),
      kelembaban: parseFloat(kelembaban),
      cahaya: parseInt(cahaya),
      motion: motion === true || motion === "true" || motion === 1,
    });

    console.log(
      `[SAVED] S:${suhu}°C | L:${kelembaban}% | C:${cahaya} | M:${newData.motion}`
    );

    res.status(201).json({ status: "ok", data: newData });
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};

exports.testConnection = (req, res) => {
  const { message, deviceId } = req.body;
  console.log(`📡 [IOT] Pesan dari ${deviceId}: ${message}`);
  res.status(200).json({ status: "ok", reply: "Server menerima koneksi!" });
};

exports.getSensorHistory = async (req, res) => {
  try {
    const data = await SensorLog.findAll({
      limit: 50,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      status: "success",
      data: data.reverse(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
