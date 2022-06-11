const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const Recipe = require('./recipes');
const bcrypt = require('bcrypt');

const userSchema = new Schema({
    first: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    contact: {
        type: String
    },
    liked: [{
        type: Schema.Types.ObjectId,
        ref: 'Recipe'
    }],
    recipes: [{
            type: Schema.Types.ObjectId,
            ref: 'Recipe'
                // reference to recipes
        }]
        // Add a functionality of viewing all the recipes done by a specific Cook/User.
})

userSchema.statics.findAndValidate = async function(username, password) {
    const foundUser = await this.findOne({ username });
    if (foundUser) {
        const isValid = await bcrypt.compare(password, foundUser.password);
        return isValid ? foundUser : false;
    } else {
        return false;
    }
}

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 12);
    next();
})

userSchema.post('findOneAndDelete', async function(user) {
    if (user.recipes.length > 0) {
        const recipes = await User.deleteMany({ _id: { $in: user.recipes } });
    }
    if (user.liked.length > 0) {
        const recipes = await User.deleteMany({ _id: { $in: user.liked } });
    }
})

const User = model('User', userSchema);

module.exports = User;