
const { writeFileSync, readFileSync } = require('fs');
const { default: axios } = require('axios');
const limits = require('./limits');
const moment = require('moment');


function sortVideos(req) {
    const allVideos = require('./all_videos.json');
    const td = require("tinyduration")
    const { lookup } = require('geoip-lite');

    let filteredVideos = allVideos.filter(video => {
        try {
            let { hours, minutes, seconds } = td.parse(video.contentDetails.duration);
            hours = hours ? hours.toString() : '';
            minutes = minutes ? minutes > 9 ? minutes.toString() : `0${minutes}` : '00';
            seconds = seconds ? seconds > 9 ? seconds.toString() : `0${seconds}` : '00';
            video.duration = {hours, minutes, seconds};
            video.views = video.statistics.viewCount >= 1000000 ? (Math.round(video.statistics.viewCount / 100000) / 10) + 'M' : (Math.round(video.statistics.viewCount / 100) / 10) + 'K';
            video.embeddable = video.status.embeddable;
            video.forKids = video.status.madeForKids;
            video.published = moment(video.snippet.publishedAt).fromNow();
            video.availableInCountry = true;
            const country = req && lookup(req.headers['x-forwarded-for'] || req.connection.remoteAddress)?.country;
            if (country && video.contentDetails.regionRestriction) {
                video.country = country;
                if (video.contentDetails.regionRestriction.allowed && !video.contentDetails.regionRestriction.allowed.includes(country)) video.availableInCountry = false;
                if (video.contentDetails.regionRestriction.blocked && video.contentDetails.regionRestriction.blocked.includes(country)) video.availableInCountry = false;
            }
            if (video.contentDetails.regionRestriction && video.contentDetails.regionRestriction.allowed && video.contentDetails.regionRestriction.allowed.length < 15) return false;
            if (video.contentDetails.regionRestriction && video.contentDetails.regionRestriction.blocked && video.contentDetails.regionRestriction.blocked.length > 30) return false;
            return JSON.stringify(video.snippet.thumbnails) != '{}' && video.snippet.defaultLanguage === 'en' && (parseInt(video.duration.hours) > 0 || parseInt(video.duration.minutes) >= 30);
        } catch (error) {
            // console.log(error) 
            return false;
        }
    })
    filteredVideos = [...new Set(filteredVideos.map(video => JSON.stringify(video)))].map(video => JSON.parse(video));
    const orderedByDate = filteredVideos.sort((a,b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt));

    let prev = [], classesMovies = {};
    for (let limit in limits.videos) {
        let classMovies = orderedByDate.filter((_, index) => index % 100 < limits.videos[limit]);
        if (prev.length) {
            classMovies = classMovies.filter(movie => !prev.includes(JSON.stringify(movie)));
        }
        classesMovies[limit] = [...new Set(classMovies.map(video => JSON.stringify(video)))].map(video => JSON.parse(video));
        prev = [...prev, ...new Set(classMovies.map(video => JSON.stringify(video)))];
    }
    classesMovies.classic = classesMovies.classic.filter(movie => movie.embeddable);
    
    const userStatus = req?.user?.subscription.status || 'classic';
    let userMovies = orderedByDate.filter((_, index) => index % 100 < limits.videos[userStatus]);
    // userMovies = userMovies.filter(movie => !['Bm0gGEZXAbo', 'sc8qQKxdTnA', '7Wv8Mz9VXSo', 'QrQVzDTa5Bc', 'QHULfBhM4dU', 'mpwgeE7koPE', 'Xdx-qAgySwQ', 'GykgCvYsNJw', 'E_8cFo_MXpU'].includes(movie.id))
    const n = userStatus == 'classic' ? 7 : userStatus == 'premium' ? 10 : 9;
    const userFeatures = userMovies.filter(movie => movie.embeddable && movie.availableInCountry && !movie.forKids).sort(() => 0.5 - Math.random()).slice(0, n).concat([null, null, null]).slice(0,10).sort(() => 0.5 - Math.random());
 
    const playlists = require('./video_ids.json'); 
    const userPlaylists = playlists.map(playlist => {
        const videos = userMovies.map(movie => playlist.ids.includes(movie.id) ? movie : null).filter(movie => movie != null && movie.embeddable && !movie.forKids);
        return { name: playlist.name, videos };
    })
    const forKids = userMovies.filter(movie => movie.forKids && movie.embeddable);
    userPlaylists.push({name: 'For Kids', videos: forKids}); 
    const nonEmbeddable = userMovies.filter(movie => !movie.embeddable);
    nonEmbeddable.length && userStatus != 'classic' && userPlaylists.push({name: 'Watch on Youtube', videos: nonEmbeddable});

    return { videos: orderedByDate, userMovies, userFeatures, userPlaylists, classesMovies };
}

