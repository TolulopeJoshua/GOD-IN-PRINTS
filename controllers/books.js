const Doc = require('../models/doc');
const Book = require('../models/book');
const Review = require('../models/review');
const User = require('../models/user');

const fs = require('fs');
// const pdfConverter = require('pdf-poppler');
const path = require('path');

const {getImage, s3, paginate, uploadCompressedImage, encode} = require("../functions")

const categories = ['Evangelism', 'Prayer/Warfare', 'Marriage/Family', 'Dating/Courtship', 
                    'Devotion', 'Commitment/Consecration', 'Grace/Conversion', 
                    'Afterlife', 'Growth/Development', 'Money/Wealth', 'Biography'];


module.exports.index = async (req, res) => {
    let books;
    // let sessData = req.session;   
    // if (sessData.featureBooks) {
    //     books = sessData.featureBooks;
    // } else {
        books = await Book.aggregate([{ $match: { filetype: "pdf", isApproved: true } }, { $sample: { size: 20 } }]);
        // sessData.featureBooks = books;
    // }
    const adArt = await Doc.aggregate([{ $match: {docType: 'article', isApproved: true } }, { $sample: { size: 2 } }]);
    const adBio = await Doc.aggregate([{ $match: {docType: 'biography', isApproved: true } }, { $sample: { size: 2 } }]);
    res.render('books/index', {books, adArt, adBio})
};

module.exports.list = async (req, res) => {
    const books = await Book.find({isApproved: true}).sort({title : 1});
    const [pageDocs, pageData] = paginate(req, books)
    const adArt = await Doc.aggregate([{ $match: {docType: 'article', isApproved: true } }, { $sample: { size: 2 } }]);
    const adBio = await Doc.aggregate([{ $match: {docType: 'biography', isApproved: true } }, { $sample: { size: 2 } }]);
    res.render('books/list', {category: 'All Books', books: pageDocs, pageData, adArt, adBio})
};

module.exports.categories = (req, res) => {
    res.render('books/categories', {categories})
};

module.exports.perCategory = async (req, res) => {
    const {category} = req.query;
    const allBooks = await Book.find({isApproved: true}).sort({name : 1});
    let books =[];
    for (let book of allBooks) {
        for (let word of words(category)) {
            const title = book.title.toLowerCase();
            if (title.includes(word) && !books.includes(book)) {books.push(book)};
        };
    };
    const [pageDocs, pageData] = paginate(req, books)
    const adArt = await Doc.aggregate([{ $match: {docType: 'article', isApproved: true } }, { $sample: { size: 2 } }]);
    const adBio = await Doc.aggregate([{ $match: {docType: 'biography', isApproved: true } }, { $sample: { size: 2 } }]);
    res.render('books/list', {category, books: pageDocs, pageData, adArt, adBio})

    function words(category) {
        const word = category.toLowerCase().replaceAll(' ', '/');
        return word.split('/');
    }
};

module.exports.renderNewForm = (req, res) => {
    res.render('books/new')
};

module.exports.createBook = async (req, res) => {
    const book = new Book(req.body.book);
    const {key, size} = req.file;
    book.document = {key, size};
    book.title = book.title.toUpperCase();
    book.author = book.author.toUpperCase();
    book.contributor = req.user._id;
    book.filetype = req.file.mimetype.split('/')[1] || 'pdf';
    book.datetime = Date.now();
    await book.save();
    req.flash('success', `${book.title.toUpperCase()} saved, kindly upload front-page image.`);
    res.redirect(`/books/${book._id}/imageUpload`)
};

module.exports.renderAdminUpload = (req, res) => {
    res.render('books/adminUpload')
};

module.exports.adminUpload = async (req, res) => {
    for (const doc of req.files) {
        const book = new Book();
        const {key, size} = doc;
        book.document = {key, size};
        book.title = doc.originalname;
        book.author = ' ';
        book.filetype = doc.mimetype.split('/')[1];
        book.datetime = Date.now();
        book.isApproved = true;
        book.image.key = 'book-img/' + Date.now().toString() + '_' + book.title.slice(0, -3) + 'jpg';
        const data = await getImage(book.document.key);
        await fs.writeFileSync('output.pdf', data.Body);
        const pdfPath = 'output.pdf';
        let option = {
            format : 'jpeg',
            out_dir : 'uploads',
            out_prefix : path.basename(pdfPath, path.extname(pdfPath)),
            page : 1
        }
        await pdfConverter.convert(pdfPath, option)
        let files = await fs.readdirSync('uploads')
        await uploadCompressedImage(`uploads/${files[0]}`, book.image.key);
        await book.save();
        for (const file of files) {
            fs.unlinkSync(path.join('uploads', file));
        }
    }
    res.send('SUCCESS');
};

