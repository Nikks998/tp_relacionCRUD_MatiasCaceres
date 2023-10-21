const path = require("path");
const db = require("../database/models");
const sequelize = db.sequelize;
const { Op } = require("sequelize");
const moment = require('moment')

//Aqui tienen una forma de llamar a cada uno de los modelos
// const {Movies,Genres,Actor} = require('../database/models');

//Aquí tienen otra forma de llamar a los modelos creados
const Movies = db.Movie;
const Genres = db.Genre;
const Actors = db.Actor;

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
            genre_id
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
        const movie = db.Movie.findByPk(req.params.id)

        Promise.all([genres, movie])
            .then(([genres, movie]) => {
                return res.render("moviesEdit", {
                    allGenres: genres,
                    Movie: movie,
                    moment
                });
            })
            .catch((error) => console.log(error));
    },
    update: (req, res) => { },
    delete: (req, res) => { },
    destroy: (req, res) => { },
};

module.exports = moviesController;
