const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const {isLoggedIn, isReviewAuthor} = require('../middleware');
const { playlists, artists } = require('../utils/lib/songs');

const Review = require('../models/review');

router.get('/movies', (req, res) => {
    res.render('media/movies', {title: 'God In Prints | Movies on the Christian Faith'})
}); 

router.get('/movies/playlists', (req, res) => {
    res.render('media/moviesPlaylists', {title: 'Movies Playlists | God In Prints'})
}); 

router.get('/movies/:id', (req, res) => {
    res.render('media/moviePlayer', {title: 'Playing: {movie title} | God In Prints', reviews: []})
}); 

router.get('/music/artists', (req, res) => {
    const { artist = 'Mercy Chinwo', album = "Suddenly : Amazing God (Double Single)", albumId = '30968022' } = req.query;
    res.render('media/musicArtists', {title: 'Songs Artists and Albums | God In Prints', artists, artist, album, albumId})
}); 

router.get('/music/playlists', (req, res) => {
    const { list= 29990 } = req.query;
    res.render('media/musicPlaylists', {title: 'Songs Playlists | God In Prints', playlists, list})
}); 

module.exports = router;