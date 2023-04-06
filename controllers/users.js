const User = require('../models/user');
const Review = require('../models/review');
const BookTicket = require('../models/bookTicket');
const bcrypt = require ('bcrypt');
const axios = require('axios');
const Flutterwave = require('flutterwave-node-v3');
const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY); // 
const { sendWelcomeMail, sendWeeklyMails, sendPersonalMail, sendBookReviewsRequest } = require('../utils/email');
const { writeFileSync } = require('fs');
const sanitize = require('sanitize-html');

const blockedMails = require('../utils/blockedMails')

module.exports.renderRegister = (req, res) => {
    res.render('users/register', {title: 'GIP Library | Register'})
}

module.exports.register = async (req, res) => {
        const { email, firstName, lastName, password, loginType, accessToken, facebookId } = req.body;
        const username = email;
        const subscription = { status: 'classic', expiry: null, autorenew: true }
        const dateTime = Date.now();
        let user, registeredUser;
        if (loginType === 'facebook') {
          const validate = await axios.get(`https://graph.facebook.com/me?access_token=${accessToken}`);
          if (!validate.id === facebookId) {
            throw {message: 'Validation error!'}
          }
          const [registered] = await User.find({username: email});
          if (!registered) {
            user = new User({firstName, lastName, email, username, loginType, facebookId, subscription, dateTime});
            registeredUser = await User.register(user, password);
            sendWelcomeMail(user);
          } else {
            registered.lastLogin = new Date();
            await registered.save();
          }
          
          const authenticate = User.authenticate();
          authenticate(email, password, function(err, result) {
              if (err) return res.status(500).send({message: err})
              req.login(result, err => {
                if (err) return res.status(500).send({message: err})
                res.status(200).send({message: 'success', redirectUrl: req.session.returnTo || '/'})
                delete req.session.returnTo;
              })
          });
          return;
        } else {
          user = new User({firstName, lastName, email, username, loginType: 'password', subscription, dateTime});
          registeredUser = await User.register(user, password);
          sendWelcomeMail(user);
        }
        req.login(registeredUser, err => {
            if (err) return next(err);
            // req.flash('success', 'Welcome to God-In-Prints Libraries!');
            const redirectUrl = req.session.returnTo || '/';  
            delete req.session.returnTo;
            res.redirect(redirectUrl);
        })
}

module.exports.renderLogin = (req, res) => {
  if (!req.user) return  res.render('users/login', {title: 'GIP Library - Login'})
  res.status(200).json({response: 'logged in successfully', user: req.user.firstName + ' ' + req.user.lastName})
};

module.exports.login = async (req, res) => {
    // req.flash('success', 'welcome back');

    const user = await User.findById(req.user._id);
    if (user.loginType !== 'password') {
      req.logOut();
      throw `User initialized with ${user.loginType}, select 'password reset' to change login method.`
    }

    user.lastLogin = new Date();
    await user.save();
    const redirectUrl = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}; 

module.exports.socialLogin = async (req, res) => {
    // req.flash('success', 'welcome back');
    const user = await User.findById(req.user._id);
    user.lastLogin = new Date();
    await user.save();

    const redirectUrl = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
};

module.exports.logout = async (req, res) => {
    await req.logOut();
    // req.flash('success', 'Logged out successfully');
    res.redirect('/');
};

module.exports.weeklyMails = async (req, res) => {
  const users = await User.find({});
  const mails = users
          .filter(user => (new Date() - new Date(user.dateTime) > 7 * 24 * 60 * 60 * 1000) && (!user.preferences.nomail?.set || (new Date() - new Date(user.preferences.nomail?.time) > 90 * 24 * 60 * 60 * 1000)))
          .map(user => user.email).filter(mail => !blockedMails.includes(mail));
  let index = 0;
  const interval = setInterval(() => {
    const batch = mails.slice(index, index + 99) 
    console.log(batch.length)
    // sendWeeklyMails('babtol235@gmail.com');
    sendWeeklyMails(batch);
    sendPersonalMail({email: 'babtol235@gmail.com', name: 'Josh', subject: 'Weekly Mails Sent', 
      message:[`Number of mails sents: ${mails.length}`]})
    index += 99;
    if (index > mails.length) clearInterval(interval);
  }, 5000);
  res.status(200).send(mails.length.toString());
  // req.flash('success', `Mails sent successfully - ${mails.length}`);
  // res.redirect('/profile');
}

