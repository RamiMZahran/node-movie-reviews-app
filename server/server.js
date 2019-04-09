var express = require('express');
var bodyParser = require('body-parser');


var { mongoose } = require('./db/mongoose');
var { Movie } = require('./models/movie');

var app = express();

app.use(bodyParser.json());

app.post('/movies', (req, res) => {
    var movie = new Movie({
        name: req.body.name,
        genre: req.body.genre,
        year: req.body.year,
        actors: req.body.actors,
        reviews: req.body.reviews
    });
    movie.save().then((doc) => {
        res.status(200).send(doc);
    }, (e) => {
        res.status(400).send(e);
    });
});


app.listen(3000, () => {
    console.log('Started on port 3000');
});