function getRandomMovies(n=1, req=null) {
    const userStatus = req?.user?.subscription.status || 'classic';
    const classesMovies = require('./classes_videos.json'); 
    return classesMovies[userStatus]
        .filter(movie => movie.embeddable && movie.availableInCountry && !movie.forKids)
        .sort(() => 0.5 - Math.random()).slice(0, n);
}

async function getVideoIdsFromVideoPlaylists(res) {
    let videoIds = []; 
    let videoPlaylists = require('./video_playlists.json');
    for (vp of videoPlaylists) {
        console.log(vp.name)
        let list = {name: vp.name, ids: []};
        for (li of vp.lists) {
            try {
                let result = await axios.get(`https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${li}&key=${process.env.YOUTUBE_API_KEY}`)
                data = result.data;
                data.items.forEach(item => {
                    list.ids.push(item.snippet.resourceId.videoId);
                })
                while(data.nextPageToken) {
                    result = await axios.get(`https://youtube.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&pageToken=${data.nextPageToken}&playlistId=${li}&key=${process.env.YOUTUBE_API_KEY}`)
                    data = result.data;
                    data.items.forEach(item => {
                        list.ids.push(item.snippet.resourceId.videoId);
                    })
                }
            } catch (error) {
                console.log(li, error);
            }
        }
        videoIds.push(list);
    }
    res && res.status(200).send(videoIds);
    writeFileSync('utils/lib/video_ids.json', JSON.stringify(videoIds));
    return;
}

async function getAllVideosFromVideoIds(res) {
    const listIds = require('./video_ids.json');
    const allIds = listIds.reduce((all, list) => all.concat(list.ids), []);
    let allVideos = [];
    for (let i = 0; i < allIds.length; i += 50) {
        try {
            const fifty = allIds.slice(i, i + 50);
            const url = `https://youtube.googleapis.com/youtube/v3/videos?part=id&part=snippet&part=contentDetails&part=status&part=statistics&part=player&part=topicDetails${fifty.map(id => `&id=${id}`).join('')}&maxResults=50&key=${process.env.YOUTUBE_API_KEY}`
            const { data } = await axios.get(url);
            console.log(data.items.length);
            data.items.forEach(item => allVideos.push(item));
            if (data.pageInfo.totalResults != data.pageInfo.resultsPerPage) console.log('something went wrong');
        } catch (error) {
            console.log(i, error);
        }
    }
    console.log('total: ', allVideos.length);
    writeFileSync('utils/lib/all_videos.json', JSON.stringify(allVideos));
    const { videos, classesMovies } = sortVideos();
    console.log('filtered: ', videos.length);
    res && res.json(videos);
    writeFileSync('utils/lib/all_videos.json', JSON.stringify(videos));
    writeFileSync('utils/lib/classes_videos.json', JSON.stringify(classesMovies));
    return;
}

module.exports = {getRandomMovies, sortVideos, getAllVideosFromVideoIds, getVideoIdsFromVideoPlaylists}