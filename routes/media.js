const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const {isLoggedIn, isReviewAuthor, setRedirect} = require('../middleware');
const { playlists, artists } = require('../utils/lib/songs');
// const {playlistsVideo} = require('../utils/lib/videos');
// let movies = require('../utils/lib/videos.json');
// const limits = require('../utils/lib/limits');
let hymns = require('../utils/lib/hymns.json');
const td = require("tinyduration")
const { sortVideos, getVideoIdsFromVideoPlaylists, getAllVideosFromVideoIds } = require('../utils/lib/videos_functions');


const Review = require('../models/review');
const Book = require('../models/book');
const { default: axios } = require('axios');
const { writeFileSync } = require('fs');

router.get('/movies', catchAsync(async (req, res) => {
    // await getVideoIdsFromVideoPlaylists(res);
    // await getAllVideosFromVideoIds(res);

    const { userFeatures }= sortVideos(req);
    res.render('media/movies', {title: 'Feature Movies | God In Prints', features: userFeatures, })
})); 

router.get('/movies/playlists', setRedirect, catchAsync(async (req, res) => {

    const { userPlaylists: playlists, videos }= sortVideos(req);
    let watchLater = {name: 'Watch Later', videos: []};
    if (req.user) {
        watchLater.videos = req.user.watchLater.map(id => videos.find(video => video.id == id)).filter(mov => mov);
    }
    playlists.unshift(watchLater);
    res.render('media/moviesPlaylists', {title: 'Movies Playlists | God In Prints', playlists, })
})); 

router.get('/movies/:id', setRedirect, catchAsync(async (req, res) => {

    const { userMovies, classesMovies }= sortVideos(req);

    const movie = userMovies.find(movie => movie.id == req.params.id)
    if (!movie ) {
        let msg = 'Movie not found!'
        for (let clas in classesMovies) {
            if (classesMovies[clas].find(mov => mov.id == req.params.id)) {
                msg = `<a href="/subscription">${clas.toUpperCase()} subscription</a> level required.`
            }
        }
        req.flash('error', msg);
        return res.redirect('/media/movies/playlists')
    }
    let reviews = await Review.find({ parentId: movie.id }).populate('author');
    reviews.reverse();
    const otherMovies = userMovies.filter(mov => mov.embeddable && mov.id != movie.id).sort(() => 0.5 - Math.random()).slice(0, 5);
    res.render('media/moviePlayer', {title: `${movie.snippet.title} | God In Prints`, movie, reviews, otherMovies})
})); 

router.get('/movies/:id/:title', setRedirect, catchAsync(async (req, res) => {

    const { userMovies, classesMovies }= sortVideos(req);
 
    const movie = userMovies.find(movie => movie.id == req.params.id)
    if (!movie ) {
        let msg = 'Movie not found!'
        for (let clas in classesMovies) {
            if (classesMovies[clas].find(mov => mov.id == req.params.id)) {
                msg = `<a href="/subscription">${clas[0].toUpperCase()}${clas.slice(1)} subscription</a> level required.`
            }
        }
        req.flash('error', msg);
        return res.redirect('/media/movies/playlists') 
    }
    let reviews = await Review.find({ parentId: movie.id }).populate('author');
    reviews.reverse();
    const otherMovies = userMovies.filter(mov => mov.embeddable && mov.id != movie.id).sort(() => 0.5 - Math.random()).slice(0, 5);
    res.render('media/moviePlayer', {title: `${movie.snippet.title} | God In Prints`, movie, reviews, otherMovies})
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

router.get('/music/playlists', catchAsync(async (req, res) => {
    // await getHymns();

    hymns = hymns.filter(hymn => {
        let { hours, minutes, seconds } = td.parse(hymn.contentDetails.duration);
        hours = hours ? hours.toString() : '';
        minutes = minutes ? minutes > 9 ? minutes.toString() : `0${minutes}` : '00';
        seconds = seconds ? seconds > 9 ? seconds.toString() : `0${seconds}` : '00';
        hymn.duration = `${hours ? hours+':' : ''}${minutes}:${seconds}`;
        return JSON.stringify(hymn.thumbnails) != '{}' && hymn.status.embeddable && hymn.id != 'hCogaiSJQ0c';
    })
    const { list= 29990 } = req.query;
    res.render('media/musicPlaylists', {title: 'Songs Playlists | God In Prints', hymns, playlists, list})
})) 

router.post('/movies/watchlater/:id', catchAsync(async (req, res) => {
    const user = req.user;
    if (!user) return res.status(404).send()
    !user.watchLater.includes(req.params.id) && user.watchLater.unshift(req.params.id);
    await user.save();
    const { videos }= sortVideos(req);
    const watchLater = user.watchLater.filter(later => videos.find(movie => movie.id == later));
    res.status(200).send(watchLater.length.toString()); 
}))

router.delete('/movies/watchlater/:id', catchAsync(async (req, res) => {
    const user = req.user;
    if (!user) return res.status(404).send()
    user.watchLater = user.watchLater.filter(id => id != req.params.id);
    await user.save();
    const { videos }= sortVideos(req);
    const watchLater = user.watchLater.filter(later => videos.find(movie => movie.id == later));
    res.status(200).send(watchLater.length.toString()); 
}))

router.get('/search', catchAsync(async (req, res) => {
    let result = [];
    const search = req.query.search;
    const { userMovies, videos } = sortVideos(req);
    if (search.trim()) {
        videos.forEach(video => video.snippet.title.toLowerCase().includes(search.toLowerCase()) && result.push(video));
    }
    result = [...new Set(result)];
    result = result.map(movie => userMovies.includes(movie) ? movie : null).slice(0,10);
    res.render('media/movies', {title: 'Search results | God In Prints', features: result, search});
}))


module.exports = router;


async function getHymns() {
    const playlists = ['PLLmJgJT4qHJC_o86qKt5uf9FojNBmyqlc'];
    let hymns = [];
    for (playlist of playlists) {
        let result = await axios.get(`https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlist}&key=${process.env.YOUTUBE_API_KEY}`)
        let hymnsId = result.data.items.map(item => item.snippet.resourceId.videoId)
        await getSet(hymnsId)
        while(result.data.nextPageToken) {
            result = await axios.get(`https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&pageToken=${result.data.nextPageToken}&playlistId=${playlist}&key=${process.env.YOUTUBE_API_KEY}`)
            hymnsId = result.data.items.map(item => item.snippet.resourceId.videoId)
            await getSet(hymnsId)
        }
    }
    writeFileSync('utils/lib/hymns.json', JSON.stringify(hymns));
    return;

    async function getSet(set) {
        const url = `https://youtube.googleapis.com/youtube/v3/videos?part=id&part=snippet&part=contentDetails&part=status&part=statistics&part=player&part=topicDetails${set.map(id => `&id=${id}`).join('')}&maxResults=50&key=${process.env.YOUTUBE_API_KEY}`
        const { data } = await axios.get(url);
        console.log(data.items.length);
        data.items.forEach(item => hymns.push(item));
        if (data.pageInfo.totalResults != data.pageInfo.resultsPerPage) console.log('something went wrong');
    }
}