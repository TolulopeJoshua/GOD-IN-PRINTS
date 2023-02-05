const { transporter } = require('../functions');

const sendPersonalMail = ({email, name, subject, message, greeting, farewell}) => {
    let mailOptions = {
        from: '"God In Prints Libraries" <godinprintslibraries@gmail.com>', // sender address
        to: email, // list of receivers
        subject, // Subject line
        // text: 'hello', // plain text body
        html: `<header style="text-align: center; background-color: rgba(64, 64, 64, 0.1); border-radius: 4px; padding: 4px; ">
            <img style="opacity: 0.5; border-radius: 50% 50% 0 0;" width="72px" height="72px" src="https://godinprints.org/assets/images/burningBook.jfif" alt="gip library icon">
            </header>
            <h2 style="text-align: center;">${subject}</h2>
            <p style="font-size: 14px; font-weight: 600; color: #666; line-height: 40px; text-align: justify;">
                ${greeting || `Hello ${name[0].toUpperCase() + name.slice(1).toLowerCase()}`}, <br>
                ${message.join(' <br> ')} <br>
                <br> ${farewell || 'Best Regards,'} <br>
            </p><hr>
            <footer style="text-align: center;">
            <a href="https://web.facebook.com/godinprints"><img style="width: 26px; padding-right: 16px;" src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2021_Facebook_icon.svg/2048px-2021_Facebook_icon.svg.png" alt="GodInPrints facebook"></a>
            <a href="https://godinprints.org"><img style="width: 32px;" src="https://godinprints.org/assets/images/burningBook.jfif" alt="God in prints"></a>
            </footer>
            <em style="width: 100%; display: block; text-align: center; font-size: small; padding-top: 16px;">
            &copy; 2023 GodInPrints Library
            </em>
            
            <style>
                html, body {
                    font-family: Arial, Helvetica, sans-serif;
                    padding: 4px;
                }
            </style>`
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error)
        }
        console.log(info)
      });
}

const sendWelcomeMail = (user) => {
    const options = {
        email: user.email,
        name: user.firstName,
        subject: 'Welcome to GIP Libraries',
        message: ['Welcome to the God In Prints libraries. We are glad to have you.', 
        'Feel free to explore our little bank of resources and kindly provide your feedbacks using our suggestion and <a href="https://godinprints.org#contact">contact</a> forms.',
        `<div style="font-size: 14px; font-weight: 600; color: #666; line-height: 30px;">
            <form id="userSourceForm" style="border: 1px solid #666; border-radius: 3px; padding: 5px; margin: 20px 0;">
                <h5 style="color: black; text-align: center;">We will love to know how you heard about GIP</h5>
                <ul>
                    <li><input type="radio" name="source" value="friend" id="referral" checked><label for="referral"><a href="https://godinprints.org/userSource/Friend/${user.email}">Friend/Referral</a></label></li>
                    <li><input type="radio" name="source" value="google" id="google"><label for="google"><a href="https://godinprints.org/userSource/Google/${user.email}">Google</a></label></li>
                    <li><input type="radio" name="source" value="twitter" id="twitter"><label for="twitter"><a href="https://godinprints.org/userSource/Twitter/${user.email}">Twitter</a></label></li>
                    <li><input type="radio" name="source" value="socials" id="socials"><label for="socials"><a href="https://godinprints.org/userSource/Socials/${user.email}">Socials (Whatsapp, Facebook, Instagram)</a></label></li>
                    <li><input type="radio" name="source" value="other" id="other"><label for="other"><a href="https://godinprints.org/userSource/Others/${user.email}">Others</a></label></li>
                </ul>
                <p class="info success" style="text-align: center; font-size: small; display: none; color: blue;">Feedback sent successfully.</p>
                <p class="info error" style="text-align: center; font-size: small; display: none; color: orangered;">An error occured!</p>
                <button type="button" style=" display: none; width: 100%; text-align: center; background: #666; color: white; border-color: #666; outline: none; border-radius: 3px; padding: 5px;">Submit</button>
            </form>
        </div>`
    ],
        farewell: 'Regards,'
    }
    sendPersonalMail(options);
}

module.exports = {sendPersonalMail, sendWelcomeMail}