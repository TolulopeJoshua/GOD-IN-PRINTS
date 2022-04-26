const Doc = require('../models/doc');

const {getImage, putImage, paginate, uploadCompressedImage, encode} = require("../functions");

const fs = require('fs');

const categories = [
    'Evangelism', 'Prayer/Warfare', 'Marriage/Family Life', 
    'Spiritual Growth', 'Commitment/Consecration', 'Grace/Conversion', 
    'Afterlife', 'Personal/Financial Development', 'Biography', 'Others'
];


module.exports.index = async (req, res) => {
    const articles = await Doc.find({docType: 'article'});
    res.render('articles/index', {categories, articles})
};

module.exports.list = async (req, res) => {
    const articles = await Doc.find({docType: 'article'}).sort({name : 1});
    const [pageDocs, pageData] = paginate(req, articles)
    res.render('articles/list', {category : 'All Articles', articles: pageDocs, pageData})
};

module.exports.categories = (req, res) => {
    res.render('articles/categories', {categories})
};

module.exports.perCategory = async (req, res) => {
    const {category} = req.query;
    const articles = await Doc.find({docType: 'article', role: category}).sort({name : 1});
    const [pageDocs, pageData] = paginate(req, articles)
    res.render('articles/list', {category, articles: pageDocs, pageData});
};

module.exports.renderNewForm = (req, res) => {
    res.render('articles/new', {categories})
};

module.exports.createArticle = async (req, res) => {
    const article = new Doc(req.body.article)
    article.docType = 'article' 
    article.dateTime = Date.now();
    fs.writeFileSync('outputText.txt', article.story);
    article.story = 'article/' + Date.now().toString() + '_' + article.name + '.txt';
    const myBuffer = await fs.readFileSync('outputText.txt');
    await putImage(article.story, myBuffer);
    await article.save();
    req.flash('success', `${article.name.toUpperCase()} saved successfully.`);
    res.redirect(`/articles/${article._id}`)
};

module.exports.search = async (req, res) => {
    const item = req.query.search;
    const articles = await Doc.find({docType: 'article'}).sort({name: 1});
    const result = [];
    articles.forEach((article) => {
        article.name.toLowerCase().includes(item.toLowerCase()) && result.push(article);
    })
    const [pageDocs, pageData] = paginate(req, result)
    res.render('articles/list', {category: `Search🔍: ${item}`, articles: pageDocs, pageData});
};

module.exports.showArticle = async (req, res) => {
    const article = await Doc.findById(req.params.id);
    if(!article) {
        req.flash('error', 'Not in directory!');
        return res.redirect('/articles');
    }
    article.imgSrc = async () => {
        const data = await getImage(article.image.key);
        const src = `data:image/png;base64,${encode(data.Body)}`;
        return src;
    }
    res.render('articles/show', {article});
};

module.exports.story = async (req, res) => {    
    const article = await Doc.findById(req.params.id);
    const data = await getImage(article.story);
    const story = data.Body.toString();
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
    // const image = await Jimp.read(req.file.path);
    // await image.resize(640, Jimp.AUTO);
    // await image.quality(20);
    // await image.writeAsync('output.jpg');
    // const myBuffer = await fs.readFileSync('output.jpg');
    // await putImage(article.image.key, myBuffer);
    // let files = await fs.readdirSync('uploads')
    // for (const file of files) {
    //   fs.unlinkSync(path.join('uploads', file));
    // }
    await uploadCompressedImage(req.file.path, article.image.key);
    await article.save();
    req.flash('success', 'Successfully saved article');
    res.redirect(`/articles/${article._id}`)
};