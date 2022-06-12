if (process.env.NODE_ENV !== "production") {
    require('dotenv').config()
}
// mongodb+srv://thundergod811:<password>@thundercluster.mbdfsr9.mongodb.net/?retryWrites=true&w=majority
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path')
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const User = require('./models/users');
const Recipe = require('./models/recipes');
const session = require('express-session');
const catchAsync = require('./utils/catchAsync');
const { userSchema, recipeSchema, commentSchema } = require('./JoiSchemas');
const AppError = require('./utils/AppError');
const flash = require('connect-flash');
const multer = require('multer');
const { storage, cloudinary } = require('./cloudinary/index');
const upload = multer({ storage })
const mongoSanitize = require("express-mongo-sanitize");
const MongoStore = require("connect-mongo");
// const helmet = require('helmet');
const dbUrl = process.env.DB_URL
// || 'mongodb://localhost:27017/recipes-webapp'
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const bodyParser = require('body-parser');

mongoose.connect(dbUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    // .then(() => {
    //     console.log("connected to db successfully");
    // })
    // .catch((e) => {
    //     console.log("db connection error:", e);
    // });

const db = mongoose.connection;
db.on('error', console.error.bind(console, "db connection error:"));
db.once('open', () => {
    console.log("Database connected");
});

app.engine('ejs', ejsMate);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}))
app.use(cors());

const client = new MongoClient(process.env.DB_URL);
const secret = process.env.SECRET || "recipewebapppratham";
const store = MongoStore.create({
    mongoUrl: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60
})

store.on('error', function(e) {
    console.log("Session store error:", e);
})

const sessionInfo = {
    store,
    name: "recipes",
    secret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionInfo))

app.use(flash());

app.use((req, res, next) => {
    res.locals.openSessions = req.session.user;
    res.locals.loginErrorMsg = req.flash('info');
    res.locals.successMsg = req.flash('success');
    next();
})


const requireLogin = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/user/new');
    }
    next();
}

function validateUser(req, res, next) {
    const { error } = userSchema.validate(req.body);
    if (error) {
        // const msg = error.details.map(e => e.message).join(',');
        req.flash('info', `Please enter all details`);
        res.render('errorpage', { webpageheading: "Error", err: error })
            // throw new AppError(msg, 400);
    } else {
        next();
    }
}

function validateRecipe(req, res, next) {
    const { error } = recipeSchema.validate(req.body);
    if (error) {
        // const msg = error.details.map(e => e.message).join(',');
        req.flash('info', `Please enter all details`);
        res.render('errorpage', { webpageheading: "Error", err: error })
            // throw new AppError(msg, 400);
    } else {
        next();
    }
}

function validateComment(req, res, next) {
    const { error } = commentSchema.validate(req.body);
    if (error) {
        // const msg = error.details.map(e => e.message).join(',');
        req.flash('info', `Please enter the comment`);
        res.render('errorpage', { webpageheading: "Error", err: error })
            // throw new AppError(msg, 400);
    } else {
        next();
    }
}

app.get('/', async(req, res) => {
    const recipes = await Recipe.find().populate('cook', 'username');
    res.render("index", { webpageheading: "TastyFoods.com", recipes });
})

app.get('/aboutpage', (req, res) => {
    res.render('about');
})

app.get('/search', catchAsync(async(req, res) => {
    const { recipeSearch } = req.query;
    let agg = [
        {$search: {text: {query: `${recipeSearch}`, path: ["title", "ingredients"]}}},
        {$limit: 20},
        {$project: {_id: 1,title: 1, description: 1, ingredients: 1, method: 1, cook: 1, images: 1 }}
    ];
    let results = await collection.aggregate(agg).toArray();
    // res.send(results);
    res.render('search',{webpageheading: `${recipeSearch} results - TastyFoods.com`,results, recipeSearch});
}))

app.get('/user/new', (req, res) => {
    res.render('newuser', { webpageheading: "Login/Sign Up - TastyFoods.com" })
})

app.get('/user/:uid', catchAsync(async(req, res) => {
    const { uid } = req.params;
    const user = await User.findById(uid);
    res.render('user', { webpageheading: `${user.username} - TastyFoods.com` });
}))

app.post('/login', catchAsync(async(req, res, next) => {
    const { username, password } = req.body;
    const foundUser = await User.findAndValidate(username, password);
    if (foundUser) {
        req.session.user = foundUser;
        return res.redirect('/');
    } else {
        req.flash('info', 'Incorrect username or password');
        return res.redirect('/user/new');
    }
}))

