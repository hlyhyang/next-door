const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const app = express();
var bodyParser = require('body-parser')


//ejs
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
//bodyparser

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//session middleware
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}))


app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done){
    done(null, user);
});
passport.deserializeUser(function(user, done){
    done(null, user);
});

require('./config/passport')();
//routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
//passport


const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`SEVER stared on port ${PORT}`));