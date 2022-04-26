const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync');

const Doc = require('../models/doc')
const Book = require('../models/book');

router.get('/', catchAsync(async (req, res) => {

    const article = await Doc.aggregate([{ $match: { docType: "article" } }, { $sample: { size: 1 } }]);
    const myArt = article[0];

    const biography = await Doc.aggregate([{ $match: { docType: "biography" } }, { $sample: { size: 1 } }]);
    const myBio = biography[0];
    
    const book = await Book.aggregate( [{ $match: {filetype: 'pdf'} }, { $sample: { size: 1 } } ] ); const myBook = book[0];
    
    const VERSES = [`JER.29.11`,`PSA.23`,`1COR.4.4-8`,`PHP.4.13`,`JHN.3.16`,`ROM.8.28`,`ISA.41.10`,`PSA.46.1`,
    `GAL.5.22-23`,`HEB.11.1`,`2TI.1.7`,`1COR.10.13`,`PRO.22.6`,`ISA.40.31`,`JOS.1.9`,`HEB.12.2`,`MAT.11.28`,
    `ROM.10.9-10`,`PHP.2.3-4`,`MAT.5.43-44`];
    const verseIndex = Math.floor(Math.random() * VERSES.length);
    const verseID = VERSES[verseIndex];
    
    const https = require('https') 
    const options = {
    hostname: 'api.scripture.api.bible',
        path: `/v1/bibles/de4e12af7f28f599-01/search?query=${verseID}`,
        method: 'GET',
        headers: {'api-key': process.env.BIBLE_API_KEY},
    }
    const reqst = https.request(options, rest => {
        rest.on('data', d => {
            const verse = JSON.parse(d);
            res.render('landing', {verse, myBook, myBio, myArt});
        })
    }) 
    reqst.end() 
})); 

module.exports = router;