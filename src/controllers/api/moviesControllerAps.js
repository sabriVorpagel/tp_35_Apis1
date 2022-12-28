const path = require('path');
const db = require("../../database/models");
const sequelize = db.sequelize;
const { Op } = require("sequelize");
const moment = require('moment');
const {createError,url, urlBase }= require('../../helpers');

//Aqui tienen otra forma de llamar a cada uno de los modelos
const Movies = db.Movie;
const Genres = db.Genre;
const Actors = db.Actor;


const moviesController = {
    list: async (req, res) => {
        const {limit, order , search, offset} = req.query;
        let fields = ['title','rating' ,'release_date', 'awards', 'length'];
        try {
            if(order && !fields.includes(order)){  
                throw createError(400,`Solo se orderna por los campos ${fields.join(', ')}`);
            };
            
            let total = await db.Movie.count() 
            let movies = await db.Movie.findAll({
                attributes: {
                    exclude: ['created_at', 'updated_at']
                },
                include : [
                    {
                        association: 'genre', 
                        attributes : {
                            exclude : ['created_at', 'updated_at']
                        }
                    },
                    {
                        association: 'actors',
                        attributes : {
                            exclude : ['created_at', 'updated_at']
                        },
                    },
                ],
                limit : limit? +limit : 5,
                offset: offset? +offset :0,   
                order : [order? order : 'id']
            });
            movies.forEach(movie => {
                movie.setDataValue('link',`${url(req)}/${movie.id}`) 
            });
            return res.status(200).json({
                ok: true,
                meta: {
                    status: 200
                },
                data: {
                    items : movies.length,
                    total,
                    movies  
                }
            })
        } catch (error) {
            console.log(error)
            return res.status(error.status || 500).json({  
                status : error.status || 500,
                msg: error.message
            });
        }
    },
    getById: async (req, res) => {
        const {id} = req.params;
        try {
            if(isNaN(id)){
                throw createError(400,'El ID debe ser un número') 
            };
            
            const movie = await db.Movie.findByPk(req.params.id,
                {
                    include : [
                        {
                            association : 'genre',
                            attributes : {
                                exclude : ['created_at', 'update_at' ]
                            }
                        },
                        {
                            association: 'actors',
                            attributes : {
                                exclude : ['created_at', 'updated_at']
                            },
                        },
                    ],
                    attributes : {
                        exclude : ['created_at', 'updated_at', 'genre_id']
                    }
                });
            if(!movie){
                throw createError(404,'No existe una película con ese ID') 
            };
            movie.release_date = moment(movie.release_date).format('DD-MM-YYYY'); 
            return res.status(200).json({
                ok: true,
                meta: {
                    status : 200
                },
                data: {
                    movie, 
                }
            });
        
        } catch (error) {
            console.log(error)
            return res.status(error.status || 500).json({
                ok: false,
                status : error.status || 500,
                msg: error.message,
            })
        }
    },
    newest : async (req,res) =>{
        const {limit} = req.query;
        const options = {
            include : [
                {
                    association: 'genre', 
                    attributes : {
                        exclude : ['created_at', 'updated_at']
                    }
                },
                {
                    association: 'actors',
                    attributes : {
                        exclude : ['created_at', 'updated_at']
                    },
                },
            ],
            attributes : {
                exclude : ['created_at', 'updated_at', 'genre_id']
            },
            limit : limit? +limit :5,
            order : ['release_date']
        };
        
        try {
            const movies = await db.Movie.findAll(options);
            const moviesModify =  movies.map(movie => {
                return {
                    ...movie.dataValues,
                    link : `${urlBase(req)}/${movie.id}`
                }
            })
            return res.status(200).json({
                ok: true,
                meta:{
                    status : 200
                },
                data : {
                    movies : moviesModify
                }
            })
        
        } catch (error) {
            console.log(error)
            return res.status(error.status || 500).json({
                ok: false,
                status : error.status || 500,
                msg: error.message,
            })
        }
    },
    recomended: async (req, res) => {
        const { limit } = req.query;
        try {
            let total = await db.Movie.count();
            const movies = await db.Movie.findAll({
                include: [
                    {
                        association: "genre",
                        attributes: {
                            exclude: ["created_at", "updated_at"]
                        },
                    }
                ],
                attributes: {
                    exclude: ['created_at', 'updated_at', 'genre_id']
                },
                where: {
                    rating: { [db.Sequelize.Op.gte]: 8 }
                },
                order: [
                    ['rating', 'DESC']
                ],
                limit: limit ? +limit : 5,
            })
            movies.forEach(movie => {
                movie.release_date = moment(movie.release_date).format()
            });
            const moviesModify = movies.map(movie => {
                return {
                    ...movie.dataValues,
                    link: `${urlBase(req)}/movies/${movie.id}`
                }
            })
            return res.status(200).json({
                ok: true,
                meta: {
                    status: 200
                },
                data: {
                    items: moviesModify.length,
                    total,
                    movies: moviesModify
                }
            })
        } catch (error) {
            console.log(error)
            return res.status(error.status || 500).json({
                ok: false,
                status: error.status || 500,
                msg: error.message,
            })
        }
    },
    create: async (req,res) => {
        const {title, rating, awards, release_date, length, genre_id} = req.body; 
        let errors = []
        try {
            for (const key in req.body) {     
                if(!req.body[key]){
                errors = [
                    ...errors,
                    {
                        fields : key,
                        msg : `El campo ${key} es obligatorio`
                    }
                ]
                }
            };
            if(errors.length){
                throw createError(400, 'Ups, hay errores')
            }
            const newMovie = await db.Movie.create(
                {
                    title: title.trim(),
                    rating,
                    awards,
                    release_date,
                    length,
                    genre_id
                });
                return res.status(201).json({
                    ok: true,
                    meta:{
                        status : 201
                    },
                    data : {
                        newMovie
                    }
                })
                if (newMovie) {
                    return res.status(200).json({
                        ok: true,
                        meta : {
                            total: 1,
                            link: `${req.protocol}://${req.get('host')}/movies/${newMovie.id}`  
                        },
                        data: newMovie
                    });
                }
        } catch (error){  
            const showErrors = error.errors.map(error => {
                return {
                    path : error.path,
                    message: error.message
                }
            })
            return res.status(showErrors)
        } 
    },
    update: function (req,res) {
        let movieId = req.params.id;
        Movies
        .update(
            {
                title: req.body.title,
                rating: req.body.rating,
                awards: req.body.awards,
                release_date: req.body.release_date,
                length: req.body.length,
                genre_id: req.body.genre_id
            },
            {
                where: {id: movieId}
            })
        .then(()=> {
            return res.redirect('/movies')})            
        .catch(error => res.send(error))
    },
    destroy: function (req,res) {
        let movieId = req.params.id;
        Movies
        .destroy({where: {id: movieId}, force: true}) 
        .then(()=>{
            return res.redirect('/movies')})
        .catch(error => res.send(error)) 
    }
}

module.exports = moviesController;