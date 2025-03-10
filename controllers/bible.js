const { default: axios } = require('axios');
const { response } = require('express');
const { writeFileSync, readFileSync } = require('fs');
const { version } = require('joi');
const Review = require('../models/review');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');

module.exports.index = async (req, res) => {
    const title = `GIP Library - Multiversioned Bible`;
    res.render('bible/index', {title});
};

module.exports.chapter = (async (req, res) => {

    // getChapters('9879dbb7cfe39e4d-04');

    const chapt = req.query.chapter || 'jhn.3';
    const version = req.query.version || 'de4e12af7f28f599-02';
    req.session.bibleVersion = version;
    const reviews = req.user ? await Review.find({author: req.user._id, parentId: chapt}) : [];
    const chapters = JSON.parse(readFileSync(`utils/bible/${version}.json`));
    const data = chapters.find(chapter => chapter.id.toLowerCase() == chapt);
    const title = `Multiversioned Bible - ${data.reference}`;
    res.render('bible/chapter', {data, reviews, title});
});

module.exports.search = (async (req, res) => {
    const searchText = req.query.search;
    const title = `Multiversioned Bible Search - ${searchText}`;
    const offset = req.query.offset || 0;
    const version = req.query.version || req.session.bibleVersion;
    axios.get(`https://api.scripture.api.bible/v1/bibles/${version}/search?query=${searchText}&offset=${offset * 20}&limit=20`, {
        headers: {'api-key': process.env.BIBLE_API_KEY},
    }).then(({data: {data}}) => {
        res.render('bible/search', {data, searchText, title});
    }).catch(); 
});

module.exports.writexml = async (req, res) => {
    const version = req.query.version || 'de4e12af7f28f599-02';
    const chapters = JSON.parse(readFileSync(`utils/bible/${version}.json`));
    let xmap = '';
    for (let chapter of chapters) {
        xmap += `<url>\n\ \ <loc>https://godinprints.org/bible/chapter?chapter=${chapter.id.toLowerCase()}</loc>\n\ \ <lastmod>2023-04-08T10:24:55+00:00</lastmod>\n\ \ <priority>0.64</priority>\n</url>\n`
    }
    writeFileSync('bible.xml', xmap);
    res.status(200).send('done');
}

// module.exports.addReview = async (req, res) => {
//     // console.log(req)
//     const user = await User.findById(req.user._id);
//     const review = new Review(req.body.review);
//     review.parentId = req.params.chapter.toLowerCase();
//     review.author = req.user._id;
//     review.category = 'Bible';
//     review.dateTime = Date.now();
//     user.reviews.unshift(review);
//     await review.save();
//     await user.save();
//     const {chapter, version} = req.params;
//     console.log(req.params)
//     res.redirect(`/bible/chapter?chapter=${chapter}&version=${version}`);
// };

module.exports.deleteReview = async (req, res) => {
    const {userId, reviewId} = req.params;
    await User.findByIdAndUpdate(userId, {$pull: {reviews: reviewId} } );
    await Review.findByIdAndDelete(reviewId);
    res.send(reviewId);
}


async function getChapters(id) {
    const chapters = []
    axios.get(`https://api.scripture.api.bible/v1/bibles/${id}/books?include-chapters=true`, {
        headers: {'api-key': process.env.BIBLE_API_KEY},
    }).then(async ({data: {data}}) => {
        for (let d of data) {
            for (let chapter of d.chapters) {
                let {data} = await axios.get(`https://api.scripture.api.bible/v1/bibles/${chapter.bibleId}/chapters/${chapter.id}?include-verse-spans=true`, {
                    headers: {'api-key': process.env.BIBLE_API_KEY},
                })
                chapters.push(data.data);
                // break;
            }
        }
        writeFileSync(`utils/bible/${id}.json`, JSON.stringify(chapters)); 
    }) 
}