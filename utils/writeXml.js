if(process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const Doc = require("../models/doc");
const Book = require("../models/book");

const { connect } = require("./main/db");
const fs = require("fs-extra");
const path = require("path");

connect()
    .then(async () => {
        const section = process.argv[2] || "all";
        await sections[section].write();
        process.exit(0);
    });

const sections = {
    books: {
        name: "Books",
        write: booksXml,
    },
    articles: {
        name: "Articles",
        write: articlesXml,
    },
    arts: {
        name: "Articles",
        write: articlesXml,
    },
    biographies: {
        name: "Biographies",
        write: biographiesXml,
    },
    bios: {
        name: "Biographies",
        write: biographiesXml,
    },
    all: {
        name: "All",
        write: allXml,
    }
}

async function allXml() {
    await booksXml();
    await articlesXml();
    await biographiesXml();
}

async function booksXml() {
  const books = await Book.find({});
    const urls = books.map(book => `https://godinprints.org/books/2/${encodeURIComponent(
        book.uid
      ).replace(/\'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29")}`);
    write(urls, sections.books.name);
};

async function articlesXml() {
    const arts = await Doc.find({docType: 'article'});
    const urls = arts.map(art => `https://godinprints.org/articles/2/${encodeURIComponent(
        art.uid
      ).replace(/\'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29")}`);
    write(urls, sections.articles.name);
};

async function biographiesXml() {
    const bios = await Doc.find({docType: 'biography'});
    const urls = bios.map(bio => `https://godinprints.org/biographies/2/${encodeURIComponent(
        bio.uid
      ).replace(/\'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29")}`);
    write(urls, sections.biographies.name);
};

function write(urls, name) {
    const filePath = path.join(__dirname, "../public/sitemap.xml");
    const xml = fs.readFileSync(filePath, "utf8");
    const startText = `<!-- ${name.toUpperCase()} START -->`;
    const endText = `<!-- ${name.toUpperCase()} END -->`;
    const start = xml.indexOf(startText) + startText.length;
    const end = xml.indexOf(endText);
    const newUrls = urls.map(url => `\n<url>\n\ \ <loc>${url}</loc>\n\ \ <lastmod>${new Date().toISOString()}</lastmod>\n\ \ <priority>0.64</priority>\n</url>`).join("") + "\n"; 
    const updatedXml = xml.substring(0, start) + newUrls + xml.substring(end);
    fs.writeFileSync(filePath, updatedXml, "utf8");
    console.log(`${name} xmls written successfully`);
}