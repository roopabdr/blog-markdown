const express = require('express');
const mongoose = require('mongoose');
const Article = require('./models/article');
const articleRouter = require('./routes/articles');
const methodOverride = require('method-override');

const cors = require('cors');

const app = express();

mongoose.connect('mongodb+srv://admin:Wz0OY2jP5aUkger8@skill-curves-dev.hli7v.mongodb.net/blog?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});

app.set('view engine', 'ejs'); // used to create HTML views automatically using EJS view engine

app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(cors());


app.get('/', async (req, res) => {
    const articles = await Article.find().sort({
        createdAt: 'desc'
    });
    res.render('articles/index', { articles: articles });
});

app.use('/articles',articleRouter);

app.listen(5000);