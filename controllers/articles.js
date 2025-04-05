const Doc = require('../models/doc')
const Book = require('../models/book');
const Review = require('../models/review');
const sanitizeHtml = require('sanitize-html');
const capitalize = require('../utils/capitalize');


const {getImage, putImage, paginate, uploadCompressedImage, encode} = require("../functions");

const fs = require('fs');

const categories = [
    'Daily Living', 'Dating/Courtship', 'Prayer/Warfare',
    'Spiritual Growth', 'Commitment/Consecration', 'Evangelism', 'Marriage/Family Life', 'Grace/Conversion', 
    'Afterlife', 'Personal/Financial Development', 'Biography', 'Others'
];


module.exports.index = async (req, res) => {
    let articles = await Doc.find({docType: 'article', isApproved: true}) // Doc.aggregate([{ $match: {docType: 'article', isApproved: true} }, { $sample: { size: 300 } }]);
    articles = articles.sort(() => 0.5 - Math.random());
    articles = categories.map(cat => articles.find(art => art.role == cat));
    const title = 'GIP Library - Feature Articles on Christian Faith';
    res.render('articles/index', { articles, title})
};

module.exports.list = async (req, res) => {
    const articles = await Doc.find({docType: 'article', isApproved: true}).sort({name : 1});
    const [pageDocs, pageData] = paginate(req, articles);
    const title = 'GIP Library - List of Articles on Christian Faith';
    res.render('articles/list', {category : 'All Articles', articles: pageDocs, pageData, title})
};

module.exports.categories = (req, res) => {
    const title = 'GIP Library - Articles Categories';
    res.render('articles/categories', {categories, title})
};

module.exports.perCategory = async (req, res) => {
    const {category} = req.query;
    const articles = await Doc.find({docType: 'article', isApproved: true, role: category}).sort({name : 1});
    const [pageDocs, pageData] = paginate(req, articles);
    const title = `Articles on ${category}`;
    res.render('articles/list', {category, articles: pageDocs, pageData, title});
};

module.exports.random = async (req, res) => {
    const [random] = await Doc.aggregate([{ $match: {docType: 'article', isApproved: true} }, { $sample: { size: 1 } }])
    res.status(200).send(random);
}

module.exports.renderNewForm = async (req, res) => {
    const title = 'Post an Article';
    let name = '';
    if (req.query.requestId) {
        const request = await Review.findById(req.query.requestId);
        name = request.text; 
    }
    res.render('articles/new', {categories, name, title})
};

module.exports.createArticle = async (req, res) => {
    const article = new Doc(req.body.article)
    // article.text = sanitizeHtml(article.story, {
    //     allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'strong', 'em', 'b', 'i', 'sub', 'sup', 'img', 'ol', 'ul', 'li', 'span', 'strike', 'u', 'blockquote', 'div', 'br'],
    //     allowedAttributes: { 'img': ['src'], '*': ['style'] },
    // });
    article.name = article.name.toLowerCase().replace(/\?/g, '');
    article.uid = encodeURIComponent(article.name.toLowerCase().replace(/ /g, '-'));
    article.docType = 'article' 
    article.dateTime = Date.now();
    article.contributor = req.user._id;
    article.isApproved = (req.user.admin == 5);
    article.story = 'article/' + Date.now().toString() + '_' + article.uid + '.txt';
    const myBuffer = Buffer.from(article.text, 'utf8');
    await article.save();
    await putImage(article.story, myBuffer);
    req.flash('success', `${article.name.toUpperCase()} saved successfully, awaiting approval.`);
    res.redirect(`/articles/${article._id}`)
    // res.status(200).send({message: `${article.name.toUpperCase()} posted successfully, awaiting approval.`, redirectUrl: `/articles/${article._id}`})
    
    if (req.query.requestId) {
        const request = await Review.findById(req.query.requestId);
        request.likes[0] = req.user._id;
        await request.save();
    }
};

module.exports.search = async (req, res) => {
    const advSearch = require("../utils/search");
    const item = req.query.search;
    const articles = await Doc.find({docType: 'article'});
    const result = item?.trim() ? advSearch(articles, item) : articles;
    const [pageDocs, pageData] = paginate(req, result)
    const title = `Search for Articles - ${item}`;
    res.render('articles/list', {category: `🔍: ${item}`, articles: pageDocs, pageData, title});
};

