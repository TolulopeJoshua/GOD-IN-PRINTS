const express = require('express');
const router = express.Router();
const catchAsync = require('../../utils/catchAsync');
const sanitizeHtml = require('sanitize-html');
const fs = require('fs');
const bcrypt = require ('bcrypt');

const Doc = require('../../models/doc')
const Book = require('../../models/book');
const Review = require('../../models/review')
const User = require('../../models/user')
const { upload0, deleteImage, uploadCompressedImage, getImage, putImage } = require('../../functions');
const { buffer } = require('sharp/lib/is');
const { request } = require('http');
const { validateAdmin } = require('../../middleware');

router.get('/all', validateAdmin, catchAsync(async (req, res) => {
    const articlesData = Doc.find({docType: 'article'})
    const biographiesData = Doc.find({docType: 'biography'})
    const booksData = Book.find({})
    const requestsData = Review.find({category: 'Suggest'}).populate('author')
    const usersData = User.find({})
    const [articles, biographies, books, requests, users] = await Promise.all([articlesData, biographiesData, booksData, requestsData, usersData]);
    return res.status(200).json({articles, biographies, books, requests, users})
}))

router.put('/doc', validateAdmin, catchAsync(async (req, res) => {
    await Doc.validate(req.body);
    const result = await Doc.replaceOne({ _id: req.body._id }, req.body);
    if (result.acknowledged) {
        return res.status(200).json(req.body)
    } else {
        return res.status(500).send('An error occured')
    }
}))

router.delete('/doc/:id', validateAdmin, catchAsync(async (req, res) => {
    const doc = await Doc.findById(req.params.id);
    if (doc.image.key != 'none') {
        await deleteImage(doc.image.key)
    }
    await deleteImage(doc.story);
    const deleted = await Doc.findByIdAndDelete(doc._id)
    res.status(200).send(deleted);
}))

router.put('/book', validateAdmin, catchAsync(async (req, res) => {
    await Book.validate(req.body);
    const result = await Book.replaceOne({ _id: req.body._id }, req.body);
    if (result.acknowledged) {
        return res.status(200).json(req.body)
    } else {
        return res.status(500).send('An error occured')
    } 
}))

router.delete('/book/:id', validateAdmin, catchAsync(async (req, res) => {
    const book = await Book.findById(req.params.id);
    if (book.image.key != 'none') {
        await deleteImage(book.image.key)
    }
    await deleteImage(book.document.key);
    const deleted = await Book.findByIdAndDelete(book._id)
    res.status(200).send(deleted);
}))

router.put('/bookImage/:id', validateAdmin, upload0.single("image"), catchAsync(async (req, res) => {
    const book = await Book.findById(req.params.id);
    const oldKey = book.image.key;
    book.image.key = 'book-img/' + Date.now().toString() + '_' + req.file.originalname;
    await uploadCompressedImage(req.file.path, book.image.key);
    await book.save(); 
    if (oldKey != 'none') {
        await deleteImage(oldKey)
    }
    res.status(200).send(book);
}))

router.put('/docImage/:id', validateAdmin, upload0.single("image"), catchAsync(async (req, res) => {
    const doc = await Doc.findById(req.params.id);
    const oldKey = doc.image.key;
    doc.image.key = `${doc.docType == 'article' ? 'article' : 'bio'}-img/` + Date.now().toString() + '_' + req.file.originalname;
    await uploadCompressedImage(req.file.path, doc.image.key);
    await doc.save(); 
    if (oldKey != 'none') {
        await deleteImage(oldKey)
    } 
    res.status(200).send(doc);
}))

