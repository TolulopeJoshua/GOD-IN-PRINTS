const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const {isLoggedIn, isReviewAuthor, setRedirect} = require('../middleware');
const { playlists, artists } = require('../utils/lib/songs');
const {playlistsVideo} = require('../utils/lib/videos');
let movies = require('../utils/lib/videos.json');
const limits = require('../utils/lib/limits');
const { sortVideos } = require('../utils/lib/videos_functions');


const Review = require('../models/review');
const Book = require('../models/book');

movies = movies.filter(movie => JSON.stringify(movie.thumbnails) != '{}');

const reduced = playlistsVideo.reduce((joined, playlist) => {
    playlist.videos.forEach(video => video.snippet.playlist = playlist.name);
    playlist.videos.forEach(video => {
        const movie = movies.find(movie => movie.id == video.snippet.resourceId.videoId)
        movie && (movie.playlist = playlist.name);
    });
    return joined.concat(playlist.videos.map(video => video.snippet)).filter(movie => JSON.stringify(movie.thumbnails) != '{}').sort((a,b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}, [])

router.get('/movies', catchAsync(async (req, res) => {

    const { userFeatures }= sortVideos(req);

    // const userStatus = req.user?.subscription.status || 'classic';
    // const userMovies = movies.filter((movie, index) => index % 100 < limits.videos[userStatus]);
    // const n = userStatus == 'classic' ? 7 : userStatus == 'premium' ? 10 : 9;
    // const features = userMovies.sort(() => 0.5 - Math.random()).slice(0, n).concat([null, null, null]).slice(0,10).sort(() => 0.5 - Math.random());
    const adBook = await Book.aggregate([{ $match: {filetype: 'pdf', isApproved: true} }, { $sample: { size: 1 } }]);
    res.render('media/movies', {title: 'Feature Movies | God In Prints', features: userFeatures, adBook})
})); 

router.get('/movies/playlists', catchAsync(async (req, res) => {

    const { userPlaylists: playlists }= sortVideos(req);

    // const userStatus = req.user?.subscription.status || 'classic';
    // const userMovies = movies.filter((movie, index) => index % 100 < limits.videos[userStatus]);
    // const playlists = playlistsVideo.map(list => ({name: list.name, videos: [...userMovies.filter(movie => movie.playlist == list.name)]}))
    let watchLater = {name: 'Watch Later', videos: []};
    if (req.user) {
        watchLater.videos = req.user.watchLater.map(id => userMovies.find(movie => movie.id == id) || null).filter(movie => movie != null);
    }
    playlists.unshift(watchLater);
    const adBook = await Book.aggregate([{ $match: {filetype: 'pdf', isApproved: true} }, { $sample: { size: 1 } }]);
    res.render('media/moviesPlaylists', {title: 'Movies Playlists | God In Prints', playlists, adBook})
})); 

router.get('/movies/:id', setRedirect, catchAsync(async (req, res) => {

    const { userMovies }= sortVideos(req);
    
    const movie = userMovies.find(movie => movie.id == req.params.id)
    if (!movie ) {
        req.flash('error', 'Movie not found!');
        res.redirect('/media/movies/playlists')
    }
    let reviews = await Review.find({ parentId: movie.id }).populate('author');
    reviews.reverse();
    const otherMovies = userMovies.filter(mov => mov.id != movie.id).sort(() => 0.5 - Math.random()).slice(0, 5);
    res.render('media/moviePlayer', {title: `Playing: ${movie.snippet.title} | God In Prints`, movie, reviews, otherMovies})
})); 

router.get('/movies/:id/:title', setRedirect, catchAsync(async (req, res) => {

    const { userMovies }= sortVideos(req);
    
    const movie = userMovies.find(movie => movie.id == req.params.id)
    if (!movie ) {
        req.flash('error', 'Movie not found!');
        res.redirect('/media/movies/playlists')
    }
    let reviews = await Review.find({ parentId: movie.id }).populate('author');
    reviews.reverse();
    const otherMovies = userMovies.filter(mov => mov.id != movie.id).sort(() => 0.5 - Math.random()).slice(0, 5);
    res.render('media/moviePlayer', {title: `Playing: ${req.params.title} | God In Prints`, movie, reviews, otherMovies})
})); 

router.post('/movies/:movieId/review', catchAsync(async (req,res) => {
    const {movieId} = req.params;
    const review = new Review(req.body.review);
    review.parentId = movieId;
    review.author = req.user._id;
    review.category = 'media/movies';
    review.dateTime = Date.now();
    await review.save();
    res.redirect(`/media/movies/${movieId}#${review._id}`)
}))

router.delete('/movies/review/:reviewId', catchAsync(async (req,res) => {
    const { reviewId } = req.params;
    await Review.findByIdAndDelete(reviewId);
    res.send(reviewId);
}))

router.get('/music/artists', (req, res) => {
    const { artist = 'Mercy Chinwo', album = "Suddenly : Amazing God (Double Single)", albumId = '30968022' } = req.query;
    res.render('media/musicArtists', {title: 'Songs Artists and Albums | God In Prints', artists, artist, album, albumId})
}); 

router.get('/music/playlists', (req, res) => {
    const { list= 29990 } = req.query;
    res.render('media/musicPlaylists', {title: 'Songs Playlists | God In Prints', playlists, list})
}); 

router.post('/movies/watchlater/:id', catchAsync(async (req, res) => {
    const user = req.user;
    if (!user) return res.status(404).send()
    !user.watchLater.includes(req.params.id) && user.watchLater.unshift(req.params.id);
    await user.save();
    res.status(200).send(user.watchLater.length.toString()); 
}))

router.delete('/movies/watchlater/:id', catchAsync(async (req, res) => {
    const user = req.user;
    if (!user) return res.status(404).send()
    user.watchLater = user.watchLater.filter(id => id != req.params.id);
    await user.save();
    res.status(200).send(user.watchLater.length.toString()); 
}))

module.exports = router;
