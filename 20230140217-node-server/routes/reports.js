const express = require('express');
const router = express.Router();

// 1. IMPORT MIDDLEWARE (gunakan verifyToken yang Async dan sudah diperbaiki)
const { verifyToken } = require('../middleware/authMiddleware');
// Hapus: const { verifyJWT, isAdmin } = require('../middleware/permissionMiddleware');

// 2. IMPORT CONTROLLER (pastikan path benar)
// Kami mengimpor fungsi 'getDailyReport' dari reportController yang menggunakan Raw SQL
const { getDailyReport } = require('../controllers/reportController');

// 3. DEFINISI ROUTE

// Route Laporan Harian
if (typeof getDailyReport === 'function' && typeof verifyToken === 'function') {
    // ✅ Menggunakan verifyToken yang sudah dijamin mengambil 'nama'
    router.get('/daily', verifyToken, getDailyReport);
} else {
    console.error("KRITIS: Handler /reports/daily tidak ditemukan atau bukan fungsi.");
}

module.exports = router;