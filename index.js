if(process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const ejsMate = require('ejs-mate');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const mongoSanitize = require('express-mongo-sanitize');


const bookRoutes = require('./routes/books');
const biographyRoutes = require('./routes/biographies');
const articleRoutes = require('./routes/articles');
const featuresRoutes = require('./routes/features');
const bibleRoutes = require('./routes/bible');


const dbUrl = process.env.DB_URL; // || 'mongodb://localhost:27017/christian-world-libraries';
mongoose.connect(dbUrl, {
    useNewUrlParser: true, 
    // useCreateIndex: true, 
    useUnifiedTopology: true,
    // useFindAndModify: false
});
 
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:")); 
db.once("open", () => {
    console.log("Database connected"); 
});


app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')))
app.use('/', express.static('uploads'));
app.use(mongoSanitize({
    replaceWith: '_' 
}))

 
const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

const sessionConfig = {
    // store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 30,
        maxAge: 1000 * 60 * 60 * 24 * 30
    }
}

app.use(session(sessionConfig));
app.use(flash());


app.use((req, res, next) => {
    // res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})


app.use('/books', bookRoutes)
app.use('/biographies', biographyRoutes)
app.use('/articles', articleRoutes)
app.use('/features', featuresRoutes)
app.use('/bible', bibleRoutes)
 

app.get('/', async (req, res) => {
    res.render('home');
});

app.get('/growth', async (req, res) => {
    const growthHabits = require("./personal_growth")

    const Book = require('./models/book');
    const adBook = await Book.aggregate([{ $sample: { size: 1 } }]);

    res.render('growth', {growthHabits, adBook});
});

app.get('/resources', async (req, res) => {
    res.render('resources');
});

app.get('/about', async (req, res) => {
    res.render('about');
});


const port = process.env.PORT || 8000; 
app.listen(port, () => { 
    console.log(`Serving on port ${port}`) 
}) 