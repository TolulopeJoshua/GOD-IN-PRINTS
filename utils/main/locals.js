module.exports.updateLocals = (req, res, next) => {
    // console.log(req.user)
    res.locals.currentUser = req.user || null;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');

    const { getRandomMovies } = require('../lib/videos_functions');
    res.locals.featureMovie = getRandomMovies(1, req)[0];

    next();
}