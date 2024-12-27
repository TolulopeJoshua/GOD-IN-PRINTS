const express = require("express");
const axios = require("axios");
const router = express.Router();

const catchAsync = require("../../utils/catchAsync");

const refresher = require("./utils/gipnews-sections-refresher");
const { dateDesc, noimage } = require("./utils/sorters");

const sects = [
  "world",
  "sports",
  "business",
  "health",
  "top",
  "science,technology",
  "entertainment",
  "reel",
];

router.post(
  "/refresh",
  catchAsync(async (req, res) => {
    if (req.headers.id !== process.env.NEXT_SECRET_FIREBASE_APIKEY) {
      return res.status(400).send();
    }
    res.status(200).send("success " + new Date());

    const section = req.query.section.split(",")[0];
    await refresher[section]();
  })
);

router.get(
  "/data",
  catchAsync(async (req, res) => {
    const data = {};
    const urls = sects.map((sec) => dbUrl(sec, 20));
    // console.log(urls);
    const newsSections = (
      await Promise.all(urls.map((url) => axios.get(url)))
    ).map((res) => res.data);
    for (const newsSection of newsSections) {
      const section = sects[newsSections.indexOf(newsSection)];
      const sectionData = Object.values(newsSection);
      data[section] = sectionData
        .sort(dateDesc)
        .sort(noimage)
        .map((art) => ({ ...art, section }));
    }
    res.status(200).send(data);
  })
);

router.get(
  "/:section",
  catchAsync(async (req, res) => {
    let reel = [];
    const { section } = req.params;
    const sectionIndex = sects.indexOf(section);

    const url = dbUrl(section);
    const newsSection = (await axios.get(url)).data;

    const sectionData = Object.values(newsSection)
      .sort(dateDesc)
      .sort(noimage)
      .slice(0, 100)
      .map((art) => ({ ...art, section, content: "" }));

    const featuresData = sects.map((section) => axios.get(dbUrl(section, 10)));
    
    const features = (await Promise.all(featuresData))
      .map(
        ({ data }, index) => {
          const section = sects[index];
          data = Object.values(data).sort(dateDesc).sort(noimage);
          if (section == "reel") {
            reel = data.slice(1, 5).map((vid) => ({ ...vid, section }));
          }
          return { ...data[0], section, content: "" };
        }
      )
      .filter((_, index) => index != sectionIndex);

    res.status(200).send({
      data: sectionData,
      features,
      reel,
    });
  })
);

router.get(
  "/:section/:id",
  catchAsync(async (req, res) => {
    const { section, id } = req.params;
    const url = dbUrl(section, 105);
    const newsSection = (await axios.get(url)).data;

    let sectionData = Object.values(newsSection).sort(dateDesc);

    const data = sectionData.find((art) => art.id == id);
    sectionData = !data ? sectionData : sectionData
      .concat(sectionData.splice(0, sectionData.indexOf(data) + 1))
      .filter((dat) => dat.image_url)
      .map((data) => ({ ...data, section, content: "" }));

    res
      .status(200)
      .send({ data: data && { ...data, section }, list: sectionData });
  })
);

module.exports = router;

function dbUrl(section, limit = 100, id) {
  return `https://gipnews-default-rtdb.firebaseio.com/${
    process.env.NEXT_SECRET_FIREBASE_APIKEY
  }/${section.split(",")[0]}${id ? "/" + id : ""}.json?orderBy="pubDate"&limitToLast=${limit}`;
}
