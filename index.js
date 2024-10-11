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
const mediaRoutes = require('./routes/media');
const reviewRoutes = require('./routes/reviews');
const adminRoutes = require('./routes/api/admin')
const gipnewsRoutes = require('./routes/api/gipnews')

const MongoStore = require("connect-mongo");
const { readFileSync, writeFileSync } = require('fs');
const { sendWelcomeMail } = require('./utils/email');


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
app.use(express.json());
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
    touchAfter: 30 * 24 * 60 * 60
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
        expires: Date.now() + 1000 * 60 * 60 * 24 * 30,
        maxAge: 1000 * 60 * 60 * 24 * 30
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
    "https://js.paystack.co",
    "https://unpkg.com",
    "https://pagead2.googlesyndication.com",
    "https://www.gstatic.com",
    "https://www.googletagmanager.com",
    "https://partner.googleadservices.com",
    "https://adservice.google.com.ng",
    "https://adservice.google.com",
    "https://tpc.googlesyndication.com",
    "https://checkout.flutterwave.com",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    // "https://api.mapbox.com/",
    // "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net",
    "https://paystack.com",
    "https://cdnjs.cloudflare.com",
];
const connectSrcUrls = [
    "https://api.emailjs.com/",
    "https://ka-f.fontawesome.com",
    "https://www.facebook.com",
    "https://web.facebook.com",
    "https://graph.facebook.com",
    "https://z-p3-graph.facebook.com",
    "https://z-m-graph.facebook.com",
    "https://pagead2.googlesyndication.com",
    "https://firebase.googleapis.com",
    "https://firebaseinstallations.googleapis.com",
    "https://www.google-analytics.com",
    "https://api.ravepay.co",
    "https://flw-events-ge.herokuapp.com",
    // "https://api.mapbox.com/",
    // "https://a.tiles.mapbox.com/",
    // "https://b.tiles.mapbox.com/",
    // "https://events.mapbox.com/",
];
const fontSrcUrls = [
    "https://fonts.gstatic.com/",
    "https://cdn.jsdelivr.net",
    "https://cdnjs.cloudflare.com",
];
const frameSrcUrls = [
    "https://checkout.paystack.com",
    "https://checkout-v3-ui-prod.f4b-flutterwave.com",
    "https://googleads.g.doubleclick.net",
    "https://tpc.googlesyndication.com",
    "https://www.google.com",
    "https://www.youtube.com",
    "https://www.boomplay.com",
    "https://checkout.flutterwave.com",
    "https://checkout-v3-ui-prod.tls-flutterwave.com/",
]

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
            frameSrc: ["*","'self'", "blob:", ...frameSrcUrls],
            objectSrc: [],
            mediaSrc: [
                "'self'", 
                "https://youtu.be", 
                "https://www.youtube.com",
                "https://godinprintsdocuments.s3.amazonaws.com",
            ],
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
                "https://www.google.com",
                "en.wikipedia.org",
                "*",

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
    callbackURL: 'https://godinprints.org/redirect/fbk',
    scope: ['public_profile', 'email'],
    state: true
  }, async function (accessToken, refreshToken, profile, cb) {
        // writeFileSync('console.json', JSON.stringify({ accessToken, profile }));
        const axios = require('axios');
        const validate = await axios.get(`https://graph.facebook.com/me?access_token=${accessToken}&fields=email`);
        const email = validate.data.email;
        let user = await User.find({ email: email });
        if (!user || !user[0]) {
            const newUser = new User({
                facebookId: profile.id,
                email: email,
                username: email,
                loginType: 'facebook',
                firstName: profile.displayName.split(' ')[0] || 'Facebook',
                lastName: profile.displayName.split(' ')[1] || 'User',
                dateTime: Date.now(),
                subscription: { status: 'classic', expiry: null, autorenew: true }
          });
          const registeredUser = await User.register(newUser, '00000000');
          sendWelcomeMail(registeredUser);
          cb(null, registeredUser);
        } else {
            const authenticate = User.authenticate(); 
            authenticate(email, '00000000', (err, result) => {
                if (err) return console.log(err)
                cb(null, result);
            }); 
        }
  }));

  passport.use(new GoogleStrategy({
    clientID: process.env['GOOGLE_CLIENT_ID'],
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
    callbackURL: 'https://godinprints.org/redirect/ggl',
    // passReqToCallback: true,
    scope: [ 'profile', 'email' ]
  }, async function (issuer, profile, cb) {
        const email = profile.emails[0].value;
        let user = await User.find({ username: email });
        if (!user || !user[0]) {
            const newUser = new User({
                googleId: profile.id,
                email: email,
                username: email,
                loginType: 'google',
                firstName: profile.displayName.split(' ')[0] || 'Google',
                lastName: profile.displayName.split(' ')[1] || 'User',
                dateTime: Date.now(),
                subscription: { status: 'classic', expiry: null, autorenew: true }
          });
          const registeredUser = await User.register(newUser, '00000000');
          sendWelcomeMail(registeredUser);
          cb(null, registeredUser);
        } else {
            const authenticate = User.authenticate();
            authenticate(email, '00000000', (err, result) => {
                if (err) return console.log(err)
                cb(null, result);
            }); 
        }
  }));

app.use((req, res, next) => {
    // console.log(req.user)
    res.locals.currentUser = req.user || null;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');

    const { getRandomMovies } = require('./utils/lib/videos_functions');
    res.locals.featureMovie = getRandomMovies(1, req)[0];

    next();
})


app.use('/', userRoutes);
app.use('/books', bookRoutes);
app.use('/biographies', biographyRoutes)
app.use('/articles', articleRoutes)
app.use('/features', featuresRoutes)
app.use('/bible', bibleRoutes)
app.use('/media', mediaRoutes)
app.use('/reviews', reviewRoutes)
app.use('/admin', adminRoutes)
app.use('/api/gipnews', gipnewsRoutes)
 

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