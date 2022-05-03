module.exports.index = async (req, res) => {
    res.render('bible/index');
};

module.exports.chapter = async (req, res) => {
    const chapt = req.query.chapter || 'jhn.3';
    const version = req.query.version || 'de4e12af7f28f599-02';
    const longChapters = ["psa.119", "1ki.8", "deu.28", "num.7", "lev.13", "jer.51", "ezk.16", "gen.24"];
    if (longChapters.includes(chapt)) {
        const {chapter} = require(`../public/javascripts/bibleData/kjvLongTexts/${chapt}`)
        const {meta, data} = chapter;
        res.render('bible/chapter', {meta, data});
    } else { 
        const https = require('https')
        const options = {
        hostname: 'api.scripture.api.bible',
            path: `/v1/bibles/${version}/chapters/${chapt}`,
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
};

module.exports.search = async (req, res) => {
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
                res.render('bible/search', {data, searchText});
        })
    })
    reqst.on('error', error => {
      console.error(error)
    })
    reqst.end()
};