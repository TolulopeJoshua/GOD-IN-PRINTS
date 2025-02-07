const { transporter, transporter2 } = require("../functions");

const sendPersonalMail = ({
  email,
  bcc,
  name = "Esteemed library member",
  subject,
  message,
  greeting,
  farewell,
}, ses = false) => {
  let mailOptions = {
    from: `"God In Prints Libraries" <godinprintslibraries@gmail.com>`, // sender address
    to: email, // list of receivers
    bcc,
    subject, // Subject line
    // text: 'hello', // plain text body
    html: `<section style="font-family: Arial, Helvetica, sans-serif; padding: 4px;">
            <header style="width: 100%; display: block; text-align: center; background-color: rgba(64, 64, 64, 0.1); border-radius: 4px; padding: 4px; ">
            <img style="opacity: 0.5; border-radius: 50% 50% 0 0;" width="72px" height="72px" src="https://godinprints.org/assets/images/burningBook.jfif" alt="gip library icon">
            </header>
            <h2 style="text-align: center;">${subject}</h2>
            <p style="font-size: 14px; font-weight: 600; color: #666; line-height: 40px; text-align: justify;">
                ${
                  greeting ||
                  `Hello ${name[0].toUpperCase() + name.slice(1).toLowerCase()}`
                }, <br>
                ${message.join(" <br> ")} <br>
                <br> ${farewell || "Best Regards,"} <br>
            </p><hr>
            <footer style="width: 100%; display: block; text-align: center;">
            <a href="https://web.facebook.com/godinprints"><img style="width: 26px; padding-right: 16px;" src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/2021_Facebook_icon.svg/2048px-2021_Facebook_icon.svg.png" alt="GodInPrints facebook"></a>
            <a href="https://godinprints.org"><img style="width: 32px;" src="https://godinprints.org/assets/images/burningBook.jfif" alt="God in prints"></a>
            </footer>
            <em style="width: 100%; display: block; text-align: center; font-size: small; padding-top: 16px;">
            &copy; 2025 GodInPrints Library
            </em></section>`,
  };
  const transport = ses ? transporter2 : transporter;
  return new Promise((resolve) => {
    transport.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      }
      console.log(info);
      resolve();
    });
  });
};

const sendBookReviewsRequest = async (user, book) => {
  const templateReviews = [
    "Book has incomplete/poor content.",
    "Not very interesting/inspiring.",
    "No comment! Reading in progess...",
    "I can't say if I got anything new.",
    "It wasn't a waste of time.",
    "Some of the contents are great.",
    "Inspiring, I was much impacted.",
    "Exceptional piece. Highly recommended!",
  ];
  const options = {
    email: user.email,
    name: user.firstName,
    subject: "Review your book!",
    message: [
      `You downloaded the book: <i>${book.title.toUpperCase()}</i> a few days ago.`,
      "We would love to know how the book has blessed you.",
      "You can select from our list of template responses or send your custom response.",
      `<p style="text-align: center;"><img width="160px" src="https://godinprintsdocuments.s3.amazonaws.com/${book.image.key.replace(
        / /g,
        "+"
      )}"></p>
            <form id="userSourceForm" style="border: 1px solid #666; border-radius: 3px; padding: 5px; margin: 20px 0;">
            <ul>
                ${templateReviews
                  .map(
                    (rev) =>
                      `<li style="padding: 10px 0;"><a href="https://godinprints.org/books/mailReview/${user._id}/${book._id}/${rev}">${rev}</a></li>`
                  )
                  .join("")}
                <li style="margin: 10px 0; padding: 10px 0; border-top: 1px solid #ccc;"><a href="https://godinprints.org/books/mailReview/${
                  user._id
                }/${book._id}/0"><i>Respond in your own words</i></a></li>
            </ul>
            </form>`,
    ],
    farewell: " ",
  };
  return sendPersonalMail(options);
};

