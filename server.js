const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const morgan = require('morgan');
const session = require('express-session');

const authController = require('./controllers/auth.js');
const recipesController = require('./controllers/recipes.js');
const ingredientsController = require('./controllers/ingredients.js');

const isSignedIn = require('./middleware/is-signed-in.js');
const passUserToView = require('./middleware/pass-user-to-view.js');

const Recipe = require('./models/recipe.js');
const Ingredient = require('./models/ingredient.js');

const port = process.env.PORT ? process.env.PORT : '3000';

mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
  console.log(`Connected to MongoDB ${mongoose.connection.name}.`);
});

app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

// Middleware to pass user data to views
app.use(passUserToView);

app.get('/', (req, res) => {
  res.render('index.ejs', {
    user: req.session.user,
  });
});

app.get('/vip-lounge', isSignedIn, (req, res) => {
  res.send(`Welcome to the party ${req.session.user.username}.`);
});

// Recipe Index Route
app.get('/recipes', isSignedIn, async (req, res) => {
  try {
    const recipes = await Recipe.find({ owner: req.session.user._id }).populate('ingredients');
    res.render('recipes/index.ejs', { user: req.session.user, recipes });
  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
});

// New Recipe Route
app.get('/recipes/new', isSignedIn, async (req, res) => {
  try {
    const ingredients = await Ingredient.find();
    res.render('recipes/new.ejs', { user: req.session.user, ingredients });
  } catch (error) {
    console.error(error);
    res.redirect('/recipes');
  }
});

// Create Recipe Route
app.post('/recipes', isSignedIn, async (req, res) => {
  try {
    const newRecipe = new Recipe(req.body);
    newRecipe.owner = req.session.user._id;
    await newRecipe.save();
    res.redirect('/recipes');
  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
});

// Show Recipe Route
app.get('/recipes/:recipeId', isSignedIn, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.recipeId).populate('ingredients');
    if (!recipe || recipe.owner.toString() !== req.session.user._id.toString()) {
      return res.redirect('/recipes');
    }
    res.render('recipes/show.ejs', { user: req.session.user, recipe });
  } catch (error) {
    console.error(error);
    res.redirect('/recipes');
  }
});

app.use('/auth', authController);
app.use(isSignedIn);
app.use('/ingredients', ingredientsController);
app.use(express.static('public'));


// Delete Recipe Route
app.delete('/recipes/:recipeId', isSignedIn, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.recipeId);
    if (!recipe || recipe.owner.toString() !== req.session.user._id.toString()) {
      return res.redirect('/recipes');
    }
    await Recipe.findByIdAndDelete(req.params.recipeId);
    res.redirect('/recipes');
  } catch (error) {
    console.error(error);
    res.redirect('/recipes');
  }
});

// Edit Recipe Route - Show Edit Form
app.get('/recipes/:recipeId/edit', isSignedIn, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.recipeId);
    const ingredients = await Ingredient.find();
    if (!recipe || recipe.owner.toString() !== req.session.user._id.toString()) {
      return res.redirect('/recipes');
    }
    res.render('recipes/edit.ejs', { user: req.session.user, recipe, ingredients });
  } catch (error) {
    console.error(error);
    res.redirect('/recipes');
  }
});

// Update Recipe Route
app.put('/recipes/:recipeId', isSignedIn, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.recipeId);
    if (!recipe || recipe.owner.toString() !== req.session.user._id.toString()) {
      return res.redirect('/recipes');
    }
    await Recipe.findByIdAndUpdate(req.params.recipeId, req.body, { new: true });
    res.redirect(`/recipes/${req.params.recipeId}`);
  } catch (error) {
    console.error(error);
    res.redirect('/recipes');
  }
});

// Ingredient Routes
app.get('/ingredients', isSignedIn, async (req, res) => {
  try {
    const ingredients = await Ingredient.find();
    res.render('ingredients/index.ejs', { user: req.session.user, ingredients });
  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
});

app.post('/ingredients', isSignedIn, async (req, res) => {
  try {
    await Ingredient.create(req.body);
    res.redirect('/ingredients');
  } catch (error) {
    console.error(error);
    res.redirect('/ingredients');
  }
});

app.listen(port, () => {
  console.log(`The express app is ready on port ${port}!`);
});
