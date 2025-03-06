const Doc = require("../models/doc");
const Book = require("../models/book");
const Review = require("../models/review");
const User = require("../models/user");
const BookTicket = require("../models/bookTicket");

const fs = require("fs-extra");
const path = require("path");

const {
  getImage,
  s3,
  paginate,
  uploadCompressedImage,
  encode,
  putImage,
} = require("../functions");
const ExpressError = require("../utils/ExpressError");
const capitalize = require("../utils/capitalize");
const sanitize = require("sanitize-html");

const categories = [
  "Evangelism",
  "Prayer",
  "Marriage/Family",
  "Dating/Courtship",
  "Devotion",
  "Commitment/Consecration",
  "Grace/Conversion",
  "Afterlife",
  "Growth/Development",
  "Money/Wealth",
  "Biography",
];

module.exports.index = async (req, res) => {
  let books;
  // let sessData = req.session;
  // if (sessData.featureBooks && !req.query.refresh) {
  //     books = sessData.featureBooks;
  // } else {
  books = await Book.aggregate([
    { $match: { filetype: "pdf", isApproved: true } },
    { $sample: { size: 20 } },
  ]);
  //     sessData.featureBooks = books;
  //     if (req.query.refresh) return res.redirect('/books');
  // }
  const title = "Feature Books on Christian Faith - Free pdf download";
  res.render("books/index", { books, title });
};

module.exports.list = async (req, res) => {
  const books = await Book.find({ isApproved: true }).sort({ title: 1 });
  const [pageDocs, pageData] = paginate(req, books);
  const title = "List of Books on Christian Faith - Free pdf download";
  res.render("books/list", {
    category: "All Books",
    books: pageDocs,
    pageData,
    title,
  });
};

module.exports.random = async (req, res) => {
  const [random] = await Book.aggregate([
    { $match: { filetype: "pdf", isApproved: true } },
    { $sample: { size: 1 } },
  ]);
  res.status(200).send(random);
};

module.exports.categories = (req, res) => {
  const title = "GIP Library - Books Categories";
  res.render("books/categories", { categories, title });
};

module.exports.perCategory = async (req, res) => {
  const { category } = req.query;
  const allBooks = await Book.find({ isApproved: true }).sort({ name: 1 });
  let books = [];
  for (let book of allBooks) {
    for (let word of words(category)) {
      const title = book.title.toLowerCase();
      if (title.includes(word) && !books.includes(book)) {
        books.push(book);
      }
    }
  }
  const [pageDocs, pageData] = paginate(req, books);
  const title = `Books on ${category} - Free pdf download`;
  res.render("books/list", { category, books: pageDocs, pageData, title });

  function words(category) {
    const word = category.toLowerCase().replace(/ /g, "/");
    return word.split("/");
  }
};

module.exports.renderNewForm = async (req, res) => {
  const title = "Post a Book";
  let booktitle = "";
  if (req.query.requestId) {
    const request = await Review.findById(req.query.requestId);
    booktitle = request.text;
  }
  res.render("books/new", { booktitle, title });
};

module.exports.createBook = async (req, res) => {
  if (!req.file) throw new ExpressError("No file attached!", 400);
  const path = require("path");
  const filetypes = /pdf|mobi|epub|docx/;
  const extname = filetypes.test(
    path.extname(req.file.originalname).toLowerCase()
  );
  const mimetype = filetypes.test(req.file.mimetype);
  if (!mimetype || !extname) {
    fs.unlinkSync(`uploads/${req.file.originalname}`);
    throw new ExpressError(
      "Allowed file extensions - PDF | MOBI | EPUB | DOCX",
      400
    );
  }

  const book = new Book(req.body.book);
  const { size } = req.file;
  const key = "book/" + Date.now().toString() + "_" + req.file.originalname;
  book.document = { key, size };
  book.title = book.title.toUpperCase();
  book.uid = book.title.toLowerCase().replace(/ /g, "-");
  book.author = book.author.toLowerCase();
  book.contributor = req.user._id;
  book.filetype = req.file.mimetype.split("/")[1];
  book.datetime = Date.now();

  const myBuffer = fs.readFileSync(`uploads/${req.file.originalname}`);
  await putImage(key, myBuffer);
  await book.save();
  fs.unlinkSync(`uploads/${req.file.originalname}`);
  req.flash(
    "success",
    `${book.title.toUpperCase()} saved, kindly upload front-page image.`
  );
  res.redirect(`/books/${book._id}/imageUpload`);

  if (req.query.requestId) {
    const request = await Review.findById(req.query.requestId).populate(
      "author"
    );
    request.likes[0] = req.user._id;
    await request.save();
    let mailOptions = {
      from: '"God-In-Prints Libraries" <godinprintslibraries@gmail.com>',
      to: [request.author.email, "gipteam@hotmail.com"],
      subject: "Book Request",
      html: `<p>Hello ${request.author.firstName.toUpperCase()},<p/><br>
              <p>Your request for the book - <b>${
                request.text
              }</b> has been responded to. 
              Kindly check out the resource at <br>https://godinprints.org/books/${
                book._id
              }.<p/><br>
              Copy the resource link and paste in your browser.<br><p>Regards,<p/><br><b>GIP Library</b>`,
    };
    const { transporter } = require("../functions");
    transporter.sendMail(mailOptions);
  }
};

