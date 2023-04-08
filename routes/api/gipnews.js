const express = require('express');
const router = express.Router();
const catchAsync = require('../../utils/catchAsync');

const axios = require('axios')
const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs');
const { v4: uuid } = require('uuid');

const sects = ['world','sports','business','health','top','science,technology','entertainment','reel']

router.post('/refresh', catchAsync(async (req, res) => {
    if (req.headers.id !== process.env.NEXT_SECRET_FIREBASE_APIKEY) {
        return res.status(400).send();
    }
    let count = 0, ins = 0;
    let {section} = req.query;
    // for (let section of sections) {
        const options = {
            method: 'GET',
            url: 'https://newsdata2.p.rapidapi.com/news',
            params: {category: section, language: 'en'},
            headers: {
                'X-RapidAPI-Key': process.env.NEXT_SECRET_C1,
                'X-RapidAPI-Host': 'newsdata2.p.rapidapi.com'
            }
        };
        let sectionData = [];
        const sectionPath = `/tmp/${section.split(',')[0]}.json`;
        try {
            if (section == 'reel') {
                const ids = [17,24,25,27,28]
                const urls = ids.map(id => `https://youtube.googleapis.com/youtube/v3/videos?part=snippet&part=player&part=contentDetails&part=status&chart=mostPopular&maxResults=50&videoCategoryId=${id}&key=${process.env.YOUTUBE_API_KEY}`);
                const responses = await Promise.all(urls.map(url => axios.get(url))) 
                let items = responses.reduce((res, sec) => res.concat(sec.data.items), []);
                sectionData = items.filter(({contentDetails}) => !contentDetails.regionRestriction).map(video => {
                    const {
                        id, snippet: {title, description, publishedAt: pubDate, 
                            thumbnails:{standard}}, player: {embedHtml: content}
                        } = video;
                        return ({title, description, content, pubDate, image_url: standard?.url, id});
                    })
                console.log(section, sectionData.length);
                writeFileSync(sectionPath, JSON.stringify(sectionData.sort((a,b) => {
                    return (new Date(b.pubDate) - (new Date(a.pubDate)))
                }).slice(0,100)));
            } else {
                try {
                    sectionData = JSON.parse(readFileSync(sectionPath)) || [];
                } catch (error) { 
                    const url = `https://gipnews-default-rtdb.firebaseio.com/${process.env.NEXT_SECRET_FIREBASE_APIKEY}/${section.split(',')[0]}.json?orderBy="pubDate"&limitToLast=100`
                    const newsSection = (await axios.get(url)).data;
                    for (let key in newsSection) {
                        sectionData.push(newsSection[key]);
                    }
                 }
                let response = await axios.request(options)
                let { results } = response.data;
                if (results && results.length) {
                    results = results.filter(article => {
                        if (!(article.description || article.content)) return false;
                        if (!article.image_url && article.content?.length < 1000) return false;
                        if (['cyprus-mail','pakistantoday','manicapost','scripts.24','Snl24','pajhwok','hmetro',
                            'colombopage','sportti','orissapost','herald','allbanaadir','sundaymail','sundaynews',
                            'coinspeaker','arabnews','docbao'
                            ].filter(src => article.link.includes(src)).length) return false;
                        return (!(sectionData.map(data => data.title).includes(article.title)));
                    }).sort((a,b) => (new Date(b.pubDate) - (new Date(a.pubDate)))).slice(0,1);
                    console.log(section, results.length)
                    for (let result of results) {
                        let {title, link, description, content, pubDate, image_url, id} = result;
                        description = description || content.slice(0,100);
                        content = content || description;
                        id = uuid();
                        if (count < 2) {
                            const key = [
                                process.env.NEXT_SECRET_C1, process.env.NEXT_SECRET_C2,
                                process.env.NEXT_SECRET_C3, process.env.NEXT_SECRET_C4,
                            ][sects.indexOf(section) % 4]
                            const options = {
                                method: 'GET',
                                url: 'https://extract-news.p.rapidapi.com/v0/article',
                                params: { url: link },
                                headers: {
                                    'X-RapidAPI-Key': key,
                                    'X-RapidAPI-Host': 'extract-news.p.rapidapi.com'
                                }
                            };
                            console.log(link.split('/')[2]);
                            console.log(title);
                            response = await axios.request(options)
                            const {article} = response.data;
                            if (article) {
                                content = article.text || content; image_url = article.meta_image || image_url; 
                                description = article.meta_description || description;
                            }
                            const dbPath = `https://gipnews-default-rtdb.firebaseio.com/${process.env.NEXT_SECRET_FIREBASE_APIKEY}/${section.split(',')[0]}/${id}.json`
                            await axios.put(dbPath, JSON.stringify({title, link, description, content, pubDate, image_url, id}))
                            sectionData.unshift({title, link, description, content, pubDate, image_url, id});
                            writeFileSync(sectionPath, JSON.stringify(sectionData.sort((a,b) => {
                                return (new Date(b.pubDate) - (new Date(a.pubDate)))
                            }).sort((a,b) => {
                                const val = (a.image_url && !b.image_url) ? -1 :
                                            (b.image_url && !a.image_url) ? 1 : 0
                                return val;
                            }).slice(0,100))); 
                            console.log(`${ins += 1} - ${section}`)
                            count += 1;
                        } else {
                            console.log('Escaped insertion: ' + section)
                        }
                    }
                }
            }
        } catch (error) { console.log(error) }
    // }
    res.status(200).send('success ' + new Date())
}))

