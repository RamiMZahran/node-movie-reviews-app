var mongoose = require('mongoose');

var MovieSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    genre: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    year: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },actors: {
        type: [String],
        required: true,
    },
    reviews: {
        type: [String]
    }
});

var Movie = mongoose.model('Movie', MovieSchema);

module.exports = { Movie };