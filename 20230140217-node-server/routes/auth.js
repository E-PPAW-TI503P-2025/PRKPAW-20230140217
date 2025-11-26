// routes/auth.js

const express = require('express');
const router = express.Router();

// KOREKSI JALUR: Menggunakan authController karena nama file di folder controllers adalah authController.js
const authController = require('../controllers/authController'); 

// --- ROUTE AUTENTIKASI ---

// Endpoint: POST /api/auth/register
router.post('/register', authController.register);

// Endpoint: POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;