if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config()
}

const express = require('express');
const mongoose = require('mongoose');
const Article = require('./models/article');
const User = require('./models/user');
const articleRouter = require('./routes/articles');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');

const cors = require('cors');

const users = [];
async function initUsers (req, res, next) {
    if (req.body !== null) {
        const oneUser = await User.findOne({email : req.body.email});
        if (oneUser == null) {
            users.push({
                id: '',
                email: '',
                password: ''
            });
            console.log('oneUser is null ',oneUser, users);
        } else {
            await users.push(oneUser);
        }
    }
    next();
};

const initializePassport = require('./passport-config');
initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
);

const app = express();

mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});

app.set('view engine', 'ejs'); // used to create HTML views automatically using EJS view engine

app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(cors());
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// serves images
app.use(express.static('public'));
app.use("/images", express.static("/images"));

app.get('/', checkAuthenticated, async (req, res) => {
    const articles = await Article.find().sort({
        createdAt: 'desc'
    });
        
    res.render('articles/index', { articles: articles, name: req.user.name });
});

app.get('/login', checkNotAuthenticated, (req,res) => {
    res.render('login');
});

app.get('/register', checkNotAuthenticated, (req,res) => {
    res.render('register');
});

app.post('/login', initUsers, checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

app.post('/register', checkNotAuthenticated,  async (req,res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10); 

        let user = new User();
        user.name = req.body.name;
        user.email = req.body.email;
        user.password = hashedPassword;

        user = await user.save();

        res.redirect('/login');
    } catch {
        res.redirect('/register');
    }    
    console.log(users);
});

app.delete('/logout', (req, res) => {
    users.length = 0;
    req.logOut();
    return res.redirect('/login');
});

app.use('/articles',articleRouter);

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next()
    }

    return res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {

    if (req.isAuthenticated()) {
        return res.redirect('/');
    }

    next();
}

app.listen(process.env.PORT || 5000);