module.exports.getBookReviews = async (req, res) => {
  let users = await User.find({})
          .populate({path: 'downloads.bookId', populate: {path: 'reviews', select: 'author'}})
          .populate({path: 'tktdownloads.bookId', populate: {path: 'reviews', select: 'author'}});
  users = users.filter(user => !blockedMails.includes(user.email));
  let i = 0, c = 0;
  const mailInterval = setInterval(() => {
    if (i >= users.length - 1) clearInterval(mailInterval);
    const downloads = users[i].downloads.concat(users[i].tktdownloads);
    for (let download of downloads) {
      const daysDiff = new Date() - new Date(download.downloadTime);
      if ((daysDiff > 14 * 24 * 60 * 60 * 1000) && (daysDiff < 42 * 24 * 60 * 60 * 1000)) {
        if (download.bookId && !download.bookId.reviews.find(rev => rev.author._id.toString() == users[i]._id.toString())) {
          console.log(users[i].email, download.bookId.title)
          // sendBookReviewsRequest(users[i], download.bookId);
          c += 1;
          break;
        }
      }
    }
    i += 1;
    console.log(i, c);
  }, 2000);
  req.flash('success', 'Mails sent successfully!');
  res.redirect('/profile');
}

module.exports.renderProfile = (req, res) => {
  // sendWelcomeMail(req.user);

  res.render('users/profile', {title: 'Profile'})
}

module.exports.nomail = async (req, res) => {
  const user = req.user;
  user.preferences.nomail = {set: true, time: new Date()};
  await user.save();
  sendPersonalMail({
    email: user.email, name: user.firstName, subject: 'Unsubscribed successfully', farewell: 'Regards,',
    message: [`You have successfully unsubscribed from our weekly mails and will no longer be recieving them.`,
      'Click <a href="https://godinprints.org/user/getmail">here</a> to re-subscribe.'
    ]
  })
  res.render('success', {title: 'Success', msg: 'Unsubscribed'});
}

module.exports.getmail = async (req, res) => {
  const user = req.user;
  user.preferences.nomail = {set: false};
  await user.save();
  res.render('success', {title: 'Success', msg: 'Subscribed to Mails'});
}

module.exports.updateProfile = async (req, res) => {
  const user = req.user;

  if (req.body.newEmail) {
    if (user.loginType !== 'password') throw 'User not registered with password, use `password reset` button to set password.';
    const authenticated = await user.authenticate(req.body.password);
    if (authenticated.user) {
      user.email = req.body.newEmail;
      user.username = req.body.newEmail;
      await user.save();
    } else {
      throw authenticated.error;
    }
    req.flash('success', 'Email changed Successfully. Refresh page to log in.');
    return res.render('users/profile', {title: 'Profile'})
  }

  if (req.body.newPassword) {
    if (user.loginType !== 'password') throw 'User not registered with password, use `password reset` instead!';
    await user.changePassword(req.body.password, req.body.newPassword);
    req.flash('success', 'Password changed Successfully.');
    return res.render('users/profile', {title: 'Profile'})
  }

  const newProfile = req.body;
  for (key in newProfile) {
    user[key] = newProfile[key]
  }
  await user.save();
  req.flash('success', 'Profile Updated Successfully.');
  res.render('users/profile', {title: 'Profile'})
}

module.exports.renderSubscription = async (req, res) => {

  if (!req.isAuthenticated()) {
      req.session.returnTo = req.originalUrl;
      return res.redirect('/login');
  }
  const limits = require('../utils/lib/limits');
  const { sortVideos } = require('../utils/lib/videos_functions');
  const { videos } = sortVideos(req);
  res.render('users/subscription', {title: 'Profile', limits, numVideos: videos.length})
}

module.exports.setSubscription = async (req, res) => {
  const { id } = req.params;
  const response = await flw.Transaction.verify({id});
  if (response.status == 'success') {
    req.user.subscription = req.body.subscription;
    await req.user.save();
    res.status(200).send();
    const {data} = await flw.Subscription.get({email: req.user.email});
    for (sub of data) {
      if (sub.plan != response.data.plan && sub.status == 'active') {
        await flw.Subscription.cancel({id: sub.id})
      }
    }
  } else {
    res.status(401).send();
  }
}