const sendWelcomeMail = async (user) => {
  const picks = await generateSortedResources();

  const options = {
    email: user.email,
    name: user.firstName,
    subject: "Welcome to GIP Libraries",
    message: [
      "Welcome to God In Prints libraries. We are glad to have you.",
      'Feel free to frequently explore our little bank of resources and submit your requests and feedbacks using our requests, suggestions and <a href="https://godinprints.org#contact">contact</a> forms.',
      `<div style="font-size: 14px; font-weight: 600; color: #666; line-height: 30px;">
                <form id="userSourceForm" style="border: 1px solid #666; border-radius: 3px; padding: 5px; margin: 20px 0;">
                    <h5 style="color: black; text-align: center;">We would like to know how you heard about GIP</h5>
                    <ul>
                        <li><label for="referral"><a href="https://godinprints.org/userSource/Friend/${user.email}">Friend/Referral</a></label></li>
                        <li><label for="google"><a href="https://godinprints.org/userSource/Google/${user.email}">Google</a></label></li>
                        <li><label for="twitter"><a href="https://godinprints.org/userSource/Twitter/${user.email}">Twitter</a></label></li>
                        <li><label for="socials"><a href="https://godinprints.org/userSource/Socials/${user.email}">Socials (Whatsapp, Facebook, Instagram)</a></label></li>
                        <li><label for="other"><a href="https://godinprints.org/userSource/Others/${user.email}">Others</a></label></li>
                    </ul>
                    <p class="info success" style="text-align: center; font-size: small; display: none; color: blue;">Feedback sent successfully.</p>
                    <p class="info error" style="text-align: center; font-size: small; display: none; color: orangered;">An error occured!</p>
                    <button type="button" style=" display: none; width: 100%; text-align: center; background: #666; color: white; border-color: #666; outline: none; border-radius: 3px; padding: 5px;">Submit</button>
                </form>
            </div>`,
      `<h4 style="text-align: center;">Some Items You Might Love:</h4>${picks}`,
    ],
  };
  return sendPersonalMail(options);
};

const sendWeeklyMails = async (emails) => {
  const picks = await generateSortedResources();

  const options = {
    email: "gipteam@hotmail.com",
    bcc: emails,
    subject: "Weekly Picks!",
    message: [
      "We have thought to bring you some sorted library resources for this week.",
      "Ensure you take a look at these items, and we sure hope that you are richly blessed.",
      "",
      picks,
    ],
    farewell: `<p style="text-align: center; margin: 0; padding: 0; font-size: small;">
        Click <a href="https://godinprints.org/user/nomail">here</a> to unsubscribe</p>`,
  };
  return sendPersonalMail(options, true);
};

module.exports = {
  sendPersonalMail,
  sendWelcomeMail,
  sendWeeklyMails,
  sendBookReviewsRequest,
};

