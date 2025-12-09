const express = require("express");
const router = express.Router();
const { body, query, param } = require("express-validator");
const presensiController = require("../controllers/presensiController");
const { verifyToken } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

// --------------------------
// Konfigurasi Multer untuk upload foto
// --------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // folder tempat menyimpan foto
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `selfie_${req.user.id}_${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// --------------------------
// LAPORAN PRESENSI (HARUS LOGIN)
// --------------------------
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

// --------------------------
// CHECK-IN
// --------------------------
router.post(
  "/check-in",
  verifyToken,
  upload.single("image"), // <- wajib pakai multer sebelum controller
  presensiController.CheckIn
);

// --------------------------
// CHECK-OUT
// --------------------------
router.post(
  "/check-out",
  verifyToken,
  presensiController.CheckOut
);

// --------------------------
// UPDATE PRESENSI
// --------------------------
router.put(
  "/:id",
  verifyToken,
  param("id").isInt().withMessage("Parameter 'id' harus angka"),
  presensiController.updatePresensi
);

// --------------------------
// DELETE PRESENSI
// --------------------------
router.delete(
  "/:id",
  verifyToken,
  presensiController.deletePresensi
);

module.exports = router;
