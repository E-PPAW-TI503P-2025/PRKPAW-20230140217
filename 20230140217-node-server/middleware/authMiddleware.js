// authMiddleware.js

const jwt = require("jsonwebtoken");
const { User } = require('../models'); // <-- WAJIB: Impor Model User

// Catatan: Fungsi harus bersifat ASYNC karena menggunakan await
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token tidak ditemukan atau format salah" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("❌ JWT_SECRET tidak ditemukan di .env");
      return res.status(500).json({ message: "Server error: JWT Secret hilang" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // BARIS KRITIS BARU: Ambil data user lengkap dari database
    const user = await User.findByPk(decoded.id, {
        // ✅ KOREKSI: Tambahkan 'nama' di sini agar tersedia di req.user
        attributes: ['id', 'email', 'role', 'nama'] 
    });

    if (!user) {
        // Jika user ID ada di token tapi user sudah dihapus di DB
        return res.status(404).json({ message: "Pengguna token tidak ditemukan di database." });
    }

    // Lampirkan objek user LENGKAP ke request
    req.user = user.get({ plain: true }); // Mengonversi objek Sequelize menjadi objek JS biasa
    
    next();
  } catch (error) {
    // Jika token tidak valid, kadaluarsa, atau proses gagal
    return res.status(403).json({ message: "Token tidak valid atau sudah kadaluarsa" });
  }
};

module.exports = { verifyToken };