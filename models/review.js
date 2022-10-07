const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    text: String,
    category: {
        type: String,
        enum: ['Books', 'Biographies', 'Articles', 'Bible', 'Review']
    },
    parentId: {
        type: String
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    dateTime: {
        type: Date, 
        default: new Date()
    },
    likes: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    comments: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
});

module.exports = mongoose.model("Review", reviewSchema);