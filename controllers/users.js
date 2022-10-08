const User = require('../models/user');
const Review = require('../models/review');
const axios = require('axios');
const { response } = require('express');


module.exports.renderRegister = (req, res) => {
    res.render('users/register')
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
          const registered = await User.find({username: email});
          if (!Object.keys(registered).length > 0) {
            user = new User({firstName, lastName, email, username, loginType, facebookId, subscription, dateTime});
            registeredUser = await User.register(user, password);
            sendMail();
          } else {
            registered.lastLogin = new Date();
            await registered.save();
          }
          
          const authenticate = User.authenticate();
          authenticate(email, password, function(err, result) {
              if (err) res.status(500).send({message: err})
              req.login(result, err => {
                if (err) res.status(500).send({message: err})
                res.status(200).send({message: 'success', redirectUrl: req.session.returnTo || '/'})
              })
          });
          return;
        } else {
          user = new User({firstName, lastName, email, username, loginType: 'password', subscription, dateTime});
          registeredUser = await User.register(user, password);
          sendMail();
        }
        req.login(registeredUser, err => {
            if (err) return next(err);
            // req.flash('success', 'Welcome to God-In-Prints Libraries!');
            const redirectUrl = req.session.returnTo || '/';  
            delete req.session.returnTo;
            res.redirect(redirectUrl);
        })
    
        function sendMail() {
          let mailOptions = {
              from: '"God-In-Prints Libraries" <godinprintslibraries@gmail.com>', // sender address
              to: user.email, // list of receivers
              subject: 'Welcome to GIP Library', // Subject line
              // text: 'hello', // plain text body
              html: `<p>Hello ${user.firstName.toUpperCase()},<p/><br>
                <p>Welcome to the God-in-prints virtual libraries. We are glad to have you.</p><br>
                <p>Feel free to explore our little bank of resources. We'll also appreciate your feedbacks as well as contributions. Looking forward to a life-building relationship with you.<p/><br>
                <p>Tolulope Joshua - Admin<p/><br><b>GIP Library<b/>` // html body
          };
          const {transporter} = require('../functions');
          transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log(error)
              }
              console.log(info)
            });
        }
}

module.exports.renderLogin = (req, res) => {
  if (!req.user) return  res.render('users/login')
  res.status(200).json({response: 'logged in successfully', user: req.user.firstName + ' ' + req.user.lastName})
};

module.exports.login = async (req, res) => {
    // req.flash('success', 'welcome back');

    const user = await User.findById(req.user._id);
    if (user.loginType !== 'password') {
      req.logOut();
      throw {message: `User initialized with ${user.loginType}, select password reset to change login method.`}
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
    res.redirect('/');
};

module.exports.logout = async (req, res) => {
    await req.logOut();
    // req.flash('success', 'Logged out successfully');
    res.redirect('/');
};

module.exports.renderSubscription = (req, res) => {
  // console.log(req.user)
  res.render('users/subscription')
}

// const crypto = require('crypto');
module.exports.subscription = async (req, res) => {
  // let validIps = ['52.31.139.75', '52.49.173.169', '52.214.14.220', '102.89.47.92'];
  // if (validIps.includes(req.connection.remoteAddress)) {
    const event = req.body;
    let user = await User.find({email: event.data.customer.email});
    if (user && user[0]) {
      user = user[0]
    } else {
      return res.send(200)
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
            headers: { Authorization : "Bearer " + process.env.PAYSTACK_SECRET_KEY }
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
      if (event.data.subscription_code == user.subscription.code) {
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
    res.send(200);
  // }
  // res.status(200).send('ip not found');
}

module.exports.disableSubscription = async (req, res) => {
  const { subCode } = req.params;
  
  let {data} = await axios.get(`https://api.paystack.co/subscription/${subCode}`, {
    headers: { Authorization : "Bearer " + process.env.PAYSTACK_SECRET_KEY }
  })
  if (data.status && data.data.customer.email == req.user.email) {
    const token = data.data.email_token;
    const response = axios({
      method: 'post',
      url: 'https://api.paystack.co/subscription/disable',
      data: {
        code: subCode,
        token: token,
      },
      headers: { 
        Authorization : "Bearer " + process.env.PAYSTACK_SECRET_KEY,
        'Content-Type': 'application/json',
      }
    });
    return res.status(200).send("Disabled successfully.")
  }
  res.status(401).send("Not authorized!")
}

module.exports.renderChangePassword = (req, res) => {
    res.render('users/changePassword', {msg: ''})
};

module.exports.changePassword = async (req, res) => {
    const email = req.body.email;
    const user = await User.findOne({email: email});
    if (!user) {
      return res.render('users/changePassword', {msg: 'User not found!'})
    }
    // console.log(user);
    user.resetCode = Math.random().toString(36).slice(2);
    await user.save();
    
    let mailOptions = {
        from: '"God-In-Prints Libraries" <godinprintslibraries@gmail.com>', // sender address
        to: user.email, // list of receivers
        subject: 'GIP Library Password Reset', // Subject line
        // text: 'hello', // plain text body
        html: `<p>Hello ${user.firstName.toUpperCase()}<p/><br>
          <p>Click <a href="https://www.godinprints.org/changePassword/${user._id}/${user.resetCode}">reset</a> to set a new password for your account
          or paste the link: https://www.godinprints.org/changePassword/${user._id}/${user.resetCode} to your brower.</p><br>
          <p>If you did not initiate the request, kindly reply with "Password change request not initiated by me" to this mail.<p/><br>
          <p>Regards,<p/><br><b>GIP Team<b/>` // html body
    };
    const {transporter} = require('../functions');
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error)
          return res.render('users/changePassword', {msg: 'An error occured.'})
        }
        console.log(info)
        res.render('users/changePassword', {msg: 'Check your mail (inbox / spam folder) for the password reset link.'})
      });
}

module.exports.renderSetPassword = (req, res) => {
  const {userId, resetCode} = req.params;
  res.render('users/setPassword', {userId, resetCode, msg: ''})
};

module.exports.setPassword = async (req, res) => {
  const {userId, resetCode} = req.params;
  const {password} = req.body;
  const user = await User.findById(userId);
  if (resetCode === user.resetCode) {
    user.setPassword(password, async (error, info) => {
      if(!error) {
        console.log(info);
        user.resetCode = null;
        user.loginType = 'password';
        await user.save();
        return res.render('users/setPassword', {userId, resetCode: '', msg: 'Password changed successfully.'})
      }
      res.render('users/setPassword', {userId, resetCode: '', msg: 'An error occured.'})
    })
  } else {
    res.render('users/setPassword', {userId, resetCode: '', msg: 'An error occured.'})
  }
};

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