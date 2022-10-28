const Doc = require('../models/doc')
const Book = require('../models/book');
const Review = require('../models/review');
const sanitizeHtml = require('sanitize-html');


const {getImage, putImage, paginate, uploadCompressedImage, encode} = require("../functions");

const fs = require('fs');

const categories = [
    'Prayer/Warfare', 'Marriage/Family Life', 
    'Spiritual Growth', 'Commitment/Consecration', 'Evangelism', 'Grace/Conversion', 
    'Afterlife', 'Personal/Financial Development', 'Biography', 'Others'
];


module.exports.index = async (req, res) => {
    const articles = await Doc.aggregate([{ $match: {docType: 'article', isApproved: true} }, { $sample: { size: 300 } }]);
    const adBio = await Doc.aggregate([{ $match: {docType: 'biography'} }, { $sample: { size: 2 } }]);
    const adBook = await Book.aggregate([{ $match: {filetype: 'pdf'} }, { $sample: { size: 1 } }]);
    res.render('articles/index', {categories, articles, adBook, adBio})
};

module.exports.list = async (req, res) => {
    const articles = await Doc.find({docType: 'article', isApproved: true}).sort({name : 1});
    // for (let article of articles) {
    //     article.contributor = req.user._id;
    //     await article.save(); 
    // };
    const [pageDocs, pageData] = paginate(req, articles)
    const adBio = await Doc.aggregate([{ $match: {docType: 'biography'} }, { $sample: { size: 2 } }]);
    const adBook = await Book.aggregate([{ $match: {filetype: 'pdf'} }, { $sample: { size: 1 } }]);
    res.render('articles/list', {category : 'All Articles', articles: pageDocs, pageData, adBio, adBook})
};

module.exports.categories = (req, res) => {
    res.render('articles/categories', {categories})
};

module.exports.perCategory = async (req, res) => {
    const {category} = req.query;
    const articles = await Doc.find({docType: 'article', isApproved: true, role: category}).sort({name : 1});
    const [pageDocs, pageData] = paginate(req, articles)
    const adBio = await Doc.aggregate([{ $match: {docType: 'biography'} }, { $sample: { size: 2 } }]);
    const adBook = await Book.aggregate([{ $match: {filetype: 'pdf'} }, { $sample: { size: 1 } }]);
    res.render('articles/list', {category, articles: pageDocs, pageData, adBio, adBook});
};

module.exports.renderNewForm = (req, res) => {
    res.render('articles/new', {categories})
};

module.exports.createArticle = async (req, res) => {
    const article = new Doc(req.body.article)
    const clean = sanitizeHtml(article.story, {
        allowedTags: ['h4', 'h5', 'a', 'p', 'strong', 'em', 'b', 'i', 'sub', 'sup', 'img', 'ol', 'ul', 'li', 'span', 'strike', 'u', 'blockquote', 'div', 'br'],
        allowedAttributes: { 'a': ['href'], 'img': ['src'], '*': ['style'] },
    });
    article.docType = 'article' 
    article.dateTime = Date.now();
    article.contributor = req.user._id;
    fs.writeFileSync('outputText.txt', clean);
    article.story = 'article/' + Date.now().toString() + '_' + article.name + '.txt';
    const myBuffer = await fs.readFileSync('outputText.txt');
    await putImage(article.story, myBuffer);
    await article.save();
    req.flash('success', `${article.name.toUpperCase()} saved successfully, awaiting approval.`);
    // res.redirect(`/articles/${article._id}`)
    res.status(200).send({message: `${article.name.toUpperCase()} posted successfully, awaiting approval.`, redirectUrl: `/articles/${article._id}`})
};

module.exports.search = async (req, res) => {
    const item = req.query.search;
    const articles = await Doc.find({docType: 'article', isApproved: true}).sort({name: 1});
    const result = [];
    articles.forEach((article) => {
        article.name.toLowerCase().includes(item.toLowerCase()) && result.push(article);
    })
    const [pageDocs, pageData] = paginate(req, result)
    const adBio = await Doc.aggregate([{ $match: {docType: 'biography'} }, { $sample: { size: 2 } }]);
    const adBook = await Book.aggregate([{ $match: {filetype: 'pdf'} }, { $sample: { size: 1 } }]);
    res.render('articles/list', {category: `Search🔍: ${item}`, articles: pageDocs, pageData, adBio, adBook});
};

module.exports.showArticle = async (req, res) => {
    const article = await Doc.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    });
    if(!article) {
        req.flash('error', 'Not in directory!');
        return res.redirect('/articles');
    }
    const adBio = await Doc.aggregate([{ $match: {docType: 'biography'} }, { $sample: { size: 2 } }]);
    const adBook = await Book.aggregate([{ $match: {filetype: 'pdf'} }, { $sample: { size: 1 } }]);
    res.render('articles/show', {article, adBio, adBook});
};

module.exports.story = async (req, res) => {    
    const q = req.query.q;
    const article = await Doc.findById(req.params.id);
    const data = await getImage(article.story);
    const story = data.Body.toString();
    if (Number(q)) {
        return res.send(story.substring(0, q) + '...');
    }
    res.send(story);
};

module.exports.image = async (req, res) => {    
    const article = await Doc.findById(req.params.id);
    const data = await getImage(article.image.key);
    const src = `data:image/png;base64,${encode(data.Body)}`;
    res.send(src);
};

module.exports.renderImageUploadForm = (req, res) => {
    const id = req.params.id;
    const route = `/Articles/${id}/imageUpload`;
    const msg = 'Upload Article Image';
    res.render('imageUpload', {route, msg});
};

module.exports.uploadArticleImage = async function(req, res) {
    const article = await Doc.findById(req.params.id);
    article.image.key = 'article-img/' + Date.now().toString() + '_' + req.file.originalname;
    await uploadCompressedImage(req.file.path, article.image.key);
    await article.save();
    req.flash('success', 'Successfully saved article');
    res.redirect(`/articles/${article._id}`)
};

module.exports.addReview = async (req, res) => {
    // console.log(req)
    const article = await Doc.findById(req.params.id);
    const review = new Review(req.body.review);
    review.parentId = article._id.toString();
    review.author = req.user._id;
    review.category = 'Articles';
    review.dateTime = Date.now();
    article.reviews.unshift(review);
    await review.save();
    await article.save();
    res.redirect(`/articles/${article._id}`)
};

module.exports.deleteReview = async (req, res) => {
    const {articleId, reviewId} = req.params;
    await Doc.findByIdAndUpdate(articleId, {$pull: {reviews: reviewId} } );
    await Review.findByIdAndDelete(reviewId);
    res.send(reviewId);
}

module.exports.suggest = async (req, res) => {
    const review = new Review(req.body.review);
    review.category = 'Suggest';
    review.parentId = 'article';
    review.author = req.user._id;
    await review.save();
    let mailOptions = {
        from: '"God-In-Prints Libraries" <godinprintslibraries@gmail.com>', 
        to: [req.user.email, 'gipteam@hotmail.com'],
        subject: 'Article Suggestion',
        html: `<p>Hello ${req.user.firstName.toUpperCase()},<p/><br>
          <p>Thank you for taking out time to fill the suggestion form. We will endeavour to make the requested resource available as soon as possible.<p/><br>
          <p>Regards,<p/><br><b>GIP Library<b/>`
    };
    const {transporter} = require('../functions');
    transporter.sendMail(mailOptions);
    res.status(200).send('Success')
}