const MongoStore = require("connect-mongo");

const secret = process.env.SECRET;
const dbUrl = process.env.DB_URL; // || 'mongodb://localhost:27017/christian-world-libraries';

const store = MongoStore.create({
    mongoUrl: dbUrl,
    secret,
    touchAfter: 30 * 24 * 60 * 60
  });

  store.on("error", function (e) {
      console.log("SESSION STORE ERROR", e)
  })

module.exports.sessionConfig = {
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