module.exports.readOnline = async (req, res) => {
  const id = req.params.id;
  const book = await Book.findById(id);
  if (!book) {
    req.flash("error", "Book not found.");
    return res.redirect("/books?refresh=1");
  }
  const data = await getImage(book.document.key);
  const pdfPath = "public/pdfs";
  fs.ensureDirSync(pdfPath);
  fs.writeFileSync(path.join(pdfPath, `${book._id}.pdf`), data.Body);
  res.render("books/read", { title: capitalize(book.title), bookId: book._id });
}

module.exports.currentRead = async (req, res) => {
  const { page } = req.body;
  const { id: bookId } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).send("User not found");
  }
  user.currentRead = { bookId, page };
  await user.save();
  res.status(200).send("done");
}

module.exports.deletePDF = async (req, res) => {
  const id = req.params.id;
  const pdfPath = "public/pdfs";
  fs.removeSync(path.join(pdfPath, `${id}.pdf`));
  res.status(200).send("done");
}

module.exports.clearPDFs = async (req, res) => {
  fs.emptyDirSync("public/pdfs");
  res.status(200).send("done");
}

module.exports.renderAdminUpload = (req, res) => {
  const title = "GIP Admin";
  res.render("books/adminUpload", { title });
};

module.exports.adminUpload = async (req, res) => {
  const pdfConverter = require("pdf-poppler");
  const { checkFileType } = require("../functions");
  for (const doc of req.files) {
    console.log(doc.originalname);
    checkFileType(doc, (res) => res);
    const book = new Book();
    const { size } = doc;
    const key = "book/" + Date.now().toString() + "_" + doc.originalname;
    const originalname = doc.originalname
      .toLowerCase()
      .replace(".pdf", "")
      .split(" - ");
    book.document = { key, size };
    book.title = originalname[0].replace(/ -- /g, " - ");
    book.author = originalname[1] || " ";
    book.uid = (book.title + " " + book.author)
      .toLowerCase()
      .replace(/ /g, "-");
    book.filetype = doc.mimetype.split("/")[1];
    book.datetime = Date.now();
    book.isApproved = true; // false
    book.image.key =
      "book-img/" + Date.now().toString() + "_" + book.title + ".jpg";

    const pdfPath = `uploads/${doc.originalname}`;
    let option = {
      format: "jpeg",
      out_dir: "uploads2",
      out_prefix: path.basename(pdfPath, path.extname(pdfPath)),
      page: 1,
    };
    await pdfConverter.convert(pdfPath, option);
    let files = fs.readdirSync("uploads2");
    const file = files.find((f) =>
      f.toLowerCase().includes(book.title.replace(/ - /g, " -- "))
    );
    // console.log(file);
    await uploadCompressedImage(`uploads2/${file}`, book.image.key);

    const myBuffer = fs.readFileSync(pdfPath);
    // console.log(key, myBuffer);
    await putImage(key, myBuffer);
    // console.log(book);
    await book.save();
    fs.unlinkSync(pdfPath);
  }
  req.flash("success", "Successfully Uploaded!");
  res.redirect("/books/adminUpload");
};