router.get('/data', catchAsync(async (req, res) => {
    const data = {};
        for (let section of sects) {
            let sectionData = [];
            let sectionPath = `/tmp/${section?.split(',')[0]}.json`;
            try {
                // throw ' '
                sectionData = JSON.parse(readFileSync(sectionPath)) || [];
                data[section] = sectionData.map(art => ({...art, section}));
            } catch (error) { 
                console.log('db get');
                const urls = sects.slice(0,7).map(sec => `https://gipnews-default-rtdb.firebaseio.com/${process.env.NEXT_SECRET_FIREBASE_APIKEY}/${sec.split(',')[0]}.json?orderBy="pubDate"&limitToLast=100`)
                urls.push(`https://youtube.googleapis.com/youtube/v3/videos?part=snippet&part=player&part=contentDetails&part=status&chart=mostPopular&maxResults=50&videoCategoryId=17&key=${process.env.YOUTUBE_API_KEY}`);
                urls.push(`https://youtube.googleapis.com/youtube/v3/videos?part=snippet&part=player&part=contentDetails&part=status&chart=mostPopular&maxResults=50&videoCategoryId=24&key=${process.env.YOUTUBE_API_KEY}`);
                urls.push(`https://youtube.googleapis.com/youtube/v3/videos?part=snippet&part=player&part=contentDetails&part=status&chart=mostPopular&maxResults=50&videoCategoryId=25&key=${process.env.YOUTUBE_API_KEY}`);
                urls.push(`https://youtube.googleapis.com/youtube/v3/videos?part=snippet&part=player&part=contentDetails&part=status&chart=mostPopular&maxResults=50&videoCategoryId=27&key=${process.env.YOUTUBE_API_KEY}`);
                urls.push(`https://youtube.googleapis.com/youtube/v3/videos?part=snippet&part=player&part=contentDetails&part=status&chart=mostPopular&maxResults=50&videoCategoryId=28&key=${process.env.YOUTUBE_API_KEY}`);
                // const newsSection = (await axios.get(url)).data;
                const newsSections = (await Promise.all(urls.map(url => axios.get(url)))).map(res => res.data);
                for (let newsSection of newsSections.slice(0,7)) {
                    section = sects[newsSections.indexOf(newsSection)];
                    sectionPath = `/tmp/${section?.split(',')[0]}.json`;
                    sectionData = [];
                    for (let key in newsSection) {
                        sectionData.push(newsSection[key]);
                    }
                    data[section] = sectionData.sort((a,b) => (new Date(b.pubDate) - (new Date(a.pubDate))))
                    .sort((a,b) => {
                        const val = (a.image_url && !b.image_url) ? -1 :
                                    (b.image_url && !a.image_url) ? 1 : 0
                        return val;
                    }).map(art => ({...art, section}));
                    try {
                        writeFileSync(sectionPath, JSON.stringify(data[section])); 
                    } catch (error) { console.log('could not write to file') }
                }
                section = 'reel';
                sectionPath = `/tmp/reel.json`;
                sectionData = [];
                let items = newsSections.slice(7).reduce((it, data) => it.concat(data.items), [])
                sectionData = items.filter(({contentDetails}) => !contentDetails.regionRestriction).map(video => {
                    const {
                    id, snippet: {title, description, publishedAt: pubDate, 
                        thumbnails:{standard}}, player: {embedHtml: content}
                    } = video;
                    return ({title, description, content, pubDate, image_url: standard?.url, id});
                })
                console.log(sectionData.length);
                data[section] = sectionData.sort((a,b) => {
                    return (new Date(b.pubDate) - (new Date(a.pubDate)))
                }).slice(0,100).map(art => ({...art, section}));
                try {
                    writeFileSync(sectionPath, JSON.stringify(data[section]));   
                } catch (error) { console.log('could not write to file') }
                break;
            }
        }
        for (let sec in data) {
            data[sec] = data[sec].slice(0,10).map(art => ({...art, content:''}));
        }
        res.status(200).send(data)
}))

