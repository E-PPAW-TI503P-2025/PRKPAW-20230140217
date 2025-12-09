const { Presensi, User } = require("../models");
const { Op } = require("sequelize");
const { format } = require("date-fns-tz");
const multer = require("multer");
const path = require("path");

const timeZone = "Asia/Jakarta";

// =======================
// Multer setup untuk upload foto
// =======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // folder uploads harus sudah ada
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Hanya file gambar yang diperbolehkan!"), false);
};

exports.upload = multer({ storage, fileFilter });

// =======================
// CHECK-IN
// =======================
exports.CheckIn = async (req, res) => {
  try {
    const { id: userId, nama: userName } = req.user;
    const waktuSekarang = new Date();
    const { latitude, longitude } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Foto wajib diambil sebelum check-in!" });
    }

    const buktiFoto = req.file.filename; // Hanya filename

    const startOfDay = new Date(waktuSekarang);
    startOfDay.setHours(0, 0, 0, 0);

    const existingRecord = await Presensi.findOne({
      where: {
        userId,
        checkOut: null,
        checkIn: { [Op.gte]: startOfDay },
      },
    });

    if (existingRecord) {
      return res.status(400).json({ message: "Anda sudah check-in hari ini." });
    }

    const newRecord = await Presensi.create({
      userId,
      checkIn: waktuSekarang,
      latitude: latitude || null,
      longitude: longitude || null,
      buktiFoto, // simpan hanya filename
    });

    res.status(201).json({
      message: `Halo ${userName}, check-in berhasil pada ${format(
        waktuSekarang,
        "HH:mm:ss",
        { timeZone }
      )} WIB`,
      data: newRecord,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


// =======================
// CHECK-OUT
// =======================
exports.CheckOut = async (req, res) => {
  try {
    const { id: userId, nama: userName } = req.user;
    const waktuSekarang = new Date();

    const startOfDay = new Date(waktuSekarang);
    startOfDay.setHours(0, 0, 0, 0);

    const record = await Presensi.findOne({
      where: {
        userId,
        checkOut: null,
        checkIn: { [Op.gte]: startOfDay },
      },
    });

    if (!record) {
      return res.status(404).json({ message: "Tidak ada catatan check-in aktif hari ini." });
    }

    record.checkOut = waktuSekarang;
    await record.save();

    res.json({
      message: `Selamat jalan ${userName}, check-out berhasil pada ${format(
        waktuSekarang,
        "HH:mm:ss",
        { timeZone }
      )} WIB`,
      data: record,
    });
  } catch (error) {
    console.error("Check-out error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// GET DAILY REPORT
// =======================
exports.getDailyReport = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const data = await Presensi.findAll({
      where: {
        checkIn: { [Op.gte]: startOfDay, [Op.lte]: endOfDay },
      },
      include: [{ model: User, attributes: ["nama", "email"], as: "user" }],
    });

    res.json({ message: "Laporan presensi hari ini", data });
  } catch (err) {
    console.error("Error fetching daily report:", err);
    res.status(500).json({ message: "Gagal memuat laporan presensi.", error: err.message });
  }
};

// =======================
// SEARCH BY NAMA
// =======================
exports.searchByNama = async (req, res) => {
  try {
    const { nama } = req.query;

    const data = await Presensi.findAll({
      include: [
        {
          model: User,
          where: { nama: { [Op.like]: `%${nama}%` } },
          attributes: ["nama", "email"],
          as: "user",
        },
      ],
    });

    res.json({ message: `Hasil pencarian nama: ${nama}`, data });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// =======================
// SEARCH BY DATE
// =======================
exports.searchByTanggal = async (req, res) => {
  try {
    const { tanggal } = req.query;

    const data = await Presensi.findAll({
      where: {
        checkIn: { [Op.gte]: `${tanggal} 00:00:00`, [Op.lte]: `${tanggal} 23:59:59` },
      },
      include: [{ model: User, attributes: ["nama", "email"], as: "user" }],
    });

    res.json({ message: `Presensi pada tanggal ${tanggal}`, data });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// =======================
// UPDATE PRESENSI
// =======================
exports.updatePresensi = async (req, res) => {
  try {
    const presensiId = req.params.id;
    const { checkIn, checkOut } = req.body;

    const record = await Presensi.findByPk(presensiId);

    if (!record) return res.status(404).json({ message: "Data presensi tidak ditemukan." });

    record.checkIn = checkIn || record.checkIn;
    record.checkOut = checkOut || record.checkOut;

    await record.save();

    res.json({ message: "Presensi berhasil diperbarui", data: record });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// =======================
// DELETE PRESENSI
// =======================
exports.deletePresensi = async (req, res) => {
  try {
    const presensiId = req.params.id;

    const record = await Presensi.findByPk(presensiId);

    if (!record) return res.status(404).json({ message: "Data presensi tidak ditemukan" });

    await record.destroy();

    res.json({ message: "Data presensi berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
