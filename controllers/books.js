const Doc = require('../models/doc');
const Book = require('../models/book');
const Review = require('../models/review');
const User = require('../models/user');
const BookTicket = require('../models/bookTicket');

const fs = require('fs');
const path = require('path');

const {getImage, s3, paginate, uploadCompressedImage, encode, putImage} = require("../functions");
const ExpressError = require('../utils/ExpressError');
const bookTicket = require('../models/bookTicket');
const sanitize = require('sanitize-html');

const categories = ['Evangelism', 'Prayer', 'Marriage/Family', 'Dating/Courtship', 
                    'Devotion', 'Commitment/Consecration', 'Grace/Conversion', 
                    'Afterlife', 'Growth/Development', 'Money/Wealth', 'Biography'];


module.exports.index = async (req, res) => {
    let books;
    // let sessData = req.session;   
    // if (sessData.featureBooks && !req.query.refresh) {
    //     books = sessData.featureBooks;
    // } else {
        books = await Book.aggregate([{ $match: { filetype: "pdf", isApproved: true } }, { $sample: { size: 20 } }]);
    //     sessData.featureBooks = books;
    //     if (req.query.refresh) return res.redirect('/books');
    // }
    const title = 'Feature Books on Christian Faith - Free pdf download';
    res.render('books/index', {books, title})
};

module.exports.list = async (req, res) => {
    const books = await Book.find({isApproved: true}).sort({title : 1});
    const [pageDocs, pageData] = paginate(req, books)
    const title = 'List of Books on Christian Faith - Free pdf download';
    res.render('books/list', {category: 'All Books', books: pageDocs, pageData, title})
};

module.exports.random = async (req, res) => {
    const [random] = await Book.aggregate([{ $match: { filetype: 'pdf', isApproved: true } }, { $sample: { size: 1 } }]);
    res.status(200).send(random);
}

module.exports.categories = (req, res) => {
    const title = 'GIP Library - Books Categories';
    res.render('books/categories', {categories, title})
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
    const title = `Books on ${category} - Free pdf download`;
    res.render('books/list', {category, books: pageDocs, pageData, title})

    function words(category) {
        const word = category.toLowerCase().replaceAll(' ', '/');
        return word.split('/');
    }
};

module.exports.renderNewForm = async (req, res) => {
    const title = 'Post a Book';
    let booktitle = '';
    if (req.query.requestId) {
        const request = await Review.findById(req.query.requestId);
        booktitle = request.text;
    }
    res.render('books/new', { booktitle, title })
};

module.exports.createBook = async (req, res) => {

    if (!req.file) throw new ExpressError('No file attached!', 400);
    const path = require('path');
    const filetypes = /pdf|mobi|epub|docx/;
    const extname = filetypes.test(path.extname(req.file.originalname).toLowerCase());
    const mimetype = filetypes.test(req.file.mimetype);
    if (!mimetype || !extname) {
        fs.unlinkSync(`uploads/${req.file.originalname}`);
        throw new ExpressError('Allowed file extensions - PDF | MOBI | EPUB | DOCX', 400);
    }
    
    const book = new Book(req.body.book);
    const {size} = req.file;
    const key = 'book/' + Date.now().toString() + '_' + req.file.originalname;
    book.document = {key, size};
    book.title = book.title.toUpperCase();
    book.uid = book.title.toLowerCase().replaceAll(' ', '-');
    book.author = book.author.toLowerCase();
    book.contributor = req.user._id;
    book.filetype = req.file.mimetype.split('/')[1];
    book.datetime = Date.now();
    
    const myBuffer = fs.readFileSync(`uploads/${req.file.originalname}`);
    await book.save();
    await putImage(key, myBuffer);
    fs.unlinkSync(`uploads/${req.file.originalname}`);
    req.flash('success', `${book.title.toUpperCase()} saved, kindly upload front-page image.`);
    res.redirect(`/books/${book._id}/imageUpload`)

    if (req.query.requestId) {
        const request = await Review.findById(req.query.requestId).populate('author');
        request.likes[0] = req.user._id;
        await request.save();
        let mailOptions = {
            from: '"God-In-Prints Libraries" <godinprintslibraries@gmail.com>', 
            to: [request.author.email, 'gipteam@hotmail.com'],
            subject: 'Book Request',
            html: `<p>Hello ${request.author.firstName.toUpperCase()},<p/><br>
              <p>Your request for the book: <b>${request.text}</b> has been responded to. Kindly check out the resource at https://godinprints.org/books/${book._id}.<p/><br>
              <p>Regards,<p/><br><b>GIP Library</b>`
        };
        const {transporter} = require('../functions');
        transporter.sendMail(mailOptions);
    }
};

module.exports.renderAdminUpload = (req, res) => {
    const title = 'GIP Admin'
    res.render('books/adminUpload', {title})
};

