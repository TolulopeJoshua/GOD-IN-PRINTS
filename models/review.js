const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    text: String,
    category: {
        type: String,
        enum: ['books', 'biographies', 'articles', 'bible']
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    dateTime: {
        type: Date, 
        default: new Date()
    },
});

module.exports = mongoose.model("Review", reviewSchema);