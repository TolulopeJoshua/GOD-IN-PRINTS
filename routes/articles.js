const express = require('express');
const router = express.Router();

const Doc = require('../models/doc')

const {getImage, putImage, upload0} = require("../functions")

const fs = require('fs');

const categories = ['Evangelism', 'Prayer/Warfare', 'Marriage/Family Life', 
                    'Spiritual Growth', 'Commitment/Consecration', 'Grace/Conversion', 
                    'Afterlife', 'Personal/Financial Development', 'Biography', 'Others'];


router.get('/', async (req, res) => {
    const articles = await Doc.find({docType: 'article'});
    // console.log(articles)
    res.render('articles/index', {categories, articles})
})

router.get('/list', async (req, res) => {
    const articles = await Doc.find({docType: 'article'}).sort({name : 1});
    // console.log(articles)
    res.render('articles/list', {category : 'All Articles', articles})
})

router.get('/categories', (req, res) => {
    res.render('articles/categories', {categories})
})

router.get('/category', async (req, res) => {
    const {category} = req.query;
    // console.log(category);
    const articles = await Doc.find({docType: 'article', role: category}).sort({name : 1});
    res.render('articles/list', {category, articles});
})

router.get('/new', (req, res) => {
    res.render('articles/new', {categories})
})

router.post('/new', async (req, res) => {
    const article = new Doc(req.body.article)
    article.docType = 'article' 
    article.dateTime = Date.now();

    fs.writeFileSync('outputText.txt', article.story);

    article.story = 'article/' + Date.now().toString() + '_' + article.name + '.txt';
    
    const myBuffer = await fs.readFileSync('outputText.txt');
    await putImage(article.story, myBuffer);


    await article.save();
    req.flash('success', `${article.name.toUpperCase()} saved successfully.`);
    res.redirect(`/articles/${article._id}`)
})

router.get('/search', async (req, res) => {
    const item = req.query.search;
    const articles = await Doc.find({docType: 'article'}).sort({name: 1});
    const result = [];
    articles.forEach((article) => {
        article.name.toLowerCase().includes(item.toLowerCase()) && result.push(article);
    })
    res.render('articles/list', {category: `Search🔍: ${item}`, articles: result});
})

router.get('/:id', async (req, res) => {
    const article = await Doc.findById(req.params.id);
    if(!article) {
        req.flash('error', 'Not in directory!');
        return res.redirect('/articles');
    }
    // const data = await getImage(article.story);
    // const story = data.Body.toString();
    // console.log(data);

    const storyRoute = req.params.id + '/story';
    res.render('articles/show', {storyRoute, article});
})

router.get('/:id/story', async (req, res) => {    
    const article = await Doc.findById(req.params.id);
    const data = await getImage(article.story);
    const story = data.Body.toString();
    res.send(story);
})

router.get('/:id/imageUpload', (req, res) => {
    const id = req.params.id;
    const route = `/Articles/${id}/imageUpload`;
    const msg = 'Upload Article Image';
    res.render('imageUpload', {route, msg});
})

var Jimp = require('jimp');
const util = require('util');
const path = require('path');

router.post('/:id/imageUpload', upload0.single('image'), async function(req, res) {
    const article = await Doc.findById(req.params.id);
    article.image.key = 'article-img/' + Date.now().toString() + '_' + req.file.originalname;
    
    const image = await Jimp.read(req.file.path);
    if(req.file.size > 50000) {
        await image.quality(20);
    }
    await image.writeAsync('output.jpg');

    const myBuffer = await fs.readFileSync('output.jpg');
    await putImage(article.image.key, myBuffer);

    let files = await fs.readdirSync('uploads/images')
    for (const file of files) {
      fs.unlinkSync(path.join('uploads/images', file));
    }
    
    await article.save();
    req.flash('success', 'Successfully saved article');
    res.redirect(`/articles/${article._id}`)
});

module.exports = router;