const express = require('express');
const router = express.Router();
const { getTopImporters, getApprovedImporters, getImporterSummary, reviewImporter } = require('../controllers/importerController');

router.get('/', getTopImporters);
router.get('/approved', getApprovedImporters);
router.get('/:id/summary', getImporterSummary);
router.post('/:id/review', reviewImporter);

module.exports = router;
