const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const User = require('./users');

const recipeSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    images: [
        {
            url: String,
            filename: String
        }
    ],
    ingredients: {
        type: String,
        required: true
    },
    method: {
        type: String,
        required: true
    },
    ratings: {
        type: Number,
        enum: ['1','2','3','4','5']
    },
    likes: {
        type: Number,
        min: 0
    },
    cook: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
        // reference to User
    },
    comments: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        comment: {
            type: String,
        }
    }]
})

// userSchema.post('findOneAndDelete', async function(user) {
//     if (user.recipes.length > 0) {
//         const recipes = await User.deleteMany({ _id: { $in: user.recipes } });
//     }
//     if (user.liked.length > 0) {
//         const recipes = await User.deleteMany({ _id: { $in: user.liked } });
//     }
// })

// recipeSchema.post('findOneAndDelete', async function(recipe) {
//     if (recipe.)
// })

// recipeSchema.pre('findOneAndDelete',function() {

// })

const Recipe = model('Recipe',recipeSchema);

module.exports = Recipe;