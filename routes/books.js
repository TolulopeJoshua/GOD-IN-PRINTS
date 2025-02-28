const express = require("express");
const router = express.Router();
const books = require("../controllers/books");
const catchAsync = require("../utils/catchAsync");
const {
  isLoggedIn,
  isSubscribed,
  validateBook,
  validateRead,
  isReviewAuthor,
  validateReview,
  checkDownloadLimit,
  setRedirect,
  isAdmin,
} = require("../middleware");

const { upload, upload0 } = require("../functions");

router.get("/", catchAsync(books.index));

router.get("/list", setRedirect, catchAsync(books.list));

router.get("/random", catchAsync(books.random));

router.get("/categories", books.categories);

router.get("/category", setRedirect, catchAsync(books.perCategory));

router.get("/new", isLoggedIn, catchAsync(books.renderNewForm));

router.post(
  "/new",
  isLoggedIn,
  upload0.single("document"),
  validateBook,
  catchAsync(books.createBook)
);

router.get("/:id/read", isLoggedIn, catchAsync(books.readOnline));

router.put(
  "/:id/read",
  isLoggedIn,
  validateRead,
  catchAsync(books.currentRead)
);

router.delete("/:id/read", isLoggedIn, catchAsync(books.deletePDF));

// router.delete('/reads', isLoggedIn, catchAsync(books.clearPDFs));

router.get("/adminUpload", isAdmin, books.renderAdminUpload);

router.post(
  "/adminUpload",
  isAdmin,
  upload0.array("documents"),
  catchAsync(books.adminUpload)
);

router.get("/search", setRedirect, catchAsync(books.search));

router.get("/downloads", isLoggedIn, catchAsync(books.downloadsList));

router.get("/:id", setRedirect, catchAsync(books.showBook));

router.get("/1/:title", setRedirect, catchAsync(books.show));

router.get("/2/:uid", setRedirect, catchAsync(books.show2));

router.get("/:id/similar", catchAsync(books.similarBooks));

router.get("/image", catchAsync(books.image));

router.get("/:id/imageUpload", isLoggedIn, books.renderImageUpload);

router.post(
  "/:id/imageUpload",
  isLoggedIn,
  upload0.single("image"),
  catchAsync(books.imageUpload)
);

router.get(
  "/:id/download",
  isLoggedIn,
  checkDownloadLimit,
  catchAsync(books.download)
);

router.post(
  "/:id/download/ticket",
  isLoggedIn,
  catchAsync(books.ticketDownload)
);

// router.get('/:id/getPages', isLoggedIn, catchAsync(books.pagesArray));

router.post(
  "/:id/addReview",
  isLoggedIn,
  validateReview,
  catchAsync(books.addReview)
);

router.get("/mailReview/:userId/:bookId/:review", catchAsync(books.mailReview));

router.delete(
  "/:bookId/deleteReview/:reviewId",
  isLoggedIn,
  isReviewAuthor,
  catchAsync(books.deleteReview)
);

router.post("/suggest", isLoggedIn, validateReview, catchAsync(books.suggest));

router.post("/writexml", isAdmin, catchAsync(books.writexml));

module.exports = router;
