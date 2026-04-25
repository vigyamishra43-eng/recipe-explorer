const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Recipe = require('../models/Recipe');
const { protect } = require('../middleware/authMiddleware');

// @route   PUT /api/users/save-recipe/:id
// @desc    Save a recipe to user's favorites
// @access  Private
router.put('/save-recipe/:id', protect, async (req, res) => {
    try {
        const recipeId = req.params.id;
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const recipe = await Recipe.findById(recipeId);
        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        if (!user.savedRecipes.includes(recipeId)) {
            user.savedRecipes.push(recipeId);
            await user.save();
            return res.json({ message: 'Recipe saved successfully', savedRecipes: user.savedRecipes });
        } else {
            return res.status(400).json({ message: 'Recipe already saved' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/users/unsave-recipe/:id
// @desc    Remove a recipe from user's favorites
// @access  Private
router.put('/unsave-recipe/:id', protect, async (req, res) => {
    try {
        const recipeId = req.params.id;
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.savedRecipes = user.savedRecipes.filter(
            id => id.toString() !== recipeId
        );
        
        await user.save();
        res.json({ message: 'Recipe removed from saved list', savedRecipes: user.savedRecipes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/users/saved-recipes
// @desc    Get user's saved recipes
// @access  Private
router.get('/saved-recipes', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('savedRecipes');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.savedRecipes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