app.get('/recipe/new', requireLogin, catchAsync(async(req, res, next) => {
    res.render('createrecipe', { webpageheading: "Post your own recipe - TastyFoods.com" });
}))

app.get('/recipes/:id', catchAsync(async(req, res, next) => {
    const { id } = req.params;
    const recipe = await Recipe.findById(id).populate('cook', ['username', 'recipes', 'email']).populate('comments.user');
    // const recipeIngredients = nl2br(recipe.ingredients);
    // const recipeMethod = nl2br(recipe.method);
    res.render('show', { webpageheading: `${recipe.title} - TastyFoods.com`, recipe });
}))

app.post('/recipes/:id', requireLogin, validateComment, catchAsync(async(req, res, next) => {
    const { id } = req.params;
    const foundRecipe = await Recipe.findById(id);
    const { comment } = req.body;
    if (foundRecipe && comment) {
        foundRecipe.comments.push({ user: req.session.user._id, comment });
        await foundRecipe.save();
        res.redirect(`/recipes/${id}`);
    } else {
        req.flash('info', 'Recipe not found');
        res.redirect("/");
    }
}))

app.get('/user/recipes/:rid/edit', catchAsync(async(req, res, next) => {
    const { rid } = req.params;
    const loggedInUser = await User.findById(req.session.user._id);
    const userRecipe = await Recipe.findById(rid);
    res.render('editrecipe', { webpageheading: "Edit your recipe - TastyFoods.com", loggedInUser, userRecipe });
}))

app.put('/user/recipes/:rid', upload.array('images', 5), validateRecipe, catchAsync(async(req, res, next) => {
    const { rid } = req.params;
    const recipe = await Recipe.findById(rid);
    for (let img of recipe.images) {
        await cloudinary.uploader.destroy(img.filename);
    }
    const recipeUpdate = await Recipe.findByIdAndUpdate(rid, req.body, { new: true, runValidators: true });
    recipeUpdate.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    await recipeUpdate.save();
    // console.log(recipe.images);
    req.flash('success', "Successfully updated recipe");
    res.redirect(`/recipes/${rid}`);
}))

app.get('/user/:id/recipes', catchAsync(async(req, res, next) => {
    const { id } = req.params;
    const user = await User.findById(id);
    const recipes = await Recipe.find({ cook: id }).populate('cook', ['username']);
    res.render('user_recipes', { webpageheading: `Recipes by ${user.username} - TastyFoods.com`, user, recipes });
}))

app.post('/user', validateUser, catchAsync(async(req, res, next) => {
    const newUser = new User(req.body);
    await newUser.save();
    req.session.user = newUser;
    res.redirect('/');
}))

app.post('/recipe', upload.array('images', 5), validateRecipe, catchAsync(async(req, res, next) => {
    const newRecipe = new Recipe(req.body);
    const loggedInUser = await User.findById(req.session.user._id);
    newRecipe.cook = loggedInUser;
    newRecipe.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    loggedInUser.recipes.push(newRecipe);
    await newRecipe.save();
    await loggedInUser.save();
    req.flash('success', 'Recipe posted successfully');
    res.redirect(`/recipes/${newRecipe._id}`);
}))

app.post('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
})

app.delete('/recipes/:rid', catchAsync(async(req, res, next) => {
    const { rid } = req.params;
    const recipe = await Recipe.findById(rid);
    for (let img of recipe.images) {
        await cloudinary.uploader.destroy(img.filename);
    }
    await Recipe.findByIdAndDelete(rid);
    const uid = req.session.user._id;
    await User.findByIdAndUpdate(uid, { $pull: { recipes: rid } });
    res.redirect(`/user/${uid}/recipes`);
}))

app.all('*', (req, res, next) => {
    next(new AppError("Page not found", 404));
})

app.use((err, req, res, next) => {
    const { message = "Something went wrong", status = 500 } = err;
    res.status(status).render('errorpage', { err, webpageheading: `Error (${status})` });
})

const port = process.env.PORT || 3000;
let collection;
app.listen(3000, async () => {
    try {
        await client.connect();
        collection = client.db('test').collection('recipes');
        console.log("app on port", port);
    } catch(e) {
        console.log(e);
    }
})