async function generateSortedResources() {
  const { sortVideos } = require("./lib/videos_functions");
  const Book = require("../models/book");
  const Doc = require("../models/doc");

  const books = await Book.aggregate([
    { $match: { filetype: "pdf", isApproved: true } },
    { $sample: { size: 4 } },
  ]);
  const biographies = await Doc.aggregate([
    { $match: { docType: "biography", isApproved: true } },
    { $sample: { size: 1 } },
  ]);
  const articles = await Doc.aggregate([
    { $match: { docType: "article", isApproved: true } },
    { $sample: { size: 2 } },
  ]);

  const { classesMovies } = sortVideos();
  const movies = [
    classesMovies.classic[
      Math.floor(Math.random() * classesMovies.classic.length)
    ],
  ];
  movies.push(
    classesMovies.starter[
      Math.floor(Math.random() * classesMovies.starter.length)
    ]
  );
  movies.push(
    classesMovies.medium[
      Math.floor(Math.random() * classesMovies.medium.length)
    ]
  );

  return `
        <div style="border: 1px solid #ccc; border-radius: 3px; color: #666; padding: 5px; margin-bottom: 10px 0;">
            <h3 style="text-decoration: underline; text-align: center;">Life-building literatures</h3>
            <div style="border-top: 1px solid #ddd; padding: 5px;">
                <h4>${books[0].title.toUpperCase()}</h4>
                <p style="display: flex; justify-content: space-between; font-size: small;"><span>- ${books[0].author.toUpperCase()}</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="https://godinprints.org/books/${
    books[0]._id
  }">Go to Download</a></p>
            </div>
            <div style="border-top: 1px solid #ddd; padding: 5px;">
                <h4>${books[1].title.toUpperCase()}</h4>
                <p style="display: flex; justify-content: space-between; font-size: small;"><span>- ${books[1].author.toUpperCase()}</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="https://godinprints.org/books/${
    books[1]._id
  }">Go to Download</a></p>
            </div>
            <div style="border-top: 1px solid #ddd; padding: 5px;">
                <h4>${books[2].title.toUpperCase()}</h4>
                <p style="display: flex; justify-content: space-between; font-size: small;"><span>- ${books[2].author.toUpperCase()}</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="https://godinprints.org/books/${
    books[2]._id
  }">Go to Download</a></p>
            </div>
            <div style="border-top: 1px solid #ddd; padding: 5px;">
                <h4>${books[3].title.toUpperCase()}</h4>
                <p style="display: flex; justify-content: space-between; font-size: small;"><span>- ${books[3].author.toUpperCase()}</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="https://godinprints.org/books/${
    books[3]._id
  }">Go to Download</a></p>
            </div>
        </div><br>
        <div style="border: 1px solid #ccc; border-radius: 3px; color: #666; padding: 5px; margin-bottom: 10px 0;">
            <h3 style="text-decoration: underline; text-align: center;">All-Time Movies</h3>
            <div style="border-top: 1px solid #ddd; padding: 5px; display: flex">
                <div style="padding: 20px 5px">
                    <img width="120px" src="${
                      movies[0].snippet.thumbnails.medium.url
                    }" alt="${movies[0].snippet.title}">
                </div>
                <span>
                    <h4>${movies[0].snippet.title}</h4>
                    <p style="display: flex; justify-content: space-between; font-size: small;"><span>Classic Subscription</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="https://godinprints.org/media/movies/${
                      movies[0].id
                    }">Play${
    movies[0].forKids ? " <i>(For Kids)</i>" : ""
  }</a></p>
                </span>
            </div>
            <div style="border-top: 1px solid #ddd; padding: 5px; display: flex">
                <div style="padding: 20px 5px">
                    <img width="120px" src="${
                      movies[1].snippet.thumbnails.medium.url
                    }" alt="${movies[1].snippet.title}">
                </div>
                <span>
                    <h4>${movies[1].snippet.title}</h4>
                    <p style="display: flex; justify-content: space-between; font-size: small;"><span><a href="https://godinprints.org/subscription">Starter Subscription</a></span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="https://godinprints.org/media/movies/${
                      movies[1].id
                    }">Play${
    movies[1].forKids ? " <i>(For Kids)</i>" : ""
  }</a></p>
                </span>
            </div>
            <div style="border-top: 1px solid #ddd; padding: 5px; display: flex">
                <div style="padding: 20px 5px">
                    <img width="120px" src="${
                      movies[2].snippet.thumbnails.medium.url
                    }" alt="${movies[2].snippet.title}">
                </div>
                <span>
                    <h4>${movies[2].snippet.title}</h4>
                    <p style="display: flex; justify-content: space-between; font-size: small;"><span><a href="https://godinprints.org/subscription">Medium Subscription</a></span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="https://godinprints.org/media/movies/${
                      movies[2].id
                    }">Play${
    movies[2].forKids ? " <i>(For Kids)</i>" : ""
  }</a></p>
                </span>    
            </div>
        </div><br>
        <div style="border: 1px solid #ccc; border-radius: 3px; color: #666; padding: 5px; margin-bottom: 10px 0;">
            <h3 style="text-decoration: underline; text-align: center;">Inspiring Letters</h3>
            <div style="border-top: 1px solid #ddd; padding: 5px;">
                <h4>${articles[0].name.toUpperCase()}</h4>
                <p style="display: flex; justify-content: space-between; font-size: small;"><span>- ${
                  articles[0].source.split(".")[0]
                }</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="https://godinprints.org/articles/${
    articles[0]._id
  }">Read Article</a></p>
            </div>
            <div style="border-top: 1px solid #ddd; padding: 5px;">
            <h4>${articles[1].name.toUpperCase()}</h4>
            <p style="display: flex; justify-content: space-between; font-size: small;"><span>- ${
              articles[1].source.split(".")[0]
            }</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="https://godinprints.org/articles/${
    articles[1]._id
  }">Read Article</a></p>
            </div>
        </div><br>
        <div style="border: 1px solid #ccc; border-radius: 3px; color: #666; padding: 5px; margin-bottom: 10px 0;">
            <h3 style="text-decoration: underline; text-align: center;">Meet Someone Special</h3>
            <div style="border-top: 1px solid #ddd; padding: 5px;">
                <h4>${biographies[0].name}</h4>
                <p style="display: flex; justify-content: space-between; font-size: small;"><span>${
                  biographies[0].role
                }</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<a href="https://godinprints.org/biographies/${
    biographies[0]._id
  }">Read Bio</a></p>
            </div>
        </div>`;
}
