const { Presensi, User } = require("../models");
const { Op } = require("sequelize");

const { format } = require("date-fns-tz");

// --- LAPORAN HARI INI
exports.getDailyReport = async (req, res) => {
    try {
        const userId = req.user.id;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const presensi = await Presensi.findAll({
            where: {
                userId,
                createdAt: {
                    [Op.between]: [today, tomorrow]
                }
            },
            order: [["createdAt", "DESC"]]
        });

        return res.status(200).json({
            message: "Laporan harian berhasil diambil",
            data: presensi
        });

    } catch (error) {
        console.error("Error getDailyReport:", error);

        return res.status(500).json({
            message: "Terjadi kesalahan pada server",
            error: error.message
        });
    }
};

