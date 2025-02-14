const express = require('express');
const router = express.Router();
const Recipe = require('../models/recipe.js');
const isSignedIn = require('../middleware/is-signed-in.js');


// GET /recipes - Show all recipes
router.get('/', async (req, res) => {
  try {
    const recipes = await Recipe.find({ owner: req.session.user._id });
    res.render('recipes/index.ejs', { recipes, user: req.session.user });
  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
});

router.delete('/:recipeId', isSignedIn, async (req, res) => {
    try {
      await Recipe.deleteOne({ _id: req.params.recipeId, owner: req.session.user._id });
      res.redirect('/recipes');
    } catch (error) {
      console.error(error);
      res.redirect('/recipes');
    }
  });
  
  router.get('/:recipeId/edit', async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.recipeId);
        res.render('recipes/edit', { recipe });
    } catch (error) {
        console.log(error);
        res.redirect('/recipes');
    }
});
// Edit Recipe Route
router.get('/:recipeId/edit', isSignedIn, async (req, res) => {
    try {
      const recipe = await Recipe.findById(req.params.recipeId);
      if (!recipe || recipe.owner.toString() !== req.session.user._id.toString()) {
        return res.redirect('/recipes');
      }
      res.render('recipes/edit.ejs', { user: req.session.user, recipe });
    } catch (error) {
      console.error(error);
      res.redirect('/recipes');
    }
  });
  
  // Update Recipe Route
router.put('/:recipeId', isSignedIn, async (req, res) => {
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
  
module.exports = router;