module.exports.search = async (req, res) => {
    const item = req.query.search;
    // console.log(item)
    const books = await Book.find({}).sort({title: 1});
    const result = [];
    books.forEach((book) => {
        book.title.toLowerCase().includes(item.toLowerCase()) && result.push(book);
    })
    const [pageDocs, pageData] = paginate(req, result)
    const adArt = await Doc.aggregate([{ $match: {docType: 'article', isApproved: true } }, { $sample: { size: 2 } }]);
    const adBio = await Doc.aggregate([{ $match: {docType: 'biography', isApproved: true } }, { $sample: { size: 2 } }]);
    res.render('books/list', {category: `Search🔍: ${item}`, books: pageDocs, pageData, adArt, adBio});
};

module.exports.showBook = async (req, res) => {

    const book = await Book.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    });
    if(!book) {
        req.flash('error', 'Cannot find that book!');
        return res.redirect('/books');
    }
    res.render('books/show', {book});
};

module.exports.image = async (req, res) => {    
    const book = await Book.findById(req.params.id);
    const data = await getImage(book.image.key);
    const src = `data:image/png;base64,${encode(data.Body)}`;
    res.send(src);
};

module.exports.renderImageUpload = (req, res) => {
    const id = req.params.id;
    const route = `/Books/${id}/imageUpload`;
    const msg = 'Upload Book Front Image';
    res.render('imageUpload', {route, msg});
};

module.exports.imageUpload = async (req, res) => {
    const book = await Book.findById(req.params.id);
    book.image.key = 'book-img/' + Date.now().toString() + '_' + req.file.originalname;
    await uploadCompressedImage(req.file.path, book.image.key);
    await book.save(); 
    req.flash('success', 'Successfully saved book, awaiting approval.');
    res.redirect(`/books/${book._id}`)
};

module.exports.download = async (req, res) => {
    const book = await Book.findById(req.params.id);
    // download the file via aws s3 here
    const {key} = book.document;
    const options = {
        Bucket    : 'godinprintsdocuments',
        Key       : key,
    };
    res.attachment(book.title); // Use ( + '.' + book.filetype) to add file extension
    const fileStream = s3.getObject(options).createReadStream();
    fileStream.pipe(res);

    const user = await User.findById(req.user._id);
    user.downloads.push({bookId: book._id, downloadTime: new Date()})
    await user.save();
};

module.exports.read = async (req, res) => {
    const book = await Book.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    });
    const adBio = await Doc.aggregate([{ $match: {docType: 'biography'} }, { $sample: { size: 2 } }]);
    res.render('books/read', {book, adBio});
}

module.exports.pagesArray = async (req, res) => {

    const book = await Book.findById(req.params.id);
    const data = await getImage(book.document.key);
    await fs.writeFileSync('output2.pdf', data.Body);

    let files = await fs.readdirSync('uploads2')
    for (const file of files) {
        await fs.unlinkSync(path.join('uploads2', file));
    }

    const pdfPath = 'output2.pdf';
    let option = {
        format : 'jpeg',
        out_dir : 'uploads2',
        out_prefix : path.basename(pdfPath, path.extname(pdfPath)),
        // page : 1
    }
    const jpg = await pdfConverter.convert(pdfPath, option)
    files = await fs.readdirSync('uploads2')

    const srcs = [];
    files.forEach(file => {
        var bitmap = fs.readFileSync(path.join('uploads2', file));
        const base64 =  new Buffer.from(bitmap).toString('base64');
        const src = `data:image/png;base64,${base64}`;
        srcs.push(src);
    })
    
    res.send(srcs);
};

module.exports.addReview = async (req, res) => {
    // console.log(req)
    const book = await Book.findById(req.params.id);
    const review = new Review(req.body.review);
    review.parentId = book._id.toString();
    review.author = req.user._id;
    review.category = 'Books';
    review.dateTime = Date.now();
    book.reviews.unshift(review);
    await review.save();
    await book.save();
    res.redirect(`/books/${book._id}`)
};

module.exports.deleteReview = async (req, res) => {
    const {bookId, reviewId} = req.params;
    await Book.findByIdAndUpdate(bookId, {$pull: {reviews: reviewId} } );
    await Review.findByIdAndDelete(reviewId);
    res.send(reviewId);
}

module.exports.suggest = async (req, res) => {
    const review = new Review(req.body.review);
    review.category = 'Suggest';
    review.parentId = 'book';
    review.author = req.user._id;
    await review.save();
    let mailOptions = {
        from: '"God-In-Prints Libraries" <godinprintslibraries@gmail.com>', 
        to: [req.user.email, 'gipteam@hotmail.com'],
        subject: 'Book Request',
        html: `<p>Hello ${req.user.firstName.toUpperCase()},<p/><br>
          <p>Your request for the book: <b>${review.text}<b/> was successfully submitted. We will endeavour to make the requested book item available as soon as possible and revert.<p/><br>
          <p>Best regards,<p/><br><b>GIP Library<b/>`
    };
    const {transporter} = require('../functions');
    transporter.sendMail(mailOptions);
    res.status(200).send('Success')
}