module.exports.subscription_usd = async (req, res) => {
  
  if (!req.headers["verif-hash"] || (req.headers["verif-hash"] !== process.env.FLW_SECRET_HASH)) res.status(401).end();
  res.status(200).send();
  writeFileSync('sub.json', JSON.stringify(req.body));
  if (req.body.event == 'subscription.cancelled' ) {
    const result = await User.find({email: req.body.data.customer.email})
    const user = result && result[0];
    if (req.body.data.plan.name.split('_')[0] == user?.subscription.status) {
      user.subscription = {
        status: 'classic',
        expiry: null,
        autorenew: true,
        code: '',
        curr: '',
      }
      await user.save();
    }
  }
}

// const crypto = require('crypto');
module.exports.subscription = async (req, res) => {
    const event = req.body;
    let user = await User.find({email: event.data.customer.email});
    if (user && user[0]) {
      user = user[0]
    } else {
      return res.send(200)
    }
    if (["subscription.create","invoice.update","subscription.disable"].includes(event.event)) {
      const subId = event.event == 'invoice.update' ? event.data.subscription.subscription_code : event.data.subscription_code;
      let confirmation = await axios.get(`https://api.paystack.co/subscription/${subId}`, {
        headers: { Authorization : "Bearer " + process.env.PAYSTACK_SECRET_KEY} // 
      })
      if (!confirmation.status) res.status(404).end();
    }
    if (event.event == "subscription.create") {
      // const user = await User.find({email: event.data.customer.email});
      user.subscription = {
        status: event.data.plan.name,
        expiry: event.data.next_payment_date,
        autorenew: true,
        code: event.data.subscription_code,
      };
      await user.save();
    }
    if (event.event == "invoice.update") {
      if (event.data.subscription.subscription_code == user.subscription.code) {
        if (event.data.paid) {
          let {data} = await axios.get(`https://api.paystack.co/subscription/${user.subscription.code}`, {
            headers: { Authorization : "Bearer " + process.env.PAYSTACK_SECRET_KEY } // 
          })
          if (data.status) {
            data = data.data;
            user.subscription = {
              status: data.plan.name,
              expiry: data.next_payment_date,
              autorenew: true,
              code: data.subscription_code,
            }
          }
        } else {
          user.subscription = {
            status: 'classic',
            expiry: null,
            autorenew: false,
            code: user.subscription.code,
          }
        }
        await user.save();
      }
    }
    if (event.event == "subscription.disable") {
      if (event.data.subscription_code == user.subscription.code && user.subscription.curr != 'usd') {
        user.subscription = {
          status: 'classic',
          expiry: null,
          autorenew: true,
          code: '',
        }
        await user.save();
      }
    }
    if (event.event == "subscription.not_renew") {
      if (event.data.subscription_code == user.subscription.code) {
        user.subscription.autorenew = false;
        await user.save();
      }
    }
    res.status(200).send();
}

module.exports.disableUsdSubscription = async (req, res) => {
  const {data} = await flw.Subscription.get({email: req.user.email});
  for (sub of data) {
    if (sub.status == 'active') {
      await flw.Subscription.cancel({id: sub.id})
    }
  }
}

module.exports.disableSubscription = async (req, res) => {
  const { subCode } = req.params;
  
  let {data} = await axios.get(`https://api.paystack.co/subscription/${subCode}`, {
    headers: { Authorization : "Bearer " + process.env.PAYSTACK_SECRET_KEY }  // 
  })
  if (data.status && data.data.status == 'active' && data.data.customer.email == req.user.email) {
    const token = data.data.email_token;
    const response = axios({
      method: 'post',
      url: 'https://api.paystack.co/subscription/disable',
      data: {
        code: subCode,
        token: token,
      },
      headers: { 
        Authorization : "Bearer " + process.env.PAYSTACK_SECRET_KEY,  // 
        'Content-Type': 'application/json',
      }
    });
    return res.status(200).send("Disabled successfully.")
  }
  res.status(401).send("Not authorized!")
}

