const { Presensi } = require("../models");
const { Op } = require("sequelize");
const { zonedTimeToUtc, utcToZonedTime, format } = require("date-fns-tz");

const timeZone = "Asia/Jakarta";
const { validationResult } = require("express-validator");

// 🟢 CHECK-IN
exports.CheckIn = async (req, res) => {
    try {
        const { id: userId, nama: userName } = req.user;
        const waktuSekarang = new Date();

        // Cek apakah user sudah check-in hari ini (belum check-out)
        const existingRecord = await Presensi.findOne({
            where: { userId, checkOut: null }
        });

        if (existingRecord) {
            return res.status(400).json({ message: "Anda sudah melakukan check-in hari ini." });
        }

        const newRecord = await Presensi.create({
            userId,
            nama: userName,
            checkIn: waktuSekarang,
            checkOut: null
        });

        res.status(201).json({
            message: `Halo ${userName}, check-in berhasil pada pukul ${format(waktuSekarang, "HH:mm:ss", { timeZone })} WIB`,
            data: newRecord
        });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan server", error: error.message });
    }
};

// 🔵 CHECK-OUT
exports.CheckOut = async (req, res) => {
    try {
        const { id: userId, nama: userName } = req.user;
        const waktuSekarang = new Date();

        const recordToUpdate = await Presensi.findOne({
            where: { userId, checkOut: null }
        });

        if (!recordToUpdate) {
            return res.status(404).json({ message: "Tidak ada data check-in aktif untuk Anda." });
        }

        recordToUpdate.checkOut = waktuSekarang;
        await recordToUpdate.save();

        res.json({
            message: `Selamat jalan ${userName}, check-out berhasil pada pukul ${format(waktuSekarang, "HH:mm:ss", { timeZone })} WIB`,
            data: recordToUpdate
        });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan server", error: error.message });
    }
};

// 🟣 UPDATE DATA PRESENSI
const { parseISO, isValid } = require("date-fns");

exports.updatePresensi = async (req, res) => {
    try {
        const { id } = req.params;
        const { checkIn, checkOut, nama } = req.body;

        // ✅ Validasi hasil express-validator jika dipakai
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: "Validasi gagal", errors: errors.array() });
        }

        // ✅ Validasi jika body kosong
        if (!checkIn && !checkOut && !nama) {
            return res.status(400).json({ message: "Request body tidak berisi data yang valid untuk diupdate." });
        }

        // ✅ Cari presensi berdasarkan ID
        const presensi = await Presensi.findByPk(id);
        if (!presensi) {
            return res.status(404).json({ message: "Catatan presensi tidak ditemukan." });
        }

        // Fungsi bantu untuk validasi & konversi tanggal
        const parseDate = (value) => {
            if (!value) return null;
            // ganti spasi jadi T jika ada
            const isoValue = value.includes("T") ? value : value.replace(" ", "T");
            const dateObj = parseISO(isoValue);
            return isValid(dateObj) ? dateObj : null;
        };

        // ✅ Update checkIn
        if (checkIn) {
            const dateCheckIn = parseDate(checkIn);
            if (!dateCheckIn) {
                return res.status(400).json({ message: "Format checkIn tidak valid. Gunakan 'YYYY-MM-DD HH:mm:ss' atau ISO 8601." });
            }
            presensi.checkIn = dateCheckIn;
        }

        // ✅ Update checkOut
        if (checkOut) {
            const dateCheckOut = parseDate(checkOut);
            if (!dateCheckOut) {
                return res.status(400).json({ message: "Format checkOut tidak valid. Gunakan 'YYYY-MM-DD HH:mm:ss' atau ISO 8601." });
            }
            presensi.checkOut = dateCheckOut;
        }

        // ✅ Update nama
        if (nama) presensi.nama = nama;

        // ✅ Simpan perubahan ke database
        await presensi.save();

        // ✅ Response sukses
        res.json({ message: "Data presensi berhasil diperbarui.", data: presensi });

    } catch (error) {
        // ✅ Error server
        res.status(500).json({ message: "Terjadi kesalahan server", error: error.message });
    }
};


