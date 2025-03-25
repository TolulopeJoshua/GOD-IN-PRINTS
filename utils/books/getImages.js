require("dotenv").config();

const sharp = require("sharp");

const mongoose = require("mongoose");

const Book = require("../../models/book");

const { getImage, putImage } = require("../../functions");

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
  const books = await Book.find({});
  for (let book of books) {
    if (book.image.key !== "none" && book.image["160"] === "none") {
      console.log(book.title);
      const image = await getImage(book.image.key);
      const buffer = await transform(image.Body, 160, null);
      const newKey = book.image.key.replace(".jpg", "-160.webp");
      await putImage(newKey, buffer);
      book.image["160"] = newKey;
      await book.save();
    }
  }
}

async function transform(image, width, height) {
  const buffer = await sharp(image)
    .resize(width, height)
    .webp()
    .toBuffer();
  return buffer;
};
