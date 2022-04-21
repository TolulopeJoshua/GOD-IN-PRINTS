const express = require('express');
const router = express.Router();

const Doc = require('../models/doc')
const Book = require('../models/book');

const multer = require('multer');
const sharp = require("sharp");
const fs = require('fs');

const {getImage, encode, putImage, upload0, paginate} = require("../functions")


router.use(express.static("./uploads"));


router.get('/', async (req, res) => {
    const biographies = await Doc.aggregate([{ $match: {docType: 'biography'} }, { $sample: { size: 4 } }]);
    const adBook = await Book.aggregate([{ $sample: { size: 1 } }]);
    res.render('biographies/index', {biographies, adBook})
}) 

router.get('/list', async (req, res) => {
    const q = req.query.q;
    let searchObj;
    switch (q) {
        case 'birth':
            searchObj = {birthYear: 1};
            break;
        case 'role':
            searchObj = {role: 1, name: 1};
            break;
        default :
            searchObj = {name: 1}
    }
    const biographies = await Doc.find({docType: 'biography'}).sort(searchObj);
    const [pageDocs, pageData] = paginate(req, biographies)

    res.render('biographies/list', {category: 'Bio Gallery', biographies: pageDocs, pageData})
})

router.get('/new', (req, res) => {
    res.render('biographies/new')
})

router.post('/new', async (req, res) => {
    const biography = new Doc(req.body.biography)
    biography.docType = 'biography'
    biography.dateTime = Date.now();

    await fs.writeFileSync('outputText.txt', biography.story);

    biography.story = 'bio/' + Date.now().toString() + '_' + biography.name + '.txt';
    
    const myBuffer = await fs.readFileSync('outputText.txt');
    await putImage(biography.story, myBuffer);

    await biography.save();
    req.flash('success', `${biography.name.toUpperCase()}'s biography saved. Kindly upload picture`);
    res.redirect(`/biographies/${biography._id}/imageUpload`)
})

router.get('/search', async (req, res) => {
    const item = req.query.search;
    const biographies = await Doc.find({docType: 'biography'}).sort({name: 1});
    const result = [];
    biographies.forEach((biography) => {
        biography.name.toLowerCase().includes(item.toLowerCase()) && result.push(biography);
    })
    const [pageDocs, pageData] = paginate(req, result)

    res.render('biographies/list', {category: `Search🔍: ${item}`, biographies: pageDocs, pageData});
})

router.get('/:id', async (req, res) => {
    const biography = await Doc.findById(req.params.id);
    if(!biography) {
        req.flash('error', 'Not in directory!');
        return res.redirect('/biographies');
    }
    res.render('biographies/show', {biography});
})

router.get('/:id/story', async (req, res) => {    
    const {q} = req.query;
    // console.log(q)
    const biography = await Doc.findById(req.params.id);
    const data = await getImage(biography.story);
    const story = data.Body.toString();
    if (Number(q)) {
        return res.send(story.substring(0, q) + '...');
    }
    res.send(story);
})

router.get('/:id/imageUpload', (req, res) => {
    const id = req.params.id;
    const route = `/Biographies/${id}/imageUpload`;
    const msg = 'Upload Picture for Bio.';
    res.render('imageUpload', {route, msg});
}) 

var Jimp = require('jimp');
const util = require('util');
const path = require('path');

router.post('/:id/imageUpload', upload0.single("image"), async function(req, res) {

    const biography = await Doc.findById(req.params.id);
    biography.image.key = 'bio-image/' + Date.now().toString() + '_' + req.file.originalname;
    
    const image = await Jimp.read(req.file.path);
    await image.resize(320,320);
    if(req.file.size > 50000) {
        await image.quality(20);
    }
    await image.writeAsync('output.jpg');

    const myBuffer = await fs.readFileSync('output.jpg');
    await putImage(biography.image.key, myBuffer);

    let files = await fs.readdirSync('uploads')
    for (const file of files) {
      fs.unlinkSync(path.join('uploads', file));
    }
 
    await biography.save(); 
    req.flash('success', 'Successfully saved biography');
    res.redirect(`/biographies/${biography._id}`)
});
 
module.exports = router;  