module.exports.search = async (req, res) => {
  const advSearch = require("../utils/search");
  const item = req.query.search;
  const books = await Book.find({ isApproved: true });
  const result = advSearch(books, item);
  const [pageDocs, pageData] = paginate(req, result);
  const title = `Search for Books - ${item}`;
  res.render("books/list", {
    category: `🔍: ${item}`,
    books: pageDocs,
    pageData,
    title,
  });
};

module.exports.showBook = async (req, res) => {
  const book = await Book.findById(req.params.id).populate({
    path: "reviews",
    populate: { path: "author" },
  });
  if (!book) {
    req.flash("error", "Cannot find that book!");
    return res.redirect("/books?refresh=1");
  }

  const { books: limit } = require("../utils/lib/limits");
  const title = `${capitalize(book.title)} by ${
    book.author
  } - Free pdf download`;
  res.render("books/show", {
    book,
    title,
    limit,
    canonicalUrl: `https://godinprints.org/books/2/${book.uid}`,
  });
};

module.exports.show = async (req, res) => {
  const book = await Book.findOne({ title: req.params.title }).populate({
    path: "reviews",
    populate: { path: "author" },
  });
  if (!book) {
    req.flash("error", "Cannot find that book!");
    return res.redirect("/books?refresh=1");
  }

  const { books: limit } = require("../utils/lib/limits");
  const title = `${capitalize(book.title)} by ${
    book.author
  } - Free pdf download`;
  res.render("books/show", {
    book,
    title,
    limit,
    canonicalUrl: `https://godinprints.org/books/2/${book.uid}`,
  });
};

module.exports.show2 = async (req, res) => {
  const book = await Book.findOne({ uid: req.params.uid }).populate({
    path: "reviews",
    populate: { path: "author" },
  });
  if (!book) {
    req.flash("error", "Cannot find that book!");
    return res.redirect("/books?refresh=1");
  }

  const { books: limit } = require("../utils/lib/limits");
  const title = `${capitalize(book.title)} by ${
    book.author
  } - Free pdf download`;
  res.render("books/show", {
    book,
    title,
    limit,
    canonicalUrl: `https://godinprints.org/books/2/${book.uid}`,
  });
};

module.exports.similarBooks = async (req, res) => {
  const advSearch = require("../utils/search");
  const books = await Book.find({ isApproved: true });
  const book = books.find((book) => book._id == req.params.id);
  if (!book) return res.status(404).end();
  const item = `${book.title} ${book.author}`;
  const search = advSearch(books, item).filter((b) => b.uid != book.uid);
  const similarBooks = [];
  for (const book of search) {
    if (similarBooks.length >= 10) break;
    if (!similarBooks.some((bk) => bk.uid === book.uid))
      similarBooks.push(book);
  }
  res.status(200).json(similarBooks);
}

module.exports.renderImageUpload = (req, res) => {
  const id = req.params.id;
  const route = `/Books/${id}/imageUpload`;
  const msg = "Upload Book Front Image";
  res.render("imageUpload", { route, msg, title: msg });
};

module.exports.imageUpload = async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (book.image.key == "none") {
    book.image.key =
      "book-img/" + Date.now().toString() + "_" + req.file.originalname;
    await uploadCompressedImage(req.file.path, book.image.key);
    await book.save();
    req.flash("success", "Successfully saved book, awaiting approval.");
  } else {
    req.flash("error", "This book already has an image.");
  }
  res.redirect(`/books/${book._id}`);
};

module.exports.download = async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) {
    req.flash("error", "Book not found.");
    return res.redirect(`/books`);
  }
  const { key } = book.document;
  const options = {
    Bucket: "godinprintsdocuments",
    Key: key,
  };
  res.attachment(book.title.replace(".pdf", "") + ".pdf"); // Use ( + '.' + book.filetype) to add file extension
  const fileStream = s3.getObject(options).createReadStream();
  fileStream.pipe(res);

  const user = await User.findById(req.user._id);
  user.downloads.push({ bookId: book._id, downloadTime: new Date() });
  await user.save();
};

