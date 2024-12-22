const mongoose = require('mongoose');

exports.connect = async () => {
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
}