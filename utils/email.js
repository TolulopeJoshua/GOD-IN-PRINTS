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
        'Feel free to explore our little bank of resources and kindly provide your feedbacks using our suggestion and <a href="https://godinprints.org#contact">contact</a> forms.',],
        farewell: 'Regards,'
    }
    sendPersonalMail(options);
}

module.exports = {sendPersonalMail, sendWelcomeMail}