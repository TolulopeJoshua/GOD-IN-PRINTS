# GOD-IN-PRINTS

**USER DETAILS**

God-in-prints is a virtual library and repository of inspirational materials.

There are 3 major sections for biographies, books, articles. These can be reached using the section blocks displayed in home page or from the top navigation on the other pages.

There is a features page that displays selected pieces from each of the other sections. It can be reached from the feature block/section on the home page.

Each of the major sections have a features page that shows randomly selected documents from that section (e.g books), a list page that displays in alphabetical or numeric order, a view single document page, and a add-new-document page, all accessible from the left side navigation and on-page links.

**TECHNICAL DETAILS**

The backend is developed with NodeJs and frontend ejs view engine. There are seven routes and controller files for articles, bible, biographies, books, features, reviews and users, each with its get, post and delete apis.

The database used is mongodb connected via mongoose, and there are 4 scheme files for books, documents (articles and biographies), review and user in the models folder.

AWS S3 is used to store pdf files, images and text files.

There are several middlewares for data validation, authentication  validation and authorization checks. There are funtions for aws connections, mongodb connections, image convertion, multer uploads and email service.

The views folder has seven main subfolders corresponding to the route files. The ejs files in the views folders connect the backend apis and render relevant pages to clients.