module.exports.showArticle = async (req, res) => {
    const article = await Doc.findById(req.params.id).populate({
        path: 'reviews', populate: { path: 'author' }
    });
    if(!article) {
        req.flash('error', 'Not in directory!');
        return res.redirect('/articles');
    }
    const title = `Article - ${article.name}`;
    res.render('articles/show', {article, title, canonicalUrl:`https://godinprints.org/articles/2/${article.uid}`});
};

module.exports.show = async (req, res) => {
    const article = await Doc.findOne({ name: req.params.name }).populate({
        path: 'reviews', populate: { path: 'author' }
    });
    if(!article) { 
        req.flash('error', 'Not in directory!');
        return res.redirect('/articles');
    }
    const title = `Article - ${article.name}`;
    res.render('articles/show', {article, title, canonicalUrl:`https://godinprints.org/articles/2/${article.uid}`});
};

module.exports.show2 = async (req, res) => {
    const article = await Doc.findOne({ uid: req.params.uid }).populate({
        path: 'reviews', populate: { path: 'author' }
    });
    if(!article) { 
        req.flash('error', 'Not in directory!');
        return res.redirect('/articles');
    }
    const title = `Article - ${article.name}`;
    res.render('articles/show', {article, title, canonicalUrl:`https://godinprints.org/articles/2/${article.uid}`});
};

module.exports.story = async (req, res) => {    
    const q = req.query.q;
    const article = await Doc.findById(req.params.id);
    // const data = await getImage(article.story);
    const story = article.text.replace(/<[^>]*>/g, " ");
    if (Number(q)) {
        return res.send(story.substring(0, q) + '...');
    }
    res.send(story);
};

// not in use
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
    res.render('imageUpload', {route, msg, title: msg});
};

module.exports.uploadArticleImage = async function(req, res) {
    const article = await Doc.findById(req.params.id);
    if (article.image.key == 'none') {
        article.image.key = 'article-img/' + Date.now().toString() + '_' + req.file.originalname;
    }
    await uploadCompressedImage(req.file.path, article.image.key);
    await article.save();
    fs.unlinkSync(req.file.path);
    req.flash('success', 'Successfully saved article.');
    res.redirect(`/articles/${article._id}`)
};

module.exports.imageLink = async function(req, res) {
    const article = await Doc.findById(req.params.id);
    article.image.link = req.body.link;
    await article.save();
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
    res.redirect(`/articles/${article._id}#comments`)
};

module.exports.deleteReview = async (req, res) => {
    const {articleId, reviewId} = req.params;
    await Doc.findByIdAndUpdate(articleId, { $pull: {reviews: reviewId} } );
    await Review.findByIdAndDelete(reviewId);
    res.send(reviewId);
}

module.exports.suggest = async (req, res) => {
    const review = new Review(req.body.review);
    review.category = 'Suggest';
    review.parentId = 'articles';
    review.author = req.user._id;
    await review.save();
    let mailOptions = {
        from: '"God-In-Prints Libraries" <godinprintslibraries@gmail.com>', 
        to: [req.user.email, 'gipteam@hotmail.com'],
        subject: 'Article Suggestion',
        html: `<p>Hello ${req.user.firstName.toUpperCase()},</p><br>
          <p>Thank you for taking out time to fill the suggestion form. We will endeavour to make the requested resource available as soon as possible.</p><br>
          <p>Regards,</p><br><b>GIP Library</b>`
    };
    const {transporter} = require('../functions');
    transporter.sendMail(mailOptions);
    res.status(200).send('Success')
}

module.exports.writexml = async (req, res) => {
    const arts = await Doc.find({docType: 'article'});
    let xmap = '';
    for (let art of arts) {
        xmap += `<url>\n\ \ <loc>https://godinprints.org/articles/2/${encodeURIComponent(
            art.uid
        ).replace(/\'/g, "%27").replace(/\(/g, "%28").replace(/\)/g, "%29")
        }</loc>\n\ \ <lastmod>2023-04-08T10:24:55+00:00</lastmod>\n\ \ <priority>0.64</priority>\n</url>\n`
    }
    fs.writeFileSync('articles.xml', xmap);
    res.status(200).send('done');
}