// 🔴 DELETE PRESENSI
exports.deletePresensi = async (req, res) => {
    try {
        const { id } = req.params;

        const presensi = await Presensi.findByPk(id);
        if (!presensi) {
            return res.status(404).json({ message: "Catatan presensi tidak ditemukan." });
        }

        await presensi.destroy();
        res.status(200).json({ message: "Catatan presensi berhasil dihapus." });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan server", error: error.message });
    }
};

// ✅ GET SEMUA DATA HARI INI / LAPORAN HARIAN (WIB)
exports.getDailyReport = async (req, res) => {
    try {
        const { nama } = req.query;
        let where = {};
        if (nama) {
            where.nama = { [Op.like]: `%${nama}%` };
        }

        const records = await Presensi.findAll({ where });

        // Format checkIn / checkOut ke WIB
        const dataWIB = records.map(r => ({
            id: r.id,
            nama: r.nama,
            checkIn: r.checkIn ? format(utcToZonedTime(r.checkIn, timeZone), 'yyyy-MM-dd HH:mm:ssXXX', { timeZone }) : null,
            checkOut: r.checkOut ? format(utcToZonedTime(r.checkOut, timeZone), 'yyyy-MM-dd HH:mm:ssXXX', { timeZone }) : null
        }));

        res.json({
            reportDate: format(utcToZonedTime(new Date(), timeZone), 'yyyy-MM-dd', { timeZone }),
            data: dataWIB
        });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil laporan", error: error.message });
    }
};

// 🔹 SEARCH BERDASARKAN TANGGAL
exports.searchByTanggal = async (req, res) => {
    try {
        let { tanggal } = req.query;
        if (!tanggal) return res.status(400).json({ message: "Parameter 'tanggal' diperlukan" });

        tanggal = tanggal.replace(' ', 'T');
        const tanggalObj = new Date(tanggal);
        if (isNaN(tanggalObj)) return res.status(400).json({ message: "Tanggal tidak valid" });

        const startOfDay = zonedTimeToUtc(format(utcToZonedTime(tanggalObj, timeZone), 'yyyy-MM-dd') + 'T00:00:00', timeZone);
        const endOfDay = zonedTimeToUtc(format(utcToZonedTime(tanggalObj, timeZone), 'yyyy-MM-dd') + 'T23:59:59', timeZone);

        const presensi = await Presensi.findAll({
            where: {
                checkIn: { [Op.gte]: startOfDay, [Op.lte]: endOfDay }
            }
        });

        const dataWIB = presensi.map(r => ({
            id: r.id,
            nama: r.nama,
            checkIn: r.checkIn ? format(utcToZonedTime(r.checkIn, timeZone), 'yyyy-MM-dd HH:mm:ssXXX', { timeZone }) : null,
            checkOut: r.checkOut ? format(utcToZonedTime(r.checkOut, timeZone), 'yyyy-MM-dd HH:mm:ssXXX', { timeZone }) : null
        }));

        res.json({ data: dataWIB });
    } catch (error) {
        res.status(500).json({ message: "Gagal mencari data presensi", error: error.message });
    }
};

// 🔹 SEARCH BERDASARKAN NAMA
exports.searchByNama = async (req, res) => {
    try {
        const { nama } = req.query;
        if (!nama) return res.status(400).json({ message: "Parameter 'nama' diperlukan" });

        const presensi = await Presensi.findAll({
            where: { nama: { [Op.like]: `%${nama}%` } }
        });

        const dataWIB = presensi.map(r => ({
            id: r.id,
            nama: r.nama,
            checkIn: r.checkIn ? format(utcToZonedTime(r.checkIn, timeZone), 'yyyy-MM-dd HH:mm:ssXXX', { timeZone }) : null,
            checkOut: r.checkOut ? format(utcToZonedTime(r.checkOut, timeZone), 'yyyy-MM-dd HH:mm:ssXXX', { timeZone }) : null
        }));

        res.json({ data: dataWIB });
    } catch (error) {
        res.status(500).json({ message: "Gagal mencari data presensi", error: error.message });
    }
};