module.exports.adminUpload = async (req, res) => {
    const pdfConverter = require('pdf-poppler');
    const {checkFileType} = require('../functions')
    for (const doc of req.files) {
        console.log(doc.originalname);

        checkFileType(doc, (res) => res);
        const book = new Book();
        const {size} = doc;
        const key = 'book/' + Date.now().toString() + '_' + doc.originalname;
        const originalname = doc.originalname.toLowerCase().replaceAll('.pdf', '');
        book.document = {key, size};
        book.title = originalname.split(' - ')[0];
        book.uid = book.title.toLowerCase().replaceAll(' ', '-');
        book.author = originalname.split(' - ')[1] || ' ';
        book.filetype = doc.mimetype.split('/')[1];
        book.datetime = Date.now();
        book.isApproved = false;
        book.image.key = 'book-img/' + Date.now().toString() + '_' + book.title + '.jpg';
    
        const pdfPath = `uploads/${doc.originalname}`;
        const myBuffer = fs.readFileSync(pdfPath);
        await book.save();
        await putImage(key, myBuffer);
        let option = {
            format : 'jpeg',
            out_dir : 'uploads2',
            out_prefix : path.basename(pdfPath, path.extname(pdfPath)),
            page : 1
        }
        await pdfConverter.convert(pdfPath, option)
        fs.unlinkSync(pdfPath);
        let files = fs.readdirSync('uploads2')
        await uploadCompressedImage(`uploads2/${files[0]}`, book.image.key);
    }
    req.flash('success', 'Successfully Uploaded!')
    res.redirect('/books/adminUpload');
};

module.exports.createPreviews = async (req, res) => {
    const pdfConverter = require('pdf-poppler');
    const books = await Book.find({});
    for (let index = 0; index < 2000; index++) {
        console.log(index);
        if ([823,148].includes(index)) continue;
        const book = books[index] || null;
        if (book && !book.image.previews.length) {
            const data = await getImage(book.document.key);
            fs.writeFileSync('output.pdf', data.Body);
            const pdfPath = 'output.pdf';
            const info = await pdfConverter.info(pdfPath);
            const length = parseInt(info.pages) >= 10 ? 10 : parseInt(info.pages);
            for (let i = 1; i <= length; i++) {
                let option = {
                    format : 'jpeg',
                    out_dir : 'uploads',
                    out_prefix : `preview-${book.title.replaceAll(':', '-')}`, // path.basename(pdfPath, path.extname(pdfPath)),
                    page : i
                } 
                await pdfConverter.convert(pdfPath, option)
            }
            let files = fs.readdirSync('uploads')
            for (const file of files) {
                book.image.previews.push(`book-img/${file}`)
                await uploadCompressedImage(`uploads/${file}`, `book-img/${file}`);
            }
            await book.save();
        }
    }
    req.flash('success', 'Previews Created!');
    res.redirect('/books');
}

module.exports.search = async (req, res) => {
    const item = req.query.search;
    // console.log(item)
    const books = await Book.find({}).sort({title: 1});
    const result = [];
    books.forEach((book) => {
        book.title.toLowerCase().includes(item.toLowerCase()) && result.push(book);
    })
    const [pageDocs, pageData] = paginate(req, result)
    const title = `Search for Books - ${item}`;
    res.render('books/list', {category: `Search🔍: ${item}`, books: pageDocs, pageData, title});
};

module.exports.showBook = async (req, res) => {
    const book = await Book.findById(req.params.id).populate({
        path: 'reviews', populate: { path: 'author' }
    });
    if(!book) {
        req.flash('error', 'Cannot find that book!');
        return res.redirect('/books?refresh=1');
    }
    const { books: limit } = require('../utils/lib/limits');
    const title = `${book.title} - Free pdf download`;
    res.render('books/show', {book, title, limit});
};

module.exports.show = async (req, res) => {
    const book = await Book.findOne({ title: req.params.title }).populate({
        path: 'reviews', populate: { path: 'author' }
    });
    if(!book) {
        req.flash('error', 'Cannot find that book!');
        return res.redirect('/books?refresh=1');
    }
    const { books: limit } = require('../utils/lib/limits');
    const title = `${book.title} - Free pdf download`;
    res.render('books/show', {book, title, limit});
};

module.exports.show2 = async (req, res) => {
    const book = await Book.findOne({ uid: req.params.uid }).populate({
        path: 'reviews', populate: { path: 'author' }
    });
    if(!book) {
        req.flash('error', 'Cannot find that book!');
        return res.redirect('/books?refresh=1');
    }
    const { books: limit } = require('../utils/lib/limits');
    const title = `${book.title} - Free pdf download`;
    res.render('books/show', {book, title, limit});
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
    res.render('imageUpload', {route, msg, title: msg});
};

