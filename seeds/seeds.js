const mongoose = require("mongoose");
const User = require('../models/users.js');
const Recipe = require('../models/recipes.js');

mongoose.connect('mongodb://localhost:27017/recipes-webapp')
    .then(() => {
        console.log("recipes db connected");
    })
    .catch(e => {
        console.log("db connection error:", e);
    })

const createNewUser = async() => {
    // await User.deleteMany({});
    const newUser = new User({
        first: "testuser3",
        email: "test3@gmail.com",
        username: "test3",
        password: "test3"
    })
    await newUser.save()
}
// createNewUser()

const createNewRecipe = async() => {
    const u = await User.findOne({ first: "testuser5" });
    const recipe = new Recipe({
        title: "Jeera Rice",
        description: "lorem ipsum dolor sit amet",
        ingredients: "Jeera, Rice",
        cook: u,
        method: "lorem ipsum dolor sit amet"
    })
    await recipe.save();
    u.recipes.push(recipe);
    await u.save();
}

createNewRecipe()
.then(res => {
    mongoose.connection.close();
})
.catch(e => {
    console.log('new error:',e);
})