const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const { ObjectID } = require('mongodb');


var { mongoose } = require('./db/mongoose');
var { Movie } = require('./models/movie');
var { Review } = require('./models/review');

var app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
//Add movie
/////////////////////////////////////////////////////////////
//      To Be Authenticated                                //
////////////////////////////////////////////////////////////
app.post('/movies', (req, res) => {
    var movie = new Movie({
        name: req.body.name,
        genre: req.body.genre,
        year: req.body.year,
        actors: req.body.actors,
        reviews: []
    });
    movie.save().then((doc) => {
        res.send(doc);
    }, (e) => {
        res.status(400).send(e);
    });
});

//Get all movies
app.get('/movies', (req, res) => {
    const sb = req.query.sortBy;
    var filter;
    if(req.query.genre){
        filter = {
            genre: req.query.genre
        };
    }
    if(req.query.year){
        filter = {
            ...filter,
            year: req.query.year
        };
    }

    const sortby = sb==='name'? {name : 1} : {genre : 1};
    Movie.find(filter)
    .populate('reviews')
    .sort(sortby)
    .then((movies) => {
        res.send({ movies });
    }, (e) => {
        res.status(400).send(e);
    });
});

//Delete a movie by id
/////////////////////////////////////////////////////////////
//      To Be Authenticated                                //
////////////////////////////////////////////////////////////
app.delete('/movies/:id', (req, res) => {
    var id = req.params.id;

    if (!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    Movie.findByIdAndRemove(id).then((movie) => {
        if (!movie) {
            return res.status(404).send();
        }
        var movieReviews = movie.reviews;
        movieReviews.forEach(rev => {
            Review.findByIdAndRemove(rev).exec();
        });

        res.send({ movie });
    }).catch((e) => {
        res.status(400).send();
    });
});
//Edit a movie by id
/////////////////////////////////////////////////////////////
//      To Be Authenticated                                //
////////////////////////////////////////////////////////////
app.patch('/movies/:id', (req, res) => {
    var id = req.params.id;
    //pick up only the body parts that belong to the movie
    var body = _.pick(req.body, ['name', 'genre', 'year', 'actors']);
    if (!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    Movie.findByIdAndUpdate(id, { $set: body }, { new: true }).then((movie) => {
        if (!movie) {
            return res.status(404).send();
        }

        res.send({ movie });
    }).catch((e) => {
        res.status(400).send();
    })
});


//Add review
/////////////////////////////////////////////////////////////
//      To Be Authenticated                                //
////////////////////////////////////////////////////////////
app.post('/reviews', (req, res) => {
    var review = new Review({
        _id: new ObjectID(),
        movieId: req.body.movieId,
        rate: req.body.rate,
        description: req.body.description,
        title: req.body.title,
    });
    Movie.findByIdAndUpdate(req.body.movieId, { $push: { reviews : review._id } } ).exec();
    review.save().then((doc) => {
        res.send(doc);
    }, (e) => {
        res.status(400).send(e);
    });
});
// Get all reviews
app.get('/reviews', (req, res) => {
    Review.find()
    .populate('movieId')
    .then((reviews) => {
        res.status(200).send({reviews});
    }, (e) => {
        res.status(400).send(e);
    });
    
});

//Delete a review by id
/////////////////////////////////////////////////////////////
//      To Be Authenticated                                //
////////////////////////////////////////////////////////////
app.delete('/reviews/:id', (req, res) => {
    var id = req.params.id;

    if (!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    Review.findByIdAndRemove(id).then((review) => {
        if (!review) {
            return res.status(404).send();
        }

        Movie.findByIdAndUpdate(review.movieId, { $pull: { reviews : review._id } } ).exec();        

        res.send({ review });
    }).catch((e) => {
        res.status(400).send();
    });
});

//Edit a review by id
/////////////////////////////////////////////////////////////
//      To Be Authenticated                                //
////////////////////////////////////////////////////////////
app.patch('/reviews/:id', (req, res) => {
    var id = req.params.id;
    //pick up only the body parts that belong to the review
    var body = _.pick(req.body, ['rate','description','title']);
    if (!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    Review.findByIdAndUpdate(id, { $set: body }, { new: true }).then((review) => {
        if (!review) {
            return res.status(404).send();
        }

        res.send({ review });
    }).catch((e) => {
        res.status(400).send();
    })
});



app.listen(port, () => {
    console.log(`Started on port ${port}`);
});