router.get('/:section', catchAsync(async (req, res) => {
    let sectionData = [];
    let reel = [];
    const { section } = req.params
    let sectionPath = `/tmp/${section.split(',')[0]}.json`;
    try {
        sectionData = JSON.parse(readFileSync(sectionPath)) || [];
        sectionData = sectionData.map(art => ({...art, section}));
    } catch (error) { 
        if (section == 'reel') {
            const urls = [17,24,25,27,28].map(id => `https://youtube.googleapis.com/youtube/v3/videos?part=snippet&part=player&part=contentDetails&part=status&chart=mostPopular&maxResults=50&videoCategoryId=${id}&key=${process.env.YOUTUBE_API_KEY}`)
            const newsSection = (await Promise.all(urls.map(url => axios.get(url)))).map(res => res.data);
            let items = newsSection.reduce((it, data) => it.concat(data.items), [])
            sectionData = items.filter(({contentDetails}) => !contentDetails.regionRestriction).map(video => {
                const {
                id, snippet: {title, description, publishedAt: pubDate, 
                    thumbnails:{standard}}, player: {embedHtml: content}
                } = video;
                return ({title, description, content, pubDate, image_url: standard?.url, id});
            })
        } else {
            const url = `https://gipnews-default-rtdb.firebaseio.com/${process.env.NEXT_SECRET_FIREBASE_APIKEY}/${section.split(',')[0]}.json?orderBy="pubDate"&limitToLast=100`;
            const newsSection = (await axios.get(url)).data;
            for (let key in newsSection) {
                sectionData.push(newsSection[key]);
            }
        }
        sectionData = sectionData.sort((a,b) => (new Date(b.pubDate) - (new Date(a.pubDate))))
        .sort((a,b) => {
            const val = (a.image_url && !b.image_url) ? -1 :
                        (b.image_url && !a.image_url) ? 1 : 0
            return val;
        }).slice(0,100).map(art => ({...art, section}));
        try {
            writeFileSync(sectionPath, JSON.stringify(sectionData)); 
        } catch (error) { console.log('could not write to file') }
     }
    const features = sects.filter(sect => sect != section).map(section => {
        sectionPath = `/tmp/${section.split(',')[0]}.json`;
        try {
            let data = JSON.parse(readFileSync(sectionPath)) || [{}];
            data = sortByImage(data)
            if (section == 'reel') {
                reel = data.slice(1,5).map(vid => ({...vid, section}))
            }
            return {...data[0], section, content: ''}
        } catch (error) { 
            return {};
         }
    })
    res.status(200).send({data: sortByImage(sectionData).map(data => ({...data, section, content: ''})), features, reel})

    function sortByImage(data) {
        return data.sort((a,b) => {
            if (a.image_url && !b.image_url) return -1;
            if (b.image_url && !a.image_url) return 1;
            return 0;
        })
    }
}))

