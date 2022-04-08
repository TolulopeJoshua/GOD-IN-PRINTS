const express = require('express');
const router = express.Router();




router.get('/', async (req, res) => {
    res.render('bible/index');
});

const { features } = require('process');

router.get('/chapter', async (req, res) => {
    const chapt = req.query.chapter;
    const longChapters = ["psa.119", "1ki.8", "deu.28", "num.7", "lev.13", "jer.51", "ezk.16", "gen.24"];
    if (longChapters.includes(chapt)) {
        const {chapter} = require(`./public/javascripts/${chapt}`)
        const {meta, data} = chapter;
        res.render('bible/chapter', {meta, data});
    } else {
        const https = require('https')
        const options = {
        hostname: 'api.scripture.api.bible',
            path: `/v1/bibles/de4e12af7f28f599-01/chapters/${chapt}`,
            method: 'GET',
            headers: {'api-key': process.env.BIBLE_API_KEY},
        }
        const reqst = https.request(options, rest => {
            rest.on('data', d => {
                const {meta, data} = JSON.parse(d);
                res.render('bible/chapter', {meta, data});
            })
        })
        reqst.end() 
    };
}); 
  
router.get('/search', async (req, res) => {
    const searchText = req.query.search;
    const offset = req.query.offset || 0;
    const https = require('https')
    const options = {
      hostname: 'api.scripture.api.bible',
    //   port: 443, 
        path: encodeURI(`/v1/bibles/de4e12af7f28f599-01/search?query=${searchText}&offset=${offset}&limit=20`),
        method: 'GET',
        headers: {'api-key': process.env.BIBLE_API_KEY},
    }
    
    const reqst = https.request(options, rest => {
    //   console.log(`statusCode: ${rest.statusCode}`)

        rest.on('data', d => {
            // process.stdout.write(d)
                const {data} = JSON.parse(d);
                // console.log(d.toString());
                res.render('bible/search', {data, searchText});
        })
    })
    
    reqst.on('error', error => {
      console.error(error)
    })
    
    reqst.end()

});

module.exports = router;