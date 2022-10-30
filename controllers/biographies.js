const Doc = require('../models/doc')
const Book = require('../models/book');
const Review = require('../models/review');
const sanitizeHtml = require('sanitize-html');

const fs = require('fs');

const {getImage, putImage, paginate, uploadCompressedImage, encode} = require("../functions")


module.exports.index = async (req, res) => {
    const biographies = await Doc.aggregate([{ $match: {docType: 'biography', isApproved: true} }, { $sample: { size: 4 } }]);
    const adArt = await Doc.aggregate([{ $match: {docType: 'article', isApproved: true} }, { $sample: { size: 2 } }]);
    const adBook = await Book.aggregate([{ $match: {filetype: 'pdf', isApproved: true} }, { $sample: { size: 1 } }]);
    res.render('biographies/index', {biographies, adArt, adBook})
};

module.exports.list = async (req, res) => {
    const q = req.query.q;
    const searchObj = q == 'birth' ? {birthYear: 1} : q == 'role' ? {role: 1, name: 1} : {name: 1};
    const biographies = await Doc.find({docType: 'biography', isApproved: true}).sort(searchObj);
    const [pageDocs, pageData] = paginate(req, biographies)
    const adArt = await Doc.aggregate([{ $match: {docType: 'article', isApproved: true} }, { $sample: { size: 2 } }]);
    const adBook = await Book.aggregate([{ $match: {filetype: 'pdf', isApproved: true} }, { $sample: { size: 1 } }]);
    res.render('biographies/list', {category: 'Bio Gallery', biographies: pageDocs, pageData, adArt, adBook})
};

module.exports.renderNewForm = (req, res) => {
    res.render('biographies/new')
};

module.exports.createBiography = async (req, res) => {
    const biography = new Doc(req.body.biography)
    const clean = sanitizeHtml(biography.story, {
        allowedTags: ['h4', 'h5', 'a', 'p', 'strong', 'em', 'b', 'i', 'sub', 'sup', 'img', 'ol', 'ul', 'li', 'span', 'strike', 'u', 'blockquote', 'div', 'br'],
        allowedAttributes: { 'a': ['href'], 'img': ['src'], '*': ['style'] },
    });
    biography.docType = 'biography' 
    biography.dateTime = Date.now();
    biography.contributor = req.user._id;
    fs.writeFileSync('outputText.txt', clean);
    biography.story = 'bio/' + Date.now().toString() + '_' + biography.name + '.txt';
    const myBuffer = fs.readFileSync('outputText.txt');
    await putImage(biography.story, myBuffer);
    await biography.save();
    req.flash('success', `${biography.name.toUpperCase()}'s biography posted. Kindly upload picture`);
    // res.redirect(`/biographys/${biography._id}`)
    res.status(200).send({message: 'success', redirectUrl: `/biographies/${biography._id}/imageUpload`})
};

module.exports.search = async (req, res) => {
    const item = req.query.search;
    const biographies = await Doc.find({docType: 'biography'}).sort({name: 1});
    const result = [];
    biographies.forEach((biography) => {
        biography.name.toLowerCase().includes(item.toLowerCase()) && result.push(biography);
    })
    const [pageDocs, pageData] = paginate(req, result)
    const adArt = await Doc.aggregate([{ $match: {docType: 'article', isApproved: true} }, { $sample: { size: 2 } }]);
    const adBook = await Book.aggregate([{ $match: {filetype: 'pdf', isApproved: true} }, { $sample: { size: 1 } }]);
    res.render('biographies/list', {category: `Search🔍: ${item}`, biographies: pageDocs, pageData, adArt, adBook});
};

module.exports.showBiography = async (req, res) => {
    const biography = await Doc.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    });
    if(!biography) {
        req.flash('error', 'Not in directory!');
        return res.redirect('/biographies');
    }
    res.render('biographies/show', {biography});
};

module.exports.story = async (req, res) => {    
    const {q} = req.query;
    // console.log(q)
    const biography = await Doc.findById(req.params.id);
    const data = await getImage(biography.story);
    const story = data.Body.toString().replaceAll("<[^>]*>", " ");
    if (Number(q)) {
        return res.send(story.substring(0, q) + '...');
    }
    res.send(story);
};

module.exports.image = async (req, res) => {    
    const biography = await Doc.findById(req.params.id);
    const data = await getImage(biography.image.key);
    const src = `data:image/png;base64,${encode(data.Body)}`;
    res.send(src);
};

module.exports.renderImageUploadForm = (req, res) => {
    const id = req.params.id;
    const route = `/Biographies/${id}/imageUpload`;
    const msg = 'Upload Picture for Bio.';
    res.render('imageUpload', {route, msg});
};

module.exports.uploadBiographyImage = async function(req, res) {
    const biography = await Doc.findById(req.params.id);
    biography.image.key = 'bio-image/' + Date.now().toString() + '_' + req.file.originalname;
    await uploadCompressedImage(req.file.path, biography.image.key);
    await biography.save(); 
    req.flash('success', 'Successfully posted biography, awaiting approval.');
    res.redirect(`/biographies/${biography._id}`);
};

module.exports.addReview = async (req, res) => {
    // console.log(req)
    const biography = await Doc.findById(req.params.id);
    const review = new Review(req.body.review);
    review.parentId = biography._id.toString();
    review.author = req.user._id;
    review.category = 'Biographies';
    review.dateTime = Date.now();
    biography.reviews.unshift(review);
    await review.save();
    await biography.save();
    res.redirect(`/biographies/${biography._id}`)
};

module.exports.deleteReview = async (req, res) => {
    const {biographyId, reviewId} = req.params;
    await Doc.findByIdAndUpdate(biographyId, {$pull: {reviews: reviewId} } );
    await Review.findByIdAndDelete(reviewId);
    res.send(reviewId);
}

module.exports.suggest = async (req, res) => {
    const review = new Review(req.body.review);
    review.category = 'Suggest';
    review.parentId = 'biography';
    review.author = req.user._id;
    await review.save();
    let mailOptions = {
        from: '"God-In-Prints Libraries" <godinprintslibraries@gmail.com>', 
        to: [req.user.email, 'gipteam@hotmail.com'],
        subject: 'Biography Suggestion',
        html: `<p>Hello ${req.user.firstName.toUpperCase()},<p/><br>
          <p>Thank you for taking out time to fill the suggestion form. We will endeavour to make the requested resource available as soon as possible.<p/><br>
          <p>Regards,<p/><br><b>GIP Library<b/>`
    };
    const {transporter} = require('../functions');
    transporter.sendMail(mailOptions);
    res.status(200).send('Success')
}