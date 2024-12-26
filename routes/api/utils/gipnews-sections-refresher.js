if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const axios = require("axios");

const options = (url, key, otherParams = {}) => ({
  method: "GET",
  url,
  params: { languages: "en", ...otherParams },
  headers: {
    "X-RapidAPI-Key": process.env.NEXT_SECRET_C1, // key,
    "X-RapidAPI-Host": url.slice(8).split(".com")[0] + ".com",
  },
});

const dbUrl = (section) =>
  `https://gipnews-default-rtdb.firebaseio.com/${process.env.NEXT_SECRET_FIREBASE_APIKEY}/${section}.json?`;

const getSection = async (section) => {
  const url = dbUrl(section);
  const { data } = await axios.get(url);
  return Object.values(data).sort(
    (a, b) => new Date(b.pubDate) - new Date(a.pubDate)
  );
};

const putSection = async (section, news) => {
  const url = dbUrl(section);
  await axios.put(url, Object.fromEntries(news.map((n) => [n.id, n])));
};

const extract = async (urls, key) => {
  const eUrl = "https://extract-news.p.rapidapi.com/v0/article";

  const news = [];
  for (const url of urls) {
    try {
      const {
        data: { article },
      } = await axios(options(eUrl, key, { url }));
      if (!(article.meta_image && (article.meta_description || article.text))) {
        continue;
      }
      news.push({
        title: article.title,
        link: url,
        description: article.meta_description,
        content: article.text,
        pubDate: article.published || new Date().toISOString(),
        image_url: article.meta_image,
        id: Date.now(),
      });
    } catch (error) {
      console.log(error.response.data.message);
    }
  }
  return news;
};

const getWorld = async () => {
  const url = "https://news67.p.rapidapi.com/v2/trending";
  const key = process.env.NEXT_SECRET_C4;

  const old = await getSection("world");

  const { data } = await axios(options(url, key));
  const links = data.news
    .map((cluster) => cluster.News)
    .flat()
    .sort((a, b) => new Date(b.PublishedOn) - new Date(a.PublishedOn))
    .filter((news) => !old.some((o) => o.link === news.Url))
    .map((news) => news.Url)
    .slice(0, 5);

  const news = await extract(links, key);
  await putSection("world", [...news, ...old].slice(0, 100));
};

const getSports = async () => {
  const url = "https://sportsdaily.p.rapidapi.com/api/sports/news/";
  const key = process.env.NEXT_SECRET_C3;

  const old = await getSection("sports");

  const { data } = await axios(options(url, key, { language: "en" }));
  const links = data.results
    .sort((a, b) => new Date(b.published) - new Date(a.published))
    .filter((news) => !old.some((o) => o.link === news.source_url))
    .map((news) => news.source_url)
    .slice(0, 5);

  const news = await extract(links, key);
  await putSection("sports", [...news, ...old].slice(0, 100));
};
// getSports();

const getBusiness = async () => {
  const url = "https://biztoc.p.rapidapi.com/news/source/bbc";
  const key = process.env.NEXT_SECRET_C2;

  const old = await getSection("business");

  const { data } = await axios(options(url, key, { language: "en" }));
  const links = data
    .sort((a, b) => new Date(b.published) - new Date(a.published))
    .filter((news) => !old.some((o) => o.link === news.url))
    .map((news) => news.url)
    .slice(0, 5);

  const news = await extract(links, key);
  await putSection("business", [...news, ...old].slice(0, 100));
};

const getHealth = async () => {
  const url = "https://newsapi90.p.rapidapi.com/topic/health";
  const key = process.env.NEXT_SECRET_C1;

  const old = await getSection("health");

  const { data } = await axios(options(url, key, { language: "en" }));
  const links = data
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .filter((news) => !old.some((o) => o.link === news.link))
    .map((news) => news.link)
    .slice(0, 5);

  const news = await extract(links, key);
  await putSection("health", [...news, ...old].slice(0, 100));
};

const getTop = async () => {
  const url = "https://news67.p.rapidapi.com/v2/feed";
  const key = process.env.NEXT_SECRET_C4;

  const old = await getSection("top");

  const { data } = await axios(options(url, key));
  const links = data.news
    .sort((a, b) => new Date(b.PublishedOn) - new Date(a.PublishedOn))
    .filter((news) => !old.some((o) => o.link === news.Url))
    .map((news) => news.Url)
    .slice(0, 5);

  const news = await extract(links, key);
  await putSection("top", [...news, ...old].slice(0, 100));
};

const getScience = async () => {
  const url = "https://technology-news3.p.rapidapi.com/news";
  const key = process.env.NEXT_SECRET_C2;

  const old = await getSection("science");

  const { data } = await axios(options(url, key, { language: "en" }));
  const links = data
    .filter((news) => !old.some((o) => o.link === news.url))
    .map((news) => news.url)
    .slice(0, 5);

  const news = await extract(links, key);
  await putSection("science", [...news, ...old].slice(0, 100));
};

const getEntertainment = async () => {
  const url = "https://cnn-api1.p.rapidapi.com/category";
  const key = process.env.NEXT_SECRET_C3;

  const old = await getSection("entertainment");

  const { data } = await axios(
    options(url, key, { url: "https://edition.cnn.com/entertainment" })
  );
  const links = data
    .filter((news) => !old.some((o) => o.link === news.link))
    .map((news) => news.link)
    .slice(0, 5);

  const news = await extract(links, key);
  await putSection("entertainment", [...news, ...old].slice(0, 100));
};

const getReel = async () => {
  const ids = [17, 24, 25, 28];
  const urls = ids.map(
    (id) =>
      `https://youtube.googleapis.com/youtube/v3/videos?part=snippet&part=player&part=contentDetails&part=status&chart=mostPopular&maxResults=50&videoCategoryId=${id}&key=${process.env.YOUTUBE_API_KEY}`
  );

  const responses = await Promise.all(urls.map((url) => axios.get(url)));
  let items = responses.map((res) => res.data.items).flat();
  items = items
    .filter(({ contentDetails }) => !contentDetails.regionRestriction)
    .map((video) => ({
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      content: video.player.embedHtml,
      pubDate: video.snippet.publishedAt,
      image_url: video.snippet.thumbnails.standard?.url,
    }))
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, 100);

  await putSection("reel", items);
};


module.exports = {
  world: getWorld,
  sports: getSports,
  business: getBusiness,
  health: getHealth,
  top: getTop,
  science: getScience,
  entertainment: getEntertainment,
  reel: getReel,
}
