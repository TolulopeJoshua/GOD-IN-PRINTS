require('dotenv').config();

const mongoose = require('mongoose');

const Doc = require('./models/doc');
const Book = require('./models/book');

const fse = require('fs-extra');

const { getImage } = require("./functions");

const dbUrl = process.env.DB_URL; 
mongoose.connect(dbUrl, {
    useNewUrlParser: true, 
    useUnifiedTopology: true,
});
 
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:")); 
db.once("open", async () => {
    console.log("Database connected"); 
    fse.removeSync('backups')
    await getBackup();
    mongoose.disconnect();
    db.off();
});

async function getBackup() {
    const docs = await Doc.find({});
    for (let index = 0; index < docs.length; index++) {
        console.log(`docs - ${index} of ${docs.length}`);
        const doc = docs[index] || null;
        if (doc && doc.image.key !== 'none') {
            console.log(doc.image.key);
            const imgPath = 'backups/' + doc.image.key;
            const data = await getImage(doc.image.key);
            await fse.outputFile(imgPath, data.Body);
        }
    }
    const books = await Book.find({});
    for (let index = 0; index < books.length; index++) {
        console.log(`books - ${index} of ${books.length}`);
        const book = books[index] || null;
        if (book) {
            console.log(book.document.key);
            const data = await getImage(book.document.key);
            const pdfPath = 'backups/' + book.document.key;
            await fse.outputFile(pdfPath, data.Body);
            if (book.image.key !== 'none') {
                console.log(book.image.key);
                const imgPath = 'backups/' + book.image.key;
                const data = await getImage(book.image.key);
                await fse.outputFile(imgPath, data.Body);
            }
        }
    }
}
