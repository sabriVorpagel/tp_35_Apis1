const express = require('express');
const router = express.Router();
const {list, getById, create, newest, recomended, update, destroy} = require('../../controllers/api/moviesControllerAps');


// movies

router
    .get('/', list)
    .get('/new', newest)
    .get('/recommended', recomended)
    .get('/:id', getById)
    .post('/',create)
    // .put('/:id', update)
    // .delete('/:id', destroy)

module.exports = router;