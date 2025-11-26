// middleware/permissionMiddleware.js

const jwt = require('jsonwebtoken');

// Pastikan JWT_SECRET didefinisikan di file .env Anda dan diakses di sini
const JWT_SECRET = process.env.JWT_SECRET; 

// --- 1. MIDDLEWARE OTENTIKASI (Memverifikasi Token) ---
exports.verifyJWT = (req, res, next) => {
  // 1. Ambil token dari header Authorization
  const authHeader = req.headers['authorization'];
  // Token diharapkan berbentuk: Bearer <token>
  const token = authHeader && authHeader.split(' ')[1]; 

  if (token == null) {
    // 401: Unauthorized (Tidak Terotentikasi)
    return res.status(401).json({ message: 'Akses ditolak: Token tidak ditemukan' });
  }

  // 2. Verifikasi Token
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token Invalid/Expired:', err.message);
      // 403: Forbidden (Token Invalid)
      return res.status(403).json({ message: 'Akses ditolak: Token tidak valid atau kedaluwarsa' });
    }

    // 3. Tambahkan data user (payload) ke req.user
    req.user = user; 
    next(); 
  });
};


// --- 2. MIDDLEWARE OTORISASI (Memeriksa Role) ---
// Fungsi ini memastikan bahwa pengguna yang terotentikasi adalah 'admin'.
// permissionMiddleware.js (Contoh isAdmin)

exports.isAdmin = (req, res, next) => {
    // Pastikan req.user telah ditambahkan oleh verifyJWT
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ 
            message: "Akses ditolak. Hanya Admin yang dapat melihat laporan." 
        });
    }
    next();
};