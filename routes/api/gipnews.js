const express = require("express");
const router = express.Router();
const catchAsync = require("../../utils/catchAsync");

const refresher = require("./utils/gipnews-sections-refresher");

const axios = require("axios");
const { writeFileSync } = require("fs");
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
    const urls = sects.map((sec) => dbUrl(sec));
    console.log(urls);
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

    const url = dbUrl(section);
    const newsSection = (await axios.get(url)).data;

    const sectionData = Object.values(newsSection)
      .sort(dateDesc)
      .sort(noimage)
      .slice(0, 100)
      .map((art) => ({ ...art, section, content: "" }));

    const featuresData = sects
      .filter((sect) => sect != section)
      .map((section) => axios.get(dbUrl(section, 10)));

    const features = (await Promise.all(featuresData)).map(
      ({ data }, index) => {
        const section = sects[index];
        data = Object.values(data).sort(noimage);
        if (section == "reel") {
          reel = data.slice(1, 5).map((vid) => ({ ...vid, section }));
        }
        return { ...data[0], section, content: "" };
      }
    );

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

router.post(
  "/mail",
  catchAsync(async (req, res) => {
    // return res.status(200).send('success ' + new Date());
    if (req.headers.id !== process.env.NEXT_SECRET_FIREBASE_APIKEY) {
      return res.status(400).send();
    }
    const urls = sects
      .slice(0, 7)
      .map(
        (sec) =>
          `https://gipnews-default-rtdb.firebaseio.com/${
            process.env.NEXT_SECRET_FIREBASE_APIKEY
          }/${sec.split(",")[0]}.json?orderBy="pubDate"&limitToLast=3`
      );
    const newsSections = (
      await Promise.all(urls.map((url) => axios.get(url)))
    ).map((res) => res.data);

    let nodeMailer = require("nodemailer");
    const transporter = nodeMailer.createTransport({
      host: "smtp.gmail.com", // hostname
      port: 465, // port for secure SMTP
      secure: true, // TLS requires secureConnection to be false
      auth: {
        user: "gipnews4@gmail.com",
        pass: process.env.GIPNEWS_PASSWORD,
      },
    });
    let mailOptions = {
      from: '"GIP News" <gipnews4@gmail.com>', // sender address
      to: "gipteam@hotmail.com", // list of receivers
      // bcc: mails,
      subject: `News Headlines | ${new Date().toUTCString().slice(0, 11)}`, // Subject line
      // text: 'hello', // plain text body
      html: `<section style="font-family: Arial, Helvetica, sans-serif; padding: 4px;">
            <header style="text-align: center; background-color: rgba(64, 64, 64, 0.1); border-radius: 4px; padding: 4px; ">
            <img style="opacity: 0.5; border-radius: 50%;" width="72px" height="72px" src="https://gipnews.vercel.app/favicon.ico" alt="GIP News">
            </header>
            <h2 style="text-align: center;">Top headlines</h2>
            <p style="padding: 6px;">
            <em>What's happening around the world today, ${new Date()
              .toUTCString()
              .slice(0, 16)}</em>
            </p>
            <p style="font-size: 14px; font-weight: 600; color: #666; line-height: 40px; text-align: justify;">
                ${newsSections
                  .map((newsSection, i) => {
                    // const heading = sects[newsSections.indexOf(newsSection)] == 'world' ? '': `<h3 style="text-decoration: 'underline';">${sects[newsSections.indexOf(newsSection)].toUpperCase()}</h3>`;
                    let list = [];
                    for (let key in newsSection) {
                      list.push(`
                            <a href="https://gipnews.vercel.app/${
                              sects[newsSections.indexOf(newsSection)]
                            }/${key}">${newsSection[key].title}</a>
                            <span style="font-size: 10px; font-weight: 400; color: #333;"></span><br>
                            <span  style="font-weight: 400;">${
                              newsSection[key].description
                            }</span>
                        `);
                    }
                    return list.join("<br>");
                  })
                  .join(" <br> ")} 
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
            </em></section>`,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.log(error);
      console.log(info);
    });
    res.status(200).send("success");
  })
);

router.post("/xml", async (req, res) => {
  // return res.status(200).send('success ' + new Date());
  try {
    if (req.headers.id !== process.env.NEXT_SECRET_FIREBASE_APIKEY) {
      return res.status(400).send();
    }
    let xmap = "";
    for (let sect of sects) {
      if (sect == "reel") continue;
      console.log(sect);
      const ids = (
        await axios.get(
          `https://gipnews-default-rtdb.firebaseio.com/${
            process.env.NEXT_SECRET_FIREBASE_APIKEY
          }/${sect.split(",")[0]}.json?shallow=true`
        )
      ).data;
      for (let id in ids) {
        const title = (
          await axios.get(
            `https://gipnews-default-rtdb.firebaseio.com/${
              process.env.NEXT_SECRET_FIREBASE_APIKEY
            }/${sect.split(",")[0]}/${id}/title.json?shallow=true`
          )
        ).data;
        // console.log(title)
        xmap += `<url>\n\ \ <loc>https://gipnews.vercel.app/${sect}/${id}?title=${encodeURI(
          title.replace(/[\ \/\?\:\;\,\.\|]/g, "-")
        )}</loc>\n\ \ <lastmod>2023-04-18T10:14:22+00:00</lastmod>\n\ \ <priority>0.64</priority>\n</url>\n`;
      }
    }
    writeFileSync("gipXmap.xml", xmap);
  } catch (error) {
    console.log(error);
    return res.status(400).send("error!");
  }
  res.status(200).send("DONE!");
});

function dbUrl(section, limit = 100, id) {
  return `https://gipnews-default-rtdb.firebaseio.com/${
    process.env.NEXT_SECRET_FIREBASE_APIKEY
  }/${section.split(",")[0]}${id ? "/" + id : ""}.json?orderBy="pubDate"&limitToLast=${limit}`;
}

module.exports = router;
