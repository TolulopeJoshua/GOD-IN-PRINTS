
const { sendWelcomeMail } = require('../email');
const User = require('../../models/user');

module.exports.facebookConfig = {
    clientID: process.env['FACEBOOK_CLIENT_ID'],
    clientSecret: process.env['FACEBOOK_CLIENT_SECRET'],
    callbackURL: 'https://godinprints.org/redirect/fbk',
    scope: ['public_profile', 'email'],
    state: true
  }

module.exports.facebookCallback = async function (accessToken, refreshToken, profile, cb) {
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
}

module.exports.googleConfig = {
    clientID: process.env['GOOGLE_CLIENT_ID'],
    clientSecret: process.env['GOOGLE_CLIENT_SECRET'],
    callbackURL: 'https://godinprints.org/redirect/ggl',
    // passReqToCallback: true,
    scope: [ 'profile', 'email' ]
  }

module.exports.googleCallback = async function (issuer, profile, cb) {
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
}