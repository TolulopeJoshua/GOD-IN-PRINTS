const Book = require('../models/book');

const fs = require('fs');
const pdfConverter = require('pdf-poppler');
const path = require('path');

const {getImage, s3, paginate, uploadCompressedImage, encode} = require("../functions")

const categories = ['Evangelism', 'Prayer/Warfare', 'Marriage/Family', 'Dating/Courtship', 
                    'Devotion', 'Commitment/Consecration', 'Grace/Conversion', 
                    'Afterlife', 'Growth/Development', 'Money/Wealth', 'Biography'];


module.exports.index = async (req, res) => {
    const books = await Book.aggregate([{ $match: { filetype: "pdf" } }, { $sample: { size: 20 } }]);
    res.render('books/index', {books})
};

module.exports.list = async (req, res) => {
    const books = await Book.find({filetype: 'pdf'}).sort({title : 1});
    const [pageDocs, pageData] = paginate(req, books)
    res.render('books/list', {category: 'All Books', books: pageDocs, pageData})
};

module.exports.categories = (req, res) => {
    res.render('books/categories', {categories})
};

module.exports.perCategory = async (req, res) => {
    const {category} = req.query;
    const allBooks = await Book.find({filetype: "pdf"}).sort({name : 1});
    let books =[];
    for (let book of allBooks) {
        for (let word of words(category)) {
            const title = book.title.toLowerCase();
            if (title.includes(word) && !books.includes(book)) {books.push(book)};
        };
    };
    const [pageDocs, pageData] = paginate(req, books)
    res.render('books/list', {category, books: pageDocs, pageData})
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
    book.title = book.title.toUpperCase() + '.PDF';
    book.author = book.author.toUpperCase();
    book.filetype = req.file.mimetype.split('/')[1];
    book.datetime = Date.now();
    if (book.filetype === 'pdf') {
        book.image.key = 'book-img/' + Date.now().toString() + '_' + book.title.slice(0, -3) + '.jpg';
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
        req.flash('success', `${book.title.toUpperCase()} saved, thanks for your contribution`);
        res.redirect(`/books/${book._id}`)
    } else {
        await book.save();
        req.flash('success', `${book.title.toUpperCase()} saved, kindly upload front-page picture.`);
        res.redirect(`/books/${book._id}/imageUpload`)
    }
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
    const books = await Book.find({filetype: "pdf"}).sort({title: 1});
    const result = [];
    books.forEach((book) => {
        book.title.toLowerCase().includes(item.toLowerCase()) && result.push(book);
    })
    const [pageDocs, pageData] = paginate(req, result)

    res.render('books/list', {category: `Search🔍: ${item}`, books: pageDocs, pageData});
};

module.exports.showBook = async (req, res) => {

    const book = await Book.findById(req.params.id);
    //     .populate({
    //         path: 'reviews',
    //         populate: {
    //             path: 'author'
    //         }
    // }).populate('author');
    // console.log(book)
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
    req.flash('success', 'Successfully saved book');
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
};