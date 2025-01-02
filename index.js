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
const mongoSanitize = require('express-mongo-sanitize');
const ExpressError = require('./utils/ExpressError');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const FacebookStrategy = require('passport-facebook');
const GoogleStrategy = require('passport-google-oidc');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const User = require('./models/user');


const userRoutes = require('./routes/users');
const bookRoutes = require('./routes/books');
const biographyRoutes = require('./routes/biographies');
const articleRoutes = require('./routes/articles');
const featuresRoutes = require('./routes/features');
const bibleRoutes = require('./routes/bible');
const mediaRoutes = require('./routes/media');
const reviewRoutes = require('./routes/reviews');
const adminApiRoutes = require('./routes/api/admin')
const gipnewsRoutes = require('./routes/api/gipnews')
const adminRoutes = require('./routes/admin')

const { readFileSync, writeFileSync } = require('fs');
const { connect: dbConnect } = require('./utils/main/db');
const { sessionConfig } = require('./utils/main/session');
const { helmetDirectives } = require('./utils/main/helmet');
const { facebookConfig, facebookCallback, googleConfig, googleCallback } = require('./utils/main/auth');
const { updateLocals } = require('./utils/main/locals');

// connect to database
dbConnect();

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')))
app.use('/', express.static('uploads'));
app.use(mongoSanitize({
    replaceWith: '_' 
}))

app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
}));



app.use((req, res, next) => {
  res.removeHeader("Cross-Origin-Resource-Policy")
  res.removeHeader("Cross-Origin-Embedder-Policy")
  next()
})
app.use(
    helmet.contentSecurityPolicy({
        // crossOriginEmbedderPolicy: false,
        directives: helmetDirectives,
    })
);


app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(new LocalStrategy(User.authenticate()));
passport.use(new FacebookStrategy(facebookConfig, facebookCallback));
passport.use(new GoogleStrategy(googleConfig, googleCallback));

app.use(updateLocals)


app.use('/', userRoutes);
app.use('/books', bookRoutes);
app.use('/biographies', biographyRoutes)
app.use('/articles', articleRoutes)
app.use('/features', featuresRoutes)
app.use('/bible', bibleRoutes)
app.use('/media', mediaRoutes)
app.use('/reviews', reviewRoutes)
app.use('/admin', adminApiRoutes)
app.use('/api/gipnews', gipnewsRoutes)
app.use('/admin', adminRoutes);
 

app.get('/', async (req, res) => {
    res.render('home');
});

app.get('/growth', async (req, res) => {
    const growthHabits = require("./personal_growth")

    const Book = require('./models/book');
    const adBook = await Book.aggregate([{ $match: { filetype: 'pdf' } }, { $sample: { size: 1 } }]);
    const title = 'GIP Library - Personal Growth Strategies'
    res.render('growth', {growthHabits, adBook, title});
});

app.get('/resources', async (req, res) => {
    res.render('resources', {title: 'GIP Library - Other Resources'});
});

app.get('/about', async (req, res) => {
    res.render('about');
});

app.get('/terms', async (req, res) => {
    res.render('terms');
});

app.get('/privacy', async (req, res) => {
    res.render('privacy');
});

app.all('*', (req, res, next) => { 
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    console.log(err.message)
    try {
        let error = readFileSync('console.txt');
        error += err.message + ' - ' + req.url + ' - ' + (new Date()).toString() + '\n\n';
        writeFileSync('console.txt', error);
    } catch (error) {
        writeFileSync('console.txt', err.message + ' - ' + req.url + ' - ' + (new Date()).toString() + '\n\n');
    }
    res.status(statusCode).render('error', { err , title: 'Error Page'})
})

 
const port = process.env.PORT || 8000; 
app.listen(port, () => { 
    console.log(`Serving:- http://localhost:${port}`) 
}) 