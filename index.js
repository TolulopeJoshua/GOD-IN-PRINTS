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
const ExpressError = require('./utils/ExpressError');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const FacebookStrategy = require('passport-facebook');
const GoogleStrategy = require('passport-google-oidc');
const User = require('./models/user');
const helmet = require('helmet');
const cors = require('cors');

const userRoutes = require('./routes/users');
const bookRoutes = require('./routes/books');
const biographyRoutes = require('./routes/biographies');
const articleRoutes = require('./routes/articles');
const featuresRoutes = require('./routes/features');
const bibleRoutes = require('./routes/bible');
const reviewRoutes = require('./routes/reviews');

const MongoStore = require("connect-mongo");


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

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')))
app.use('/', express.static('uploads'));
app.use(mongoSanitize({
    replaceWith: '_' 
}))

 
const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

const store = MongoStore.create({
    mongoUrl: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60
  });

  store.on("error", function (e) {
      console.log("SESSION STORE ERROR", e)
  })

const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24,
        maxAge: 1000 * 60 * 60 * 24
    }
}

app.use(session(sessionConfig));
app.use(flash());
app.use(helmet());

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    // "https://api.tiles.mapbox.com/",
    // "https://api.mapbox.com/",
    "https://kit.fontawesome.co/",
    "https://cdnjs.cloudflare.comm/",
    "https://cdn.jsdelivr.net",
    "https://cdn.jsdelivr.net",
    "https://kit.fontawesome.com",
    "https://connect.facebook.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    // "https://api.mapbox.com/",
    // "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
];
const connectSrcUrls = [
    "https://api.emailjs.com/",
    "https://ka-f.fontawesome.com",
    "https://www.facebook.com",
    "https://web.facebook.com",
    "https://graph.facebook.com",
    // "https://api.mapbox.com/",
    // "https://a.tiles.mapbox.com/",
    // "https://b.tiles.mapbox.com/",
    // "https://events.mapbox.com/",
];
const fontSrcUrls = [
    "https://fonts.gstatic.com/",
    "https://cdn.jsdelivr.net",
];
app.use((req, res, next) => {
  res.removeHeader("Cross-Origin-Resource-Policy")
  res.removeHeader("Cross-Origin-Embedder-Policy")
  next()
})
app.use(
    helmet.contentSecurityPolicy({
        // crossOriginEmbedderPolicy: false,
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            frameSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "*.amazonaws.com",
                "https://freepngimg.com",
                "https://i.swncdn.com",
                "https://dailymanna.dclm.org",
                "https://www.abideinchrist.com",
                "https://www.hymnlyrics.org",
                "https://ghs.deeperlifesermons.com.ng",
                "https://biblemenus.com/bh14.png",
                "https://www.bible.com",
                "https://tpc.googlesyndication.com",
                "https://www.kingjamesbibleonline.org",
                "https://www.biblereward.com",
                "https://www.christianityboard.com",
                "https://www.christianforums.com",
                "https://dclm.org",
                "https://www.facebook.com",

                // "https://res.cloudinary.com/depvtmznu/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                // "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);


app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.use(new LocalStrategy(User.authenticate()));
passport.use(new FacebookStrategy({
    clientID: process.env['FACEBOOK_CLIENT_ID'],
    clientSecret: process.env['FACEBOOK_CLIENT_SECRET'],
    callbackURL: '/redirect/fbk',
    state: true
  }, async function (accessToken, refreshToken, profile, cb) {
    let user = await User.find({ facebook_id: profile.id });
    if (user) {
      cb(null, user); //Login if User already exists
    } else { //else create a new User
      user = new User({
        facebook_id: profile.id, //pass in the id and displayName params from Facebook
        username: profile.displayName,
        firstName: profile.displayName.split(' ')[0],
        lastName: profile.displayName.split(' ')[1] || 'Person',
        dateTime: Date.now(),
        status: 'classic'
      });
      await user.save();
      cb(null, user);
    }
  }));

  passport.use(new GoogleStrategy({
    clientID: process.env['GOOGLE_CLIENT_ID'],
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
    callbackURL: '/redirect/ggl',
    scope: [ 'profile' ]
  }, async function (issuer, profile, cb) {
    let user = await User.find({ google_id: profile.id });
    if (user) {
      cb(null, user); //Login if User already exists
    } else { //else create a new User
      user = new User({
        google_id: profile.id, //pass in the id and displayName params from Google
        username: profile.displayName,
        firstName: profile.displayName.split(' ')[0],
        lastName: profile.displayName.split(' ')[1] || 'Person',
        dateTime: Date.now(),
        status: 'classic'
      });
      await user.save();
      cb(null, user);
    }
  }));

app.use((req, res, next) => {
    // console.log(req.user)
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})


app.use('/', userRoutes);
app.use('/books', bookRoutes);
app.use('/biographies', biographyRoutes)
app.use('/articles', articleRoutes)
app.use('/features', featuresRoutes)
app.use('/bible', bibleRoutes)
app.use('/reviews', reviewRoutes)
 

app.get('/', async (req, res) => {
    res.render('home');
});

app.get('/growth', async (req, res) => {
    const growthHabits = require("./personal_growth")

    const Book = require('./models/book');
    const adBook = await Book.aggregate([{ $match: { filetype: 'pdf' } }, { $sample: { size: 1 } }]);

    res.render('growth', {growthHabits, adBook});
});

app.get('/resources', async (req, res) => {
    res.render('resources');
});

app.get('/about', async (req, res) => {
    res.render('about');
});

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!'
    console.log(err.message)
    res.status(statusCode).render('error', { err })
})


const port = process.env.PORT || 8000; 
app.listen(port, () => { 
    console.log(`Serving on port ${port}`) 
}) 