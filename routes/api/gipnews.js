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
    res.status(200).send('success ' + new Date());
    let consol = '';
    try {
        consol = readFileSync('gipnews.txt') + '\n\n';
    } catch (e) {
        writeFileSync('gipnews.txt', consol);
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
                const ids = [17,24,25,28]
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
                consol += (section + ' ' + sectionData.length);
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
                            'colombopage','sportti','orissapost','allbanaadir','sundaymail','sundaynews',
                            'coinspeaker','arabnews','docbao','technobaboy','herald.co.zw','jamaica-gleaner',
                            'thezimbabwean.co','fiji'
                            ].filter(src => article.link.includes(src)).length) return false;
                        return (!(sectionData.map(data => data.title).includes(article.title)));
                    }).sort((a,b) => (new Date(b.pubDate) - (new Date(a.pubDate)))).slice(0,1);
                    consol += (section + ' ' + results.length) + ' ';
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
                            consol += (link.split('/')[2]) + ' - ';
                            consol += (title);
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
                            consol += '\n' + (`${ins += 1} - ${section}`)
                            
                            let xmap = '';
                            try {
                                xmap = readFileSync('gipXmap.xml');
                            } catch (error) { }
                            xmap += `<url>\n\ \ <loc>https://gipnews.vercel.app/${section}/${id}?title=${encodeURI(title.replace(/[\ \/\?\:\;\,\.\|]/g, '-'))}</loc>\n\ \ <lastmod>${(new Date()).toISOString()}</lastmod>\n\ \ <priority>0.64</priority>\n</url>\n`
                            writeFileSync('gipXmap.xml', xmap);

                            count += 1;
                        } else {
                            console.log('Escaped insertion: ' + section)
                        }
                    }
                }
            }
        } catch (error) { consol += (error) }
        writeFileSync('gipnews.txt', consol);
    // }
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
            const urls = [17,24,25,28].map(id => `https://youtube.googleapis.com/youtube/v3/videos?part=snippet&part=player&part=contentDetails&part=status&chart=mostPopular&maxResults=50&videoCategoryId=${id}&key=${process.env.YOUTUBE_API_KEY}`)
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
            //     const urls = [17,24,25,28].map(id => `https://youtube.googleapis.com/youtube/v3/videos?part=snippet&part=player&part=contentDetails&part=status&chart=mostPopular&maxResults=50&videoCategoryId=${id}&key=${process.env.YOUTUBE_API_KEY}`)
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

router.post('/mail', catchAsync(async (req, res) => {
    if (req.headers.id !== process.env.NEXT_SECRET_FIREBASE_APIKEY) {
        return res.status(400).send();
    }
    const urls = sects.slice(0,7).map(sec => `https://gipnews-default-rtdb.firebaseio.com/${process.env.NEXT_SECRET_FIREBASE_APIKEY}/${sec.split(',')[0]}.json?orderBy="pubDate"&limitToLast=3`)
    const newsSections = (await Promise.all(urls.map(url => axios.get(url)))).map(res => res.data);
    
    let nodeMailer = require('nodemailer');
    const transporter = nodeMailer.createTransport({
    host: "smtp.gmail.com", // hostname
    port: 465, // port for secure SMTP
    secure: true, // TLS requires secureConnection to be false
        auth: {
            user: 'gipnews4@gmail.com',
            pass: process.env.GIPNEWS_PASSWORD
        },
    });
    let mailOptions = {
        from: '"GIP News" <gipnews4@gmail.com>', // sender address
        to: 'gipteam@hotmail.com', // list of receivers
        // bcc: mails,
        subject: `News Headlines | ${(new Date()).toUTCString().slice(0,11)}`, // Subject line
        // text: 'hello', // plain text body
        html: `<section style="font-family: Arial, Helvetica, sans-serif; padding: 4px;">
            <header style="text-align: center; background-color: rgba(64, 64, 64, 0.1); border-radius: 4px; padding: 4px; ">
            <img style="opacity: 0.5; border-radius: 50%;" width="72px" height="72px" src="https://gipnews.vercel.app/favicon.ico" alt="GIP News">
            </header>
            <h2 style="text-align: center;">Top headlines</h2>
            <p style="padding: 6px;">
            <em>What's happening around the world today, ${(new Date()).toUTCString().slice(0,16)}</em>
            </p>
            <p style="font-size: 14px; font-weight: 600; color: #666; line-height: 40px; text-align: justify;">
                ${newsSections.map((newsSection, i) => {
                    // const heading = sects[newsSections.indexOf(newsSection)] == 'world' ? '': `<h3 style="text-decoration: 'underline';">${sects[newsSections.indexOf(newsSection)].toUpperCase()}</h3>`;
                    let list = [];
                    for (let key in newsSection) {
                        list.push(`
                            <a href="https://gipnews.vercel.app/${sects[newsSections.indexOf(newsSection)]}/${key}">${newsSection[key].title}</a>
                            <span style="font-size: 10px; font-weight: 400; color: #333;"></span><br>
                            <span  style="font-weight: 400;">${newsSection[key].description}</span>
                        `)
                    }
                    return list.join('<br>');
                }).join(' <br> ')} 
                <br><br><p style="text-align: center; margin: 0; padding: 0; font-size: small;">
                <a href="https://gipnews.vercel.app/newsletter">Switch/cancel subscription</a></p><br>
            </p><hr>
            <footer style="text-align: center;">
            <a href="https://gipnews.vercel.app"><img style="width: 26px; padding-right: 16px;" src="https://gipnews.vercel.app/favicon.ico" alt="GIP News"></a>
            <a href="https://web.facebook.com/godinprints"><img style="width: 26px; padding-right: 16px;" src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2021_Facebook_icon.svg/2048px-2021_Facebook_icon.svg.png" alt="GodInPrints facebook"></a>
            <a href="https://godinprints.org"><img style="width: 32px;" src="https://godinprints.org/assets/images/burningBook.jfif" alt="God in prints"></a>
            </footer>
            <em style="width: 100%; display: block; text-align: center; font-size: small; padding-top: 16px;">
            &copy; 2023 GIP Library
            </em></section>`
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.log(error) 
        console.log(info)
    });
    res.status(200).send('success');
}))

router.post('/xml', async (req, res) => {
    try {
        if (req.headers.id !== process.env.NEXT_SECRET_FIREBASE_APIKEY) {
            return res.status(400).send();
        }
        let xmap = '';
        for (let sect of sects) {
            if (sect == 'reel') continue;
            console.log(sect)
            const ids = (await axios.get(`https://gipnews-default-rtdb.firebaseio.com/${process.env.NEXT_SECRET_FIREBASE_APIKEY}/${sect.split(',')[0]}.json?shallow=true`)).data;
            for (let id in ids) {
                const title = (await axios.get(`https://gipnews-default-rtdb.firebaseio.com/${process.env.NEXT_SECRET_FIREBASE_APIKEY}/${sect.split(',')[0]}/${id}/title.json?shallow=true`)).data;
                // console.log(title)
                xmap += `<url>\n\ \ <loc>https://gipnews.vercel.app/${sect}/${id}?title=${encodeURI(title.replace(/[\ \/\?\:\;\,\.\|]/g, '-'))}</loc>\n\ \ <lastmod>2023-04-18T10:14:22+00:00</lastmod>\n\ \ <priority>0.64</priority>\n</url>\n`
            }
        }
        writeFileSync('gipXmap.xml', xmap);
    } catch (error) {
        console.log(error);
        return res.status(400).send('error!')
    }
    res.status(200).send('DONE!')
})

module.exports = router;