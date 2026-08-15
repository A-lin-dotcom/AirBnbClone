const User = require('../models/user.js');
const passport = require('passport');

module.exports.renderSignupForm = (req, res) => {
    res.render('./users/signup.ejs', { redirect: req.query.redirect });
};

module.exports.signup = async (req, res, next) => {
    try {
        let { email, username, password, redirect } = req.body;
        let user = new User({ email, username });
        let registeredUser = await User.register(user, password);

        req.login(registeredUser, (err) => {
            if (err) {
                next(err);
            } else {
                req.flash('success', 'Welcome to Wanderlust!');
                let redirectUrl = redirect || req.session.redirectUrl || '/listings';
                console.log('Form redirect (signup):', redirect);
                console.log('Final redirectUrl (signup):', redirectUrl);
                res.redirect(redirectUrl);
            }
        });
    } catch (err) {
        next(err);
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render('./users/login.ejs', { redirect: req.query.redirect });
};

module.exports.login = (req, res) => {
    req.flash('success', 'Welcome back to Wanderlust!');
    console.log('Form redirect:', req.body.redirect);
    console.log('Session redirectUrl:', req.session.redirectUrl);

    let redirectUrl = req.body.redirect || req.session.redirectUrl || '/listings';
    delete req.session.redirectUrl;

    console.log('Final redirectUrl:', redirectUrl);
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash('success', 'You have been logged out!');
        res.redirect('/listings');
    });
};
