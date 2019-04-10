var mongoose = require('mongoose');

var ReviewSchema = new mongoose.Schema({
    movieId: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie' 
    },
    rate: {
        type:Number
    },
    description:{
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    title:{
        type: String
    }
});

var Review = mongoose.model('Review', ReviewSchema);

module.exports = { Review };