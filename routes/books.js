const express = require('express');
const router = express.Router();

const Book = require('../models/book');

const fs = require('fs');

const {getImage, putImage, encode, s3, upload, upload0, paginate} = require("../functions")

const categories = ['Evangelism', 'Prayer/Warfare', 'Marriage/Family Life', 
                    'Spiritual Growth', 'Commitment/Consecration', 'Grace/Conversion', 
                    'Afterlife', 'Personal/Financial Development', 'Biography', 'Others'];

const words = (category) => {
    const word = category.toLowerCase().replaceAll(' ', '/');
    return word.split('/');
}


router.get('/', async (req, res) => {
    const books = await Book.aggregate([{ $match: { filetype: "pdf" } }, { $sample: { size: 20 } }]);
    res.render('books/index', {books})
});

router.get('/list', async (req, res) => {
    const books = await Book.find({filetype: 'pdf'}).sort({title : 1});
    const [pageDocs, pageData] = paginate(req, books)

    res.render('books/list', {category: 'All Books', books: pageDocs, pageData})
});

router.get('/categories', (req, res) => {
    res.render('books/categories', {categories})
})

router.get('/category', async (req, res) => {
    const {category} = req.query;
    const allBooks = await Book.find({filetype: "pdf"}).sort({name : 1});
    let books =[];
    for (let book of allBooks) {
        for (let word of words(category)) {
            // console.log(word);
            const title = book.title.toLowerCase();
            if (title.includes(word) && !books.includes(book)) {books.push(book)};
        };
    };
    const [pageDocs, pageData] = paginate(req, books)

    res.render('books/list', {category, books: pageDocs, pageData})
})

router.get('/new', (req, res) => {
    res.render('books/new')
});

router.post('/new', upload.single('document'), async (req, res) => {
    const book = new Book(req.body.book);
    // console.log(req.file);
    const {key, size} = req.file;
    book.document = {key, size};
    book.title = book.title.toUpperCase();
    book.author = book.author.toUpperCase();
    book.filetype = req.file.mimetype.split('/')[1];
    book.datetime = Date.now();
    // book.keywords = book.keywords.toUpperCase();
    if (book.filetype === 'pdf') {
        book.image.key = 'book-img/' + Date.now().toString() + '_' + book.title.slice + '.jpg';
        
        const data = await getImage(book.document.key);
        // console.log(data);
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
        const image = await Jimp.read(`uploads/${files[0]}`);

        await image.resize(640, Jimp.AUTO);
        await image.quality(20);
        await image.writeAsync('output.jpg');
        
        for (const file of files) {
            fs.unlinkSync(path.join('uploads', file));
        }
        
        const myBuffer = await fs.readFileSync('output.jpg');
        await putImage(book.image.key, myBuffer);

        await book.save();    
        req.flash('success', `${book.title.toUpperCase()} saved, thanks for your contribution`);
        res.redirect(`/books/${book._id}`)
    } else {
        await book.save();
        req.flash('success', `${book.title.toUpperCase()} saved, kindly upload front-page picture.`);
        res.redirect(`/books/${book._id}/imageUpload`)
    }
});

router.get('/adminUpload', (req, res) => {
    res.render('books/adminUpload')
});

router.post('/adminUpload', upload.array('documents'), async (req, res) => {
    
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
        const image = await Jimp.read(`uploads/${files[0]}`);

        await image.resize(640, Jimp.AUTO);
        await image.quality(20);
        await image.writeAsync('output.jpg');
        
        const myBuffer = await fs.readFileSync('output.jpg');
        await putImage(book.image.key, myBuffer);

        await book.save();
        
        for (const file of files) {
            fs.unlinkSync(path.join('uploads', file));
        }
    }
    res.send('SUCCESS');
})
 
router.get('/search', async (req, res) => {
    const item = req.query.search;
    // console.log(item)
    const books = await Book.find({filetype: "pdf"}).sort({title: 1});
    const result = [];
    books.forEach((book) => {
        book.title.toLowerCase().includes(item.toLowerCase()) && result.push(book);
    })
    const [pageDocs, pageData] = paginate(req, result)

    res.render('books/list', {category: `Search🔍: ${item}`, books: pageDocs, pageData});
})

router.get('/:id', async (req, res) => {

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
})

router.get('/:id/imageUpload', (req, res) => {
    const id = req.params.id;
    const route = `/Books/${id}/imageUpload`;
    const msg = 'Upload Book Front Image';
    res.render('imageUpload', {route, msg});
})

var Jimp = require('jimp');
const pdfConverter = require('pdf-poppler');
const util = require('util');
const path = require('path');
const { resolve } = require('path');

router.post('/:id/imageUpload', upload0.single("image"), async (req, res) => {
    const book = await Book.findById(req.params.id);
    
    book.image.key = 'book-img/' + Date.now().toString() + '_' + req.file.originalname;
    
    const image = await Jimp.read(req.file.path);
    await image.resize(640, Jimp.AUTO);
    if(req.file.size > 50000) {
        await image.quality(20);
    }
    await image.writeAsync('output.jpg');

    const myBuffer = await fs.readFileSync('output.jpg');
    await putImage(book.image.key, myBuffer);

    let files = await fs.readdirSync('uploads')
    for (const file of files) {
      fs.unlinkSync(path.join('uploads', file));
    }

    await book.save(); 
    req.flash('success', 'Successfully saved book');
    res.redirect(`/books/${book._id}`)
})

router.get('/:id/download', async (req, res) => {
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
});

module.exports = router;