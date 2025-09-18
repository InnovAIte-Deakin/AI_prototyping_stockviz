const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const searchController = require('../controllers/searchController');

// Get available technical indicators
router.get('/indicators', stockController.getTechnicalIndicators.bind(stockController));

// Main Analysis Route with optional weight parameters
router.get('/analysis/:symbol', stockController.getStockAnalysis.bind(stockController));

// Search Routes
router.get('/search', searchController.searchSymbols.bind(searchController));
router.get('/trending', searchController.getTrendingSymbols.bind(searchController));

// New endpoint to get default weights
router.get('/weights/defaults', stockController.getDefaultWeights.bind(stockController));

module.exports = router;