const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookTicketSchema = new Schema({
    ticket:  { type: String, required: true, },
    volume:  { type: Number, default: 1 },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
});

module.exports = mongoose.model("BookTicket", bookTicketSchema);