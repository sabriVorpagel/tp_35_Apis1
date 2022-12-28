const express = require('express');
const router = express.Router();
const {list, getById, getByName} = require('../../controllers/api/genresControllerApis');

// genres
router
    .get('/', list)
    .get('/:id', getById)
    .get('/:name?', getByName)
    
    

module.exports = router;