module.exports.imageUpload = async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (book.image.key == 'none') {
        book.image.key = 'book-img/' + Date.now().toString() + '_' + req.file.originalname;
        await uploadCompressedImage(req.file.path, book.image.key);
        await book.save(); 
        req.flash('success', 'Successfully saved book, awaiting approval.');
    } else {
        req.flash('error', 'This book already has an image.');
    }
    res.redirect(`/books/${book._id}`)
};

module.exports.download = async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (!book) {
        req.flash('error', 'Book not found.');
        return res.redirect(`/books`);
    }
    const {key} = book.document;
    const options = {
        Bucket    : 'godinprintsdocuments',
        Key       : key,
    };
    res.attachment(book.title.replaceAll('.pdf', '') + '.pdf'); // Use ( + '.' + book.filetype) to add file extension
    const fileStream = s3.getObject(options).createReadStream();
    fileStream.pipe(res);

    const user = await User.findById(req.user._id);
    user.downloads.push({bookId: book._id, downloadTime: new Date()})
    await user.save();
};

module.exports.ticketDownload = async (req, res) => {
    const ticket = await BookTicket.findOne({ticket: req.body.ticketId});
    if (!ticket) {
        req.flash('error', 'Ticket not found.');
        return res.redirect(`/books/${req.params.id}`);
    }
    const book = await Book.findById(req.params.id);
    if (!book) {
        req.flash('error', 'Book not found.');
        return res.redirect(`/books`);
    }
    const {key} = book.document;
    const options = {
        Bucket    : 'godinprintsdocuments',
        Key       : key,
    };
    res.attachment(book.title.replaceAll('.pdf', '') + '.pdf'); // Use ( + '.' + book.filetype) to add file extension
    const fileStream = s3.getObject(options).createReadStream();
    fileStream.pipe(res);

    const user = await User.findById(req.user._id);
    user.tktdownloads.push({bookId: book._id, downloadTime: new Date()})
    await user.save();
    await BookTicket.findByIdAndDelete(ticket._id);
};

module.exports.downloadsList = async (req, res) => {
    const user = await User.findById(req.user._id).populate('downloads.bookId').populate('tktdownloads.bookId');
    const downloads = user.downloads.concat(user.tktdownloads).filter(d => d.bookId).sort((a,b) => b.downloadTime - a.downloadTime).map(download => {
        return {
            title: download.bookId.title,
            author: download.bookId.author,
            downloadTime: download.downloadTime,
            ticket: user.tktdownloads.includes(download)
        }
    });
    const last30 = [], other = [];
    for (let download of downloads) {
        if ((new Date() - download.downloadTime) < (30 * 24 * 60 * 60 * 1000)) {
            last30.push(download);
        } else {
            other.push(download);
        }
    }
    return res.status(200).send({last30, other});
}

module.exports.read = async (req, res) => {
    const book = await Book.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    });
    const title = `${book.title} - Preview`;
    res.render('books/read', {book, title});
}

module.exports.pagesArray = async (req, res) => {

    const book = await Book.findById(req.params.id);
    const data = await getImage(book.document.key);
    fs.writeFileSync('output2.pdf', data.Body);

    let files = fs.readdirSync('uploads2')
    for (const file of files) {
        fs.unlinkSync(path.join('uploads2', file));
    }

    const pdfPath = 'output2.pdf';
    let option = {
        format : 'jpeg',
        out_dir : 'uploads2',
        out_prefix : path.basename(pdfPath, path.extname(pdfPath)),
        // page : 1
    }
    const jpg = await pdfConverter.convert(pdfPath, option)
    files = fs.readdirSync('uploads2')

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

module.exports.mailReview = async (req, res) => {
    // console.log(req)
    const book = await Book.findById(req.params.bookId);
    if (req.params.review != '0') {
        const review = new Review({text: sanitize(req.params.review)});
        review.parentId = book._id.toString();
        review.author = new Object(req.params.userId);
        review.category = 'Books';
        review.dateTime = Date.now();
        book.reviews.unshift(review);
        await review.save();
        await book.save();
        return res.redirect(`/reviews/${review._id}/edit`)
    }
    return res.redirect(`/reviews/0/edit?parentId=${book._id}`)
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
    review.parentId = 'books';
    review.author = req.user._id;
    await review.save();
    let mailOptions = {
        from: '"God-In-Prints Libraries" <godinprintslibraries@gmail.com>', 
        to: [req.user.email, 'gipteam@hotmail.com'],
        subject: 'Book Request',
        html: `<p>Hello ${req.user.firstName.toUpperCase()},<p/><br>
          <p>Your request for the book: <b>${review.text}</b> was successfully submitted. We will endeavour to make the requested book item available as soon as possible and revert.<p/><br>
          <p>Best regards,<p/><br><b>GIP Library</b>`
    };
    const {transporter} = require('../functions');
    transporter.sendMail(mailOptions);
    res.status(200).send('Success')
}