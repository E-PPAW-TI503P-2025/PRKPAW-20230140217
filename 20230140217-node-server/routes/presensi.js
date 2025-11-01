const express = require("express");
const router = express.Router();
const { body, query, param } = require("express-validator");
const presensiController = require("../controllers/presensiController");
const authMiddleware = require("../middleware/authMiddleware");

// ✅ GET LAPORAN HARI INI / SEMUA DATA PRESENSI
router.get("/", presensiController.getDailyReport);

// ✅ SEARCH BERDASARKAN NAMA
router.get(
    "/by-name",
    [query("nama").notEmpty().withMessage("Parameter 'nama' diperlukan")],
    presensiController.searchByNama
);

// ✅ SEARCH BERDASARKAN TANGGAL
router.get(
    "/by-date",
    [query("tanggal").notEmpty().withMessage("Parameter 'tanggal' diperlukan")],
    presensiController.searchByTanggal
);

// ✅ CHECK-IN (JWT required)
router.post("/check-in", authMiddleware.verifyToken, presensiController.CheckIn);

// ✅ CHECK-OUT (JWT required)
router.post("/check-out", authMiddleware.verifyToken, presensiController.CheckOut);

// ✅ UPDATE PRESENSI
router.put(
    "/:id",
    [
        param("id").isInt().withMessage("Parameter 'id' harus berupa angka"),
        body("checkIn").optional().isISO8601().withMessage("checkIn harus format ISO8601"),
        body("checkOut").optional().isISO8601().withMessage("checkOut harus format ISO8601"),
        body("nama").optional().isString().withMessage("nama harus string")
    ],
    presensiController.updatePresensi
);

// ✅ DELETE PRESENSI
router.delete("/:id", presensiController.deletePresensi);

module.exports = router;