module.exports.bookTicket = async (req, res) => {
  let { data } = await axios.get(`https://api.paystack.co/transaction/verify/${req.params.ref}`, {
    headers: { Authorization : "Bearer " + process.env.PAYSTACK_SECRET_KEY }
  })

  if (data.status && data.data.status == "success") {
    const ticket = (Math.random()).toString(36).slice(2);
    const bookTicket = new BookTicket({ticket, userId: req.user?._id})
    await bookTicket.save();
    res.status(200).send(ticket)
  } else {
    res.status(400).send('Payment could not be verified.')
  }
}

module.exports.renderChangePassword = (req, res) => {
    res.render('users/changePassword', {title: 'Profile'})
};

module.exports.changePassword = async (req, res) => {
    const email = req.body.email;
    const user = await User.findOne({email: email});
    if (!user) {
      req.flash('error', 'User not found!');
      return res.redirect('/changePassword')
    }
    // console.log(user);
    const token = Math.random().toString(36).slice(2);
    bcrypt.hash(token, 10, async function(err, hash) {
      user.resetCode = hash;
      await user.save();
    });
    
    let mailOptions = {
        from: '"God-In-Prints Libraries" <godinprintslibraries@gmail.com>', // sender address
        to: user.email, // list of receivers
        subject: 'GIP Library Password Reset', // Subject line
        // text: 'hello', // plain text body
        html: `<p>Hello ${user.firstName.toUpperCase()}<p/><br>
          <p>Click <a href="https://www.godinprints.org/changePassword/${user._id}/${token}">reset</a> to set a new password for your account
          or paste the link: https://www.godinprints.org/changePassword/${user._id}/${token} to your brower.</p><br>
          <p>If you did not initiate the request, kindly reply with "Password change request not initiated by me" to this mail.<p/><br>
          <p>Regards,<p/><br><b>GIP Team<b/>` // html body
    };
    const {transporter} = require('../functions');
    transporter.sendMail(mailOptions, async (error, info) => {
        if (error) {
          console.log(error)
          await req.flash('error', 'An error occured.');
          return res.redirect('/changePassword')
        }
        console.log(info)
        await req.flash('success', 'Check your mail (inbox / spam folder) for the password reset link.');
        res.redirect('/changePassword')
      });
}

module.exports.renderSetPassword = (req, res) => {
  const {userId, resetCode} = req.params;
  res.render('users/setPassword', {userId, resetCode, title: 'Profile'})
};

module.exports.setPassword = async (req, res) => {
  const {userId, resetCode} = req.params;
  const {password} = req.body;
  const user = await User.findById(userId);
  bcrypt.compare(resetCode, user.resetCode, async function(err, result) {
      if (result) {
        user.setPassword(password, async (error, info) => {
          if(!error) {
            console.log(info);
            user.resetCode = null;
            user.loginType = 'password';
            await user.save();
            await req.flash('success', 'Password changed successfully.');
            res.redirect(`/changePassword/${userId}/${resetCode}`);
            return
          }
          await req.flash('error', 'An error occured.');
          res.redirect(`/changePassword/${userId}/${resetCode}`);
        })
      } else { 
        await req.flash('error', 'An error occured.');
        res.redirect(`/changePassword/${userId}/${resetCode}`);
      }
    });
};

module.exports.setUserSource = async (req, res) => {
  const {email, source} = req.params;
  const user = await User.findOne({email});
  if(user) {
    user.referrer = sanitize(source);
    await user.save();
    console.log(user)
  }
  res.status(200).render('success',{title: 'Success', msg: 'Sent'});
}

module.exports.addReview = async (req, res) => { 
    // console.log(req)
    const user = await User.findById(req.user._id);
    const review = new Review(req.body.review);
    review.parentId = req.params.chapter.toLowerCase();
    review.author = req.user._id;
    review.category = 'Bible';
    review.dateTime = Date.now();
    user.reviews.unshift(review);
    await review.save();
    await user.save();
    const {chapter, version} = req.params;
    console.log(req.params)
    res.redirect(`/bible/chapter?chapter=${chapter.toLowerCase()}&version=${version}`);
};

module.exports.deleteReview = async (req, res) => {
    const {userId, reviewId} = req.params;
    await User.findByIdAndUpdate(userId, {$pull: {reviews: reviewId} } );
    await Review.findByIdAndDelete(reviewId);
    res.send(reviewId);
}