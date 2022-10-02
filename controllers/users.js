const User = require('../models/user');
const Review = require('../models/review');
const axios = require('axios');


module.exports.renderRegister = (req, res) => {
    res.render('users/register')
}

module.exports.register = async (req, res) => {

    try {
        const { email, firstName, lastName, password, loginType, accessToken, facebookId } = req.body;
        const username = email;
        const status = 'classic';
        const dateTime = Date.now();
        let user, registeredUser;
        if (loginType === 'facebook') {
          await axios.get(`https://graph.facebook.com/me?access_token=${accessToken}`);
          const registered = await User.find({username: email});
          if (Object.keys(registered).length > 0) {
            registeredUser = registered;
          } else {
            user = new User({firstName, lastName, email, username, facebookId, status, dateTime});
            registeredUser = await User.register(user, password);
            sendMail();
          }
          req.login(registeredUser, err => {
            if (err) return res.status(500).send({message: 'Authorization error!'})
            return res.status(200).send({message: 'success', redirectUrl: req.session.returnTo || '/'})
          })
        } else {
          user = new User({firstName, lastName, email, username, status, dateTime});
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

    } catch (e) {
      throw e;
      const redirectUrl = req.session.returnTo || '/';
      delete req.session.returnTo;
      res.redirect(redirectUrl);
    }
}

module.exports.renderLogin = (req, res) => {
    res.render('users/login')
};

module.exports.login = (req, res) => {
    // req.flash('success', 'welcome back');
    const redirectUrl = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
};

module.exports.logout = async (req, res) => {
    await req.logOut();
    // req.flash('success', 'Logged out successfully');
    res.redirect('/');
};

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