// src/routes/cityRoutes.js

const express = require('express');
const router = express.Router();
const cityController = require('../controllers/cityController');

router.get('/', cityController.getCitiesWithTheaters);

module.exports = router;
