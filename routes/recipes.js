const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/recipes
// @desc    Get all recipes
// @access  Public
router.get('/', async (req, res) => {
    try {
        const recipes = await Recipe.find().populate('author', 'username');
        res.json(recipes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/recipes/:id
// @desc    Get single recipe
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id).populate('author', 'username');
        if (recipe) {
            res.json(recipe);
        } else {
            res.status(404).json({ message: 'Recipe not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/recipes
// @desc    Create a recipe
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { title, description, ingredients, instructions, imageUrl, prepTime } = req.body;

        const recipe = new Recipe({
            title,
            description,
            ingredients,
            instructions,
            imageUrl,
            prepTime,
            author: req.user.id
        });

        const createdRecipe = await recipe.save();
        res.status(201).json(createdRecipe);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/recipes/:id
// @desc    Delete a recipe
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);

        if (recipe) {
            // Check if user is the author
            if (recipe.author.toString() !== req.user.id) {
                return res.status(401).json({ message: 'User not authorized to delete this recipe' });
            }

            await recipe.deleteOne();
            res.json({ message: 'Recipe removed' });
        } else {
            res.status(404).json({ message: 'Recipe not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
