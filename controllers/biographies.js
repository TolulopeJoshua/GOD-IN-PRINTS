const Doc = require('../models/doc')
const Book = require('../models/book');
const Review = require('../models/review');
const sanitizeHtml = require('sanitize-html');

const fs = require('fs');

const {getImage, putImage, paginate, uploadCompressedImage, encode} = require("../functions")


module.exports.index = async (req, res) => {
    const biographies = await Doc.aggregate([{ $match: {docType: 'biography', isApproved: true} }, { $sample: { size: 4 } }]);
    const title = 'GIP Library - Feature Biographies of Famous Christians';
    res.render('biographies/index', {biographies, title})
};

module.exports.list = async (req, res) => {
    const q = req.query.q;
    const searchObj = q == 'birth' ? {birthYear: 1} : q == 'role' ? {role: 1, name: 1} : {name: 1};
    const biographies = await Doc.find({docType: 'biography', isApproved: true}).sort(searchObj);
    const [pageDocs, pageData] = paginate(req, biographies)
    const title = 'GIP Library - List of Biographies of Famous Christians';
    res.render('biographies/list', {category: 'Bio Gallery', biographies: pageDocs, pageData, title})
};

module.exports.random = async (req, res) => {
    const [random] = await Doc.aggregate([{ $match: {docType: 'biography', isApproved: true} }, { $sample: { size: 1 } }]);
    res.status(200).send(random);
}

module.exports.renderNewForm = async (req, res) => {
    const title = 'Post a Biography';
    let name = '';
    if (req.query.requestId) {
        const request = await Review.findById(req.query.requestId);
        name = request.text;
    }
    res.render('biographies/new', {name, title})
};

module.exports.createBiography = async (req, res) => {
    const biography = new Doc(req.body.biography)
    biography.text = sanitizeHtml(biography.story, {
        allowedTags: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'strong', 'em', 'b', 'i', 'sub', 'sup', 'img', 'ol', 'ul', 'li', 'span', 'strike', 'u', 'blockquote', 'div', 'br'],
        allowedAttributes: { 'img': ['src'], '*': ['style'] },
    });
    biography.name = biography.name.replace('?', '');
    biography.uid = biography.name.toLowerCase().replace(/ /g, '-');
    biography.docType = 'biography' 
    biography.dateTime = Date.now();
    biography.contributor = req.user._id;
    fs.writeFileSync('outputText.txt', biography.text);
    biography.story = 'bio/' + Date.now().toString() + '_' + biography.name + '.txt';
    const myBuffer = fs.readFileSync('outputText.txt');
    await biography.save();
    await putImage(biography.story, myBuffer);
    req.flash('success', `${biography.name.toUpperCase()}'s biography posted. Kindly upload picture`);
    // res.redirect(`/biographys/${biography._id}`)
    res.status(200).send({message: 'success', redirectUrl: `/biographies/${biography._id}/imageUpload`})
    
    if (req.query.requestId) {
        const request = await Review.findById(req.query.requestId);
        request.likes[0] = req.user._id;
        await request.save();
    }
};

module.exports.search = async (req, res) => {
    const item = req.query.search;
    const biographies = await Doc.find({docType: 'biography'}).sort({name: 1});
    const result = [];
    biographies.forEach((biography) => {
        biography.name.toLowerCase().includes(item.toLowerCase()) && result.push(biography);
    })
    const [pageDocs, pageData] = paginate(req, result)
    const title = `Search for Biographies -${item}`;
    res.render('biographies/list', {category: `Search🔍: ${item}`, biographies: pageDocs, pageData, title});
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
    const title = `Biography - ${biography.name}`;
    res.render('biographies/show', {biography, title, canonicalUrl:`https://godinprints.org/biographies/2/${biography.uid}`});
};

module.exports.show = async (req, res) => {
    const biography = await Doc.findOne({ name: req.params.name}).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    });
    if(!biography) {
        req.flash('error', 'Not in directory!');
        return res.redirect('/biographies');
    }
    const title = `Biography - ${biography.name}`;
    res.render('biographies/show', {biography, title, canonicalUrl:`https://godinprints.org/biographies/2/${biography.uid}`});
};

module.exports.show2 = async (req, res) => {
    const biography = await Doc.findOne({ uid: req.params.uid}).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    });
    if(!biography) {
        req.flash('error', 'Not in directory!');
        return res.redirect('/biographies');
    }
    const title = `Biography - ${biography.name}`;
    res.render('biographies/show', {biography, title, canonicalUrl:`https://godinprints.org/biographies/2/${biography.uid}`});
};

module.exports.story = async (req, res) => {    
    const {q} = req.query;
    // console.log(q)
    const biography = await Doc.findById(req.params.id);
    const data = await getImage(biography.story);
    const story = data.Body.toString().replace(/<[^>]*>/g, " ");
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
    res.render('imageUpload', {route, msg, title: msg});
};

module.exports.uploadBiographyImage = async function(req, res) {
    const biography = await Doc.findById(req.params.id);
    if (biography.image.key == 'none') {
        biography.image.key = 'bio-image/' + Date.now().toString() + '_' + req.file.originalname;
        await uploadCompressedImage(req.file.path, biography.image.key);
        await biography.save(); 
        req.flash('success', 'Successfully posted biography, awaiting approval.');
    } else {
        req.flash('error', 'Biography already has an image.');
    }
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
    review.parentId = 'biographies';
    review.author = req.user._id;
    await review.save();
    let mailOptions = {
        from: '"God-In-Prints Libraries" <godinprintslibraries@gmail.com>', 
        to: [req.user.email, 'gipteam@hotmail.com'],
        subject: 'Biography Suggestion',
        html: `<p>Hello ${req.user.firstName.toUpperCase()},</p><br>
          <p>Thank you for taking out time to fill the suggestion form. We will endeavour to make the requested resource available as soon as possible.</p><br>
          <p>Regards,</p><br><b>GIP Library</b>`
    };
    const {transporter} = require('../functions');
    transporter.sendMail(mailOptions);
    res.status(200).send('Success')
}

module.exports.writexml = async (req, res) => {
    const bios = await Doc.find({docType: 'biography'});
    let xmap = '';
    for (let bio of bios) {
        xmap += `<url>\n\ \ <loc>https://godinprints.org/biographies/2/${encodeURI(bio.uid)}</loc>\n\ \ <lastmod>2023-04-08T10:24:55+00:00</lastmod>\n\ \ <priority>0.64</priority>\n</url>\n`
    }
    fs.writeFileSync('biographies.xml', xmap);
    res.status(200).send('done');
}