module.exports.ticketDownload = async (req, res) => {
  const ticket = await BookTicket.findOne({ ticket: req.body.ticketId });
  if (!ticket || !ticket.volume) {
    req.flash("error", "Ticket does not exist or has been used.");
    return res.redirect(`/books/${req.params.id}`);
  }
  const book = await Book.findById(req.params.id);
  if (!book) {
    req.flash("error", "Book not found.");
    return res.redirect(`/books`);
  }
  const { key } = book.document;
  const options = {
    Bucket: "godinprintsdocuments",
    Key: key,
  };
  res.attachment(book.title.replace(".pdf", "") + ".pdf"); // Use ( + '.' + book.filetype) to add file extension
  const fileStream = s3.getObject(options).createReadStream();
  fileStream.pipe(res);

  const user = await User.findById(req.user._id);
  user.tktdownloads.push({ bookId: book._id, downloadTime: new Date() });
  ticket.volume -= 1;
  await user.save();
  await ticket.save();
};

module.exports.downloadsList = async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("downloads.bookId")
    .populate("tktdownloads.bookId");
  const downloads = user.downloads
    .concat(user.tktdownloads)
    .filter((d) => d.bookId)
    .sort((a, b) => b.downloadTime - a.downloadTime)
    .map((download) => {
      return {
        title: download.bookId.title,
        author: download.bookId.author,
        downloadTime: download.downloadTime,
        ticket: user.tktdownloads.includes(download),
      };
    });
  const last30 = [],
    other = [];
  for (let download of downloads) {
    if (new Date() - download.downloadTime < 30 * 24 * 60 * 60 * 1000) {
      last30.push(download);
    } else {
      other.push(download);
    }
  }
  return res.status(200).send({ last30, other });
};

module.exports.addReview = async (req, res) => {
  // console.log(req)
  const book = await Book.findById(req.params.id);
  const review = new Review(req.body.review);
  review.parentId = book._id.toString();
  review.author = req.user._id;
  review.category = "Books";
  review.dateTime = Date.now();
  book.reviews.unshift(review);
  const duplicateReview = await Review.findOne({ parentId: review.parentId, author: review.author });
  await review.save();
  if (duplicateReview) {
    book.reviews = book.reviews.filter((review) => review._id.toString() != duplicateReview._id.toString());
    duplicateReview.delete();
  }
  await book.save();
  res.redirect(`/books/${book._id}`);
};

module.exports.mailReview = async (req, res) => {
  // console.log(req)
  const book = await Book.findById(req.params.bookId);
  if (req.params.review != "0") {
    const review = new Review({ text: sanitize(req.params.review) });
    review.parentId = book._id.toString();
    review.author = new Object(req.params.userId);
    review.category = "Books";
    review.dateTime = Date.now();
    book.reviews.unshift(review);
    await review.save();
    await book.save();
    return res.redirect(`/reviews/${review._id}/edit`);
  }
  return res.redirect(`/reviews/0/edit?parentId=${book._id}`);
};

module.exports.deleteReview = async (req, res) => {
  const { bookId, reviewId } = req.params;
  await Book.findByIdAndUpdate(bookId, { $pull: { reviews: reviewId } });
  await Review.findByIdAndDelete(reviewId);
  res.send(reviewId);
};

module.exports.suggest = async (req, res) => {
  const review = new Review(req.body.review);
  review.category = "Suggest";
  review.parentId = "books";
  review.author = req.user._id;
  await review.save();
  let mailOptions = {
    from: '"God-In-Prints Libraries" <godinprintslibraries@gmail.com>',
    to: [req.user.email, "gipteam@hotmail.com"],
    subject: "Book Request",
    html: `<p>Hello ${req.user.firstName.toUpperCase()},<p/><br>
          <p>Your request for the book: <b>${
            review.text
          }</b> was successfully submitted. We will endeavour to make the requested book item available as soon as possible and revert.<p/><br>
          <p>Best regards,<p/><br><b>GIP Library</b>`,
  };
  const { transporter } = require("../functions");
  transporter.sendMail(mailOptions);
  res.status(200).send("Success");
};

module.exports.writexml = async (req, res) => {
  const books = await Book.find({});
  let xmap = "";
  for (let book of books) {
    xmap += `<url>\n\ \ <loc>https://godinprints.org/books/2/${encodeURI(
      book.uid
    )}</loc>\n\ \ <lastmod>2023-04-08T10:24:55+00:00</lastmod>\n\ \ <priority>0.64</priority>\n</url>\n`;
  }
  fs.writeFileSync("books.xml", xmap);
  res.status(200).send("done");
};
