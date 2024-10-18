require("dotenv").config();

const mongoose = require("mongoose");

const Book = require("../../models/book");

const fs = require("fs");

const { getImage, uploadCompressedImage, deleteImage } = require("../../functions");

const dbUrl = process.env.DB_URL;
mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", async () => {
  console.log("Database connected");
  await run();
  mongoose.disconnect();
  process.exit();
});

async function run() {
  const pdfConverter = require("pdf-poppler");
  const books = await Book.find({});
  let pdfPath, option;
  for (let index = 0; index < books.length; index++) {
    if ([823, 148, 1106].includes(index)) continue;
    const book = books[index] || null;
    if (book && !book.image.previews.length) {
      console.log(index, book.title);
      let files = fs.readdirSync("uploads");
      for (const file of files) {
        fs.unlinkSync(`uploads/${file}`);
      }
      try {
        const data = await getImage(book.document.key);
        fs.writeFileSync("output.pdf", data.Body);
        pdfPath = "output.pdf";
        const info = await pdfConverter.info(pdfPath);
        const length = parseInt(info.pages) >= 10 ? 10 : parseInt(info.pages);
        for (let i = 1; i <= length; i++) {
          option = {
            format: "jpeg",
            out_dir: "uploads",
            out_prefix: `preview-${book.title.replace(/:/g, "-")}`, // path.basename(pdfPath, path.extname(pdfPath)),
            page: i,
          };
          await pdfConverter.convert(pdfPath, option);
        }
        files = fs.readdirSync("uploads");
        for (const file of files) {
          await uploadCompressedImage(`uploads/${file}`, `book-img/${file}`);
          book.image.previews.push(`book-img/${file}`);
        }
        await book.save();
      } catch (error) {
        console.log(error);
      }
    }
  }
  console.log("success");
}