router.get('/text/:id', catchAsync(async (req, res) => {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) return res.status(400).send();
    if (token == 'fake_1') return res.status(200).send('Lorem ipsum, dolor sit amet consectetur adipisicing elit. Dicta, voluptatem laudantium! Aliquam soluta ad nulla atque ea! Fugiat, accusamus. Nemo voluptatum similique provident odio molestias, accusamus quos quam. Dolorem assumenda sunt eligendi in ipsam. Beatae blanditiis impedit quasi ratione, non nemo sit, corrupti voluptates officiis itaque reprehenderit pariatur corporis, ipsam ipsa provident incidunt veniam iste vel nulla fugiat quibusdam veritatis laboriosam nisi. Voluptates quas tenetur qui doloremque at mollitia voluptatem in fugit voluptatum, delectus ut totam aperiam aspernatur vel amet temporibus autem excepturi numquam. Expedita tenetur accusamus eligendi eius, incidunt nemo officiis quaerat voluptates nostrum officia, iste eveniet vero consequatur sit! Consectetur doloribus ipsa a velit consequatur quisquam voluptates quia mollitia totam quasi facere, architecto eius officia id consequuntur animi porro sequi illo dolores ad? Deserunt nobis nihil a voluptatem at debitis doloribus maiores blanditiis dolores quis? Magni similique praesentium maxime nulla velit, eos minima voluptatibus aut voluptates temporibus! Ut, tempora eligendi placeat molestiae odit nemo necessitatibus! Non sit est perspiciatis minus ex. Cum dignissimos veritatis assumenda ullam veniam architecto illum distinctio quod nemo iusto quia molestias odit beatae eveniet nisi, iste ipsum cumque praesentium ut sit reiciendis nesciunt. Quo vitae qui praesentium! Consequatur sapiente quia nostrum odio aliquid neque quos perspiciatis error velit, eligendi totam veritatis id est officia labore dolore fugiat illo earum deleniti. Esse aliquam voluptatibus sit eveniet. Recusandae dolorem deleniti debitis nobis laudantium quasi assumenda commodi vitae fugit exercitationem eligendi soluta quae nulla nostrum, beatae officiis voluptas nesciunt dolores minima non unde porro. Qui a officiis optio, dolorem id iusto asperiores debitis illo fugiat assumenda incidunt deserunt aliquam. Aut cum magni veniam voluptates mollitia. Veritatis nulla, odit molestiae nemo facere modi hic. Modi ut porro perferendis, laborum quisquam voluptas possimus, maxime quidem deleniti eveniet reprehenderit mollitia praesentium facere laudantium voluptates eius sunt dolore incidunt consequatur. Architecto facere amet atque ipsam tenetur culpa ad facilis quod recusandae ut? Quos sed eveniet autem illum placeat. Est rem deleniti cum illum perspiciatis perferendis. Quae sint temporibus fugiat cum molestias architecto ex illum? Autem nisi vero illo? Eum nihil nobis, a quos facilis eos excepturi rem quam in reiciendis mollitia similique corporis ex, optio nesciunt amet. Ad est praesentium dolor nam? Adipisci delectus laborum amet necessitatibus doloremque exercitationem autem quasi aperiam, asperiores fuga tempore voluptatem suscipit perspiciatis ullam fugit vitae repudiandae cumque aliquid ea alias dolores obcaecati! Earum cumque adipisci laudantium voluptates quidem tempora debitis? Accusamus sit dolorem ducimus eligendi sequi ipsa minus voluptas quas! Numquam explicabo quaerat esse dicta doloremque voluptate unde, aperiam molestiae voluptatum architecto rerum? Facere reprehenderit vel consectetur possimus itaque asperiores fuga veniam aspernatur voluptates, inventore iste? At ipsum numquam minus quam itaque facilis. Eos nostrum labore aspernatur laudantium, facilis blanditiis sit vero omnis distinctio eius ad fuga mollitia voluptates repudiandae, fugiat dignissimos tenetur ipsum. Perspiciatis natus, possimus voluptatibus recusandae, quam pariatur ipsa odit nam vel est expedita, consequatur facere sequi suscipit. Et autem quos maxime dolorum alias obcaecati quam architecto dolore tempore, repellendus laborum, debitis culpa, exercitationem placeat expedita. Voluptatem delectus beatae facilis id rem.');
    const doc = await Doc.findById(req.params.id);
    const data = await getImage(doc.story);
    res.status(200).send(data.Body.toString())
}))

router.put('/text/:id', validateAdmin, catchAsync(async (req, res) => {
    const doc = await Doc.findById(req.params.id);
    await deleteImage(doc.story)
    const clean = sanitizeHtml(req.body.text, {
        allowedTags: ['h4', 'h5', 'a', 'p', 'strong', 'em', 'b', 'i', 'sub', 'sup', 'img', 'ol', 'ul', 'li', 'span', 'strike', 'u', 'blockquote', 'div', 'br'],
        allowedAttributes: { 'a': ['href'], 'img': ['src'], '*': ['style'] },
    });
    fs.writeFileSync('outputText.txt', clean);
    doc.story = `${doc.docType == 'article' ? 'article' : 'bio'}/` + Date.now().toString() + '_' + doc.name + '.txt';
    const myBuffer = fs.readFileSync('outputText.txt');
    await doc.save();
    await putImage(doc.story, myBuffer);
    res.status(200).send(doc);
}))

router.put('/admin', validateAdmin, catchAsync(async (req, res) => {
    const user = await User.findById(req.body.user);
    user.admin = req.body.level;
    await user.save();
    res.status(200).send(user);
}))

router.get('/requests', validateAdmin, catchAsync(async (req, res) => {
    const requests = await Review.find({category: 'Suggest'}).populate('author');
    res.status(200).send(requests);
}))

router.post('/login', catchAsync(async (req, res) => {
    const {username, password} = req.body;
    const authenticate = User.authenticate();
    authenticate(username, password, function(err, result) {
        if (err) { return res.status(404).send('Authentication failed!') }
        if (!result || !result.admin) { return res.status(404).send('Authentication failed!') }
        const token = (Math.random()).toString(36).slice(2) + '_' + result._id;
        bcrypt.hash(token, 10, async function(err, hash) {
            result.adminToken = {
                hash,
                expiry: Date.now() + (24 * 60 * 60 * 1000)
            }
            await result.save();
            res.status(200).send({token, name: result.firstName, admin: result.admin, email: result.email})
        });
    });
}))

router.post('/logout', validateAdmin, catchAsync(async (req, res) => {
    const user = await User.findByUsername(req.body.email);
    user.adminToken = { hash: '', expiry: null };
    await user.save();
    res.status(200).send('OK');
}))


module.exports = router;