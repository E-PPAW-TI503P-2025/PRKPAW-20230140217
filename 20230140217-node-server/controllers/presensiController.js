const { Presensi, User } = require("../models");
const { Op } = require("sequelize");
const { format } = require("date-fns-tz");

const timeZone = "Asia/Jakarta";

// =======================
// CHECK-IN (PERBAIKAN: Menambahkan filter tanggal)
// =======================
exports.CheckIn = async (req, res) => {
  try {
    const { id: userId, nama: userName } = req.user;
    const waktuSekarang = new Date();
    const { latitude, longitude } = req.body;

    // Tentukan awal hari ini untuk filter
    const startOfDay = new Date(waktuSekarang);
    startOfDay.setHours(0, 0, 0, 0); 

    const existingRecord = await Presensi.findOne({
      where: { 
          userId, 
          checkOut: null,
          checkIn: { [Op.gte]: startOfDay } // Hanya cek record yang check-in HARI INI
      }
    });

    if (existingRecord) {
      return res.status(400).json({ message: "Anda sudah check-in hari ini." });
    }

    const newRecord = await Presensi.create({
      userId,
      checkIn: waktuSekarang,
      latitude: latitude || null,
      longitude: longitude || null,
    });

    res.status(201).json({
      message: `Halo ${userName}, check-in berhasil pada ${format(
        waktuSekarang,
        "HH:mm:ss",
        { timeZone }
      )} WIB`,
      data: newRecord
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// CHECK-OUT (PERBAIKAN: Menambahkan filter tanggal)
// =======================
exports.CheckOut = async (req, res) => {
  try {
    const { id: userId, nama: userName } = req.user;
    const waktuSekarang = new Date();
    
    // Tentukan awal hari ini untuk filter
    const startOfDay = new Date(waktuSekarang);
    startOfDay.setHours(0, 0, 0, 0);

    const record = await Presensi.findOne({
      where: { 
          userId, 
          checkOut: null,
          checkIn: { [Op.gte]: startOfDay } // Hanya proses record yang check-in HARI INI
      }
    });

    if (!record) {
      return res.status(404).json({
        message: "Tidak ada catatan check-in aktif hari ini."
      });
    }

    record.checkOut = waktuSekarang;
    await record.save();

    res.json({
      message: `Selamat jalan ${userName}, check-out berhasil pada ${format(
        waktuSekarang,
        "HH:mm:ss",
        { timeZone }
      )} WIB`,
      data: record
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// =======================
// GET DAILY REPORT ALL USER (FIXED: Menggunakan [Op.between] yang robust)
// =======================
exports.getDailyReport = async (req, res) => {
  try {
    const today = new Date();
    
    // Tentukan awal hari ini (00:00:00)
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    // Tentukan akhir hari ini (23:59:59.999)
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
   // Di exports.getDailyReport
// Uji coba ini jika error 500 masih muncul
    const data = await Presensi.findAll({
      where: {
        checkIn: {
          // [Op.between] terkadang sensitif terhadap tipe data/timezone.
          // Coba gunakan Op.gte dan Op.lte secara terpisah untuk debugging.
          [Op.gte]: startOfDay, 
          [Op.lte]: endOfDay 
        }
      },
      include: [{ model: User, attributes: ["nama", "email"], as: 'user' }]
    });

    res.json({
      message: "Laporan presensi hari ini",
      data
    });
  } catch (err) {
    console.error("Error fetching daily report:", err); 
    res.status(500).json({ 
        message: "Gagal memuat laporan presensi.", 
        error: err.message 
    });
  }
};

// =======================
// SEARCH BY NAMA
// =======================
exports.searchByNama = async (req, res) => {
  try {
    const { nama } = req.query;

    const data = await Presensi.findAll({
    include: [{
        model: User,
        // TAMBAHKAN as: 'user'
        where: {
        nama: { [Op.like]: `%${nama}%` }
        },
        attributes: ["nama", "email"],
        as: 'user' 
    }]
    });

    res.json({
      message: `Hasil pencarian nama: ${nama}`,
      data
    });
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

    // Di exports.searchByTanggal
// ...
const data = await Presensi.findAll({
  where: {
    checkIn: {
      [Op.gte]: `${tanggal} 00:00:00`,
      [Op.lte]: `${tanggal} 23:59:59`
    }
  },
  // TAMBAHKAN as: 'user'
  include: [{ model: User, attributes: ["nama", "email"], as: 'user' }]
});
// ...

    res.json({
      message: `Presensi pada tanggal ${tanggal}`,
      data
    });
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

    if (!record) {
      return res.status(404).json({ message: "Data presensi tidak ditemukan." });
    }

    record.checkIn = checkIn || record.checkIn;
    record.checkOut = checkOut || record.checkOut;

    await record.save();

    res.json({
      message: "Presensi berhasil diperbarui",
      data: record
    });
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

    if (!record) {
      return res.status(404).json({ message: "Data presensi tidak ditemukan" });
    }

    await record.destroy();

    res.json({ message: "Data presensi berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};