router.get('/:section/:id', catchAsync(async (req, res) => {
        let sectionData = [];
        const { section, id } = req.params
        const sectionPath = `/tmp/${section?.split(',')[0]}.json`;
        try {
            sectionData = JSON.parse(readFileSync(sectionPath)) || [];
            sectionData = sectionData.map(art => ({...art, section}));
        } catch (error) {
            // if (section == 'reel') {
            //     const urls = [17,24,25,27,28].map(id => `https://youtube.googleapis.com/youtube/v3/videos?part=snippet&part=player&part=contentDetails&part=status&chart=mostPopular&maxResults=50&videoCategoryId=${id}&key=${process.env.YOUTUBE_API_KEY}`)
            //     const newsSection = (await Promise.all(urls.map(url => axios.get(url)))).map(res => res.data);
            //     let items = newsSection.reduce((it, data) => it.concat(data.items), [])
            //     sectionData = items.filter(({contentDetails}) => !contentDetails.regionRestriction).map(video => {
            //         const {
            //         id, snippet: {title, description, publishedAt: pubDate, 
            //             thumbnails:{standard}}, player: {embedHtml: content}
            //         } = video;
            //         return ({title, description, content, pubDate, image_url: standard?.url, id});
            //     })
            // } else {
            //     const url = `https://gipnews-default-rtdb.firebaseio.com/${process.env.NEXT_SECRET_FIREBASE_APIKEY}/${section.split(',')[0]}.json?orderBy="pubDate"&limitToLast=100`;
            //     const newsSection = (await axios.get(url)).data;
            //     for (let key in newsSection) {
            //         sectionData.push(newsSection[key]);
            //     }
            // }
            // sectionData = sectionData.sort((a,b) => (new Date(b.pubDate) - (new Date(a.pubDate))))
            // .sort((a,b) => {
            //     const val = (a.image_url && !b.image_url) ? -1 :
            //                 (b.image_url && !a.image_url) ? 1 : 0
            //     return val;
            // }).slice(0,100).map(art => ({...art, section}));
            // try {
            //     writeFileSync(sectionPath, JSON.stringify(sectionData)); 
            // } catch (error) { console.log('could not write to file') }
        }
        let data = sectionData.find(art => art.id == id);
        if (!data) {
            if (section == 'reel') {
                const url = `https://youtube.googleapis.com/youtube/v3/videos?part=snippet&part=player&part=snippet&part=contentDetails&part=status&id=${id}&key=${process.env.NEXT_SECRET_YOUTUBE_API_KEY}`;
                let response = await axios.get(url)
                let { items } = response.data;
                data = items.map(video => {
                    const {
                        id, snippet: {title, description, publishedAt: pubDate, 
                        thumbnails:{standard}}, player: {embedHtml: content}
                    } = video;
                    return ({title, description, content, pubDate, image_url: standard?.url, id});
                })[0];
            } else {
                const url = `https://gipnews-default-rtdb.firebaseio.com/${process.env.NEXT_SECRET_FIREBASE_APIKEY}/${section.split(',')[0]}/${id}.json`
                data = (await axios.get(url)).data;
            }
        }
        sectionData = sectionData.concat(sectionData.splice(0,sectionData.indexOf(data)+1))
            .filter(dat => dat.image_url).map(data => ({...data, section, content: ''}))
        res.status(200).send({data: data ? {...data, section} : null, list: sectionData});
}))

module.exports = router;