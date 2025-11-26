const express = require("express");
const router = express.Router();
const { body, query, param } = require("express-validator");
const presensiController = require("../controllers/presensiController");
const { verifyToken } = require("../middleware/authMiddleware");

// --- LAPORAN (HARUS LOGIN)
router.get(
    "/",
    verifyToken,
    presensiController.getDailyReport
);

router.get(
    "/by-name",
    verifyToken,
    query("nama").notEmpty().withMessage("Parameter 'nama' diperlukan"),
    presensiController.searchByNama
);

router.get(
    "/by-date",
    verifyToken,
    query("tanggal").notEmpty().withMessage("Parameter 'tanggal' diperlukan"),
    presensiController.searchByTanggal
);

// --- CHECK-IN & CHECK-OUT
router.post(
    "/check-in",
    verifyToken,
    presensiController.CheckIn
);

router.post(
    "/check-out",
    verifyToken,
    presensiController.CheckOut
);

// --- UPDATE PRESENSI
router.put(
    "/:id",
    verifyToken,
    param("id").isInt().withMessage("Parameter 'id' harus angka"),
    presensiController.updatePresensi
);

// --- DELETE PRESENSI
router.delete(
    "/:id",
    verifyToken,
    presensiController.deletePresensi
);


module.exports = router;
