const axios = require('axios').default
const path = require("path");
const db = require("../database/models");
const sequelize = db.sequelize;
const { Op } = require("sequelize");
const moment = require('moment');
const { response } = require('express');

//Aqui tienen una forma de llamar a cada uno de los modelos
// const {Movies,Genres,Actor} = require('../database/models');

//Aquí tienen otra forma de llamar a los modelos creados
const Movies = db.Movie;
const Genres = db.Genre;
const Actors = db.Actor;

const URL_BASE = 'http://www.omdbapi.com/?apikey=1a4e2d32';

const moviesController = {
    list: (req, res) => {
        db.Movie.findAll({
            include: ['genre']
        })
            .then((movies) => {
                res.render("moviesList.ejs", { movies });
            });
    },
    detail: (req, res) => {
        db.Movie.findByPk(req.params.id).then((movie) => {
            return res.render("moviesDetail.ejs", { ...movie.dataValues, moment });
        });
    },
    new: (req, res) => {
        db.Movie.findAll({
            order: [["release_date", "DESC"]],
            limit: 5,
        }).then((movies) => {
            res.render("newestMovies", { movies });
        });
    },
    recomended: (req, res) => {
        db.Movie.findAll({
            where: {
                rating: { [db.Sequelize.Op.gte]: 8 },
            },
            order: [["rating", "DESC"]],
        }).then((movies) => {
            res.render("recommendedMovies.ejs", { movies });
        });
    },
    //Aqui dispongo las rutas para trabajar con el CRUD
    add: function (req, res) {
        db.Genre.findAll({
            order: ["name"],
        })
            .then((genres) => {
                return res.render("moviesAdd", {
                    genres
                });
            })
            .catch((error) => console.log(error));
    },
    create: (req, res) => {
        const { title, rating, awards, release_date, length, genre_id } = req.body
        db.Movie.create({
            title: title.trim(),
            rating,
            awards,
            release_date,
            length,
            genre_id,
            image: req.file ? req.file.filename : null
        })
            .then(movie => {
                return res.redirect('/movies')
            })
            .catch(error => console.log(error))
    },
    edit: (req, res) => {
        const genres = db.Genre.findAll({
            order: ["name"],
        })
        const movie = db.Movie.findByPk(req.params.id, {
            include: ['actors']
        })

        const actors = db.Actor.findAll({
            order: [['first_name', 'ASC'], ['last_name', 'ASC']]
        })

        Promise.all([genres, movie, actors])
            .then(([genres, movie, actors]) => {
                return res.render("moviesEdit", {
                    allGenres: genres,
                    Movie: movie,
                    actors,
                    moment
                });
            })
            .catch((error) => console.log(error));
    },
    update: (req, res) => {

        let {title, awards, rating, length, release_date, genre_id, actors} =  req.body;

        actors = typeof actors === 'string' ? [actors] : actors;

            db.Movie.update({
                title: title.trim(),
                awards,
                rating,
                length,
                release_date,
                genre_id,
            },{
                where: {
                    id:req.params.id
                }
            })
            .then(() => {
                db.Actor_Movie.destroy({
                    where: {
                        movie_id: req.params.id
                    }
                })
                .then(() => {
                    if(actors){
                    const actorsDB = actors.map(actor => {
                        return {
                            movie_id: req.params.id,
                            actor_id: actor
                        }
                    })
                    db.Actor_Movie.bulkCreate(actorsDB, {
                        validate: true
                    }).then(() => console.log('Actores agregados correctamente'))
                }
                })
            })
            .catch(error => console.log(error))
            .finally(() => res.redirect('/movies'))
        
    },
    delete: (req, res) => {},
    destroy: (req, res) => {
        const id = req.params.id

        db.Actor_Movie.destroy({
            where: {
                movie_id: id
            }
        })
        .then(() => {
            db.Actor.update(
                {
                    favorite_movie_id : null
                },
                {
                where: {
                    favorite_movie_id : id
                }
            })
            .then(() => {
                db.Movie.destroy({
                    where: {
                        id: id
                    }
                })
                .then( () => {
                    return res.redirect('/movies')
                })
            })
        })        
        .catch(error => console.log(error))
    },
    // search: (req,res) =>{
    //     const keyword = req.query.keyword

    //     db.Movie.findAll({
    //         where: {
    //             title: {
    //                 [Op.substring]: keyword
    //             }
    //         }
    //     })
    //     .then(movies => {
    //         if(!movies.length){
    //             axios.get(URL_BASE, `&t=${keyword}`)
    //             .then(response => {
    //                 console.log(response.data)
    //                 const {Title, Released, Genre, Awards, Poster, Ratings} = response.data
    //                 const awardsArray = Awards.match(/\d+/g)

    //                 const awardsParseado = awardsArray.map(award => +award)

    //                 const awards = awardsParseado.reduce((acum, num) => acum + +num, 0)

    //                 console.log(awards, '<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<')
                    
    //                 return res.send(awardsArray)
    //                 /* let peliculaRobada = {
    //                     title : Title,
    //                     awards,
    //                     rating,
    //                     release_date,
    //                     image,
    //                     genre_id
    //                 } */
    //             })
    //         }
    //         //return res.render('moviesList', {movies, result: true})
    //     })
    //     .catch(error => console.log(error))
    // }
};

module.exports = moviesController;
