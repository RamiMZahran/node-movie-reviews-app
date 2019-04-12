require('./config/config');
const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const { ObjectID } = require('mongodb');


var { mongoose } = require('./db/mongoose');
var { Movie } = require('./models/movie');
var { Review } = require('./models/review');
var { User } = require('./models/user');
var { authenticate } = require('./middleware/authenticate');


var app = express();
const port = process.env.PORT;

app.use(bodyParser.json());
//Add movie
app.post('/movies', authenticate, async (req, res) => {

    try {
        const movie = new Movie({
            name: req.body.name,
            genre: req.body.genre,
            year: req.body.year,
            actors: req.body.actors,
            reviews: []
        });
        const doc = await movie.save();
        res.send(doc);
    } catch (e) {
        res.status(400).send(e);
    }
});

//Get all movies With sort and filter options
app.get('/movies', async (req, res) => {
    const sb = req.query.sortBy;
    var filter;
    if (req.query.genre) {
        filter = {
            genre: req.query.genre
        };
    }
    if (req.query.year) {
        filter = {
            ...filter,
            year: req.query.year
        };
    }
    var sortby;
    if (sb === 'name')
        sortby = { name: 1 };
    else if (sb === 'genre') {
        sortby = { genre: 1 };
    }
    try {
        const movies = await Movie.find(filter).select('actors reviews name genre year')
            .populate('reviews').sort(sortby);
        res.send({ movies });
    } catch (e) {
        res.status(400).send(e);

    }
});

//Delete a movie by id
app.delete('/movies/:id', authenticate, async (req, res) => {
    const id = req.params.id;

    if (!ObjectID.isValid(id)) {
        return res.status(404).send();
    }
    try {
        const movie = await Movie.findByIdAndRemove(id);
        if (!movie) {
            return res.status(404).send();
        }
        var movieReviews = movie.reviews;
        movieReviews.forEach(rev => {
            Review.findByIdAndRemove(rev).exec();
        });
        res.send({ movie });
    } catch (e) {
        res.status(400).send();
    }
});
//Edit a movie by id
app.patch('/movies/:id', authenticate, async (req, res) => {
    const id = req.params.id;
    //pick up only the body parts that belong to the movie
    const body = _.pick(req.body, ['name', 'genre', 'year', 'actors']);
    if (!ObjectID.isValid(id)) {
        return res.status(404).send();
    }
    try {
        const movie = await Movie.findByIdAndUpdate(id, { $set: body }, { new: true });
        if (!movie) {
            return res.status(404).send();
        }
        res.send({ movie });
    } catch (e) {
        res.status(400).send();
    }
});


//Add review
app.post('/reviews', authenticate, async (req, res) => {
    var movie = await Movie.findById(req.body.movieId);
    if(!movie){
        return res.status(400).send({error:"Wrong Movie ID"});
    }
    const review = new Review({
        _id: new ObjectID(),
        movieId: req.body.movieId,
        rate: req.body.rate,
        description: req.body.description,
        title: req.body.title,
    });
    try {
        Movie.findByIdAndUpdate(req.body.movieId, { $push: { reviews: review._id } }).exec();
        const doc = await review.save();
        res.send(doc);
    } catch (e) {
        res.status(400).send(e);
    }
});
// Get all reviews
app.get('/reviews', async (req, res) => {
    try {
        const reviews = await Review.find().select('movieId rate description title').populate('movieId');
        res.status(200).send({ reviews });
    } catch (e) {
        res.status(400).send(e);
    }
});

//Delete a review by id
app.delete('/reviews/:id', authenticate, async (req, res) => {
    const id = req.params.id;

    if (!ObjectID.isValid(id)) {
        return res.status(404).send();
    }

    try {
        const review = await Review.findByIdAndRemove(id);
        if (!review) {
            return res.status(404).send();
        }
        Movie.findByIdAndUpdate(review.movieId, { $pull: { reviews: review._id } }).exec();
        res.send({ review });
    } catch (e) {
        res.status(400).send();
    }
});

//Edit a review by id
app.patch('/reviews/:id', authenticate, async (req, res) => {
    const id = req.params.id;
    //pick up only the body parts that belong to the review
    const body = _.pick(req.body, ['rate', 'description', 'title']);
    if (!ObjectID.isValid(id)) {
        return res.status(404).send();
    }
    try {
        const review = await Review.findByIdAndUpdate(id, { $set: body }, { new: true });
        if (!review) {
            return res.status(404).send();
        }
        res.send({ review });
    } catch (e) {
        res.status(400).send();
    }
});

//Add(signup) User
app.post('/users/signup', async (req, res) => {
    try {
        const body = _.pick(req.body, ['email', 'password']);
        const user = new User(body);

        await user.save();
        const token = await user.generateAuthToken();
        res.header('x-auth', token).send(user);

    } catch (e) {
        res.status(400).send(e);
    }
});

// Login User
app.post('/users/login', async (req, res) => {
    try {
        const body = _.pick(req.body, ['email', 'password']);
        const user = await User.findByCredentials(body.email, body.password);
        const token = await user.generateAuthToken();
        res.header('x-auth', token).send(user);
    } catch (e) {
        res.status(400).send();
    }
});

app.use((req, res, next) => {
    const error = new Error('Not Found');
    res.status(400);
    res.send({
        error: {
            message: error.message
        }
    })
});

app.listen(port, () => {
    console.log(`Started on port ${port}`);
});
