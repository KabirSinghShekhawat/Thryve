const Food = require("./../models/food")
const User = require('./../models/user')

exports.getDiet = async (req, res) => {
    const categories = await Food.distinct('categoryTag')
    let
        {_id: userId} = req.user,
        nameQuery,
        categoryQuery = [],
        proteinQuery,
        fatQuery,
        carbohydratesQuery,
        perPage = 6,
        pageQuery = parseInt(req.query.page),
        pageNumber = pageQuery ? pageQuery : 1

    //search query
    if (!req.query.search)
        nameQuery = new RegExp(AnyExp(""), 'gi')
    else
        nameQuery = new RegExp(StrCmpExp(req.query.search), 'gi')

    //category query
    if (req.query.tags)
        for (let key in req.query.tags)
            categoryQuery.push(new RegExp(StrCmpExp(req.query.tags[key]), 'gi'))

    if (categoryQuery.length === 0)
        categoryQuery.push(new RegExp(AnyExp(""), 'gi'))

    //nutrients query
    if (req.query.proteinTag)
        proteinQuery = new RegExp(StrCmpExp(req.query.proteinTag), 'gi')
    else
        proteinQuery = new RegExp(AnyExp(""), 'gi')

    if (req.query.fatTag)
        fatQuery = new RegExp(StrCmpExp(req.query.fatTag), 'gi')
    else
        fatQuery = new RegExp(AnyExp(""), 'gi')


    if (req.query.carbohydratesTag)
        carbohydratesQuery = new RegExp(StrCmpExp(req.query.carbohydratesTag), 'gi')
    else
        carbohydratesQuery = new RegExp(AnyExp(""), 'gi')


    const foods = await Food.find({
        name: nameQuery,
        categoryTag: {$in: categoryQuery},
        proteinTag: proteinQuery,
        fatTag: fatQuery,
        carbohydratesTag: carbohydratesQuery
    })
        .skip(perPage * pageNumber - perPage)
        .limit(perPage)

    const foodCount = await Food
        .count({
            name: nameQuery,
            categoryTag: {$in: categoryQuery},
            proteinTag: proteinQuery,
            fatTag: fatQuery,
            carbohydratesTag: carbohydratesQuery
        })

    const user = await User
        .findById(userId)
        .populate({path: "diet.food"})

    const {search, tags, proteinTag, fatTag, carbohydratesTag} = req.query

    return res.render("diet/index", {
        user: user,
        foods: foods,
        categories: categories,
        current: pageNumber,
        pages: Math.ceil(foodCount / perPage),
        search: search,
        tags: tags,
        proteinTag: proteinTag,
        fatTag: fatTag,
        carbohydratesTag: carbohydratesTag
    })
}

exports.addDiet = async (req, res) => {
    let userId = req.user._id;
    let foodId = req.body.food._id;
    const user = await User.findById(userId)

    let foodItem = user.diet.find(userDiet => {
        return userDiet.food === foodId
    })

    const foodAlreadyExists = (typeof foodItem !== 'undefined')
    if (foodAlreadyExists) {
        req.flash("error", "Already present in Checkout List")
        return res.redirect("/diet")
    }

    const food = await Food.findById(foodId)
    food.activeUsers = food.activeUsers + 1
    await food.save()

    const newFood = {
        food: food,
        quantity: req.body.quantity
    }
    user.diet.push(newFood)
    await user.save()
    return res.redirect("/diet")
}

exports.editDiet = async (req, res) => {
    let userId = req.user._id
    let foodId = req.body.foodInDiet._id

    const user = await User.findById(userId)
    const foodIndex = findFoodIndex(user.diet, foodId)
    if (foodIndex === -1) return res.redirect('diet')

    user.diet[foodIndex].quantity = req.body.quantity;
    await user.save();
    return res.redirect("/diet");
}

exports.removeDiet = async (req, res) => {
    let userId = req.user._id
    let foodId = req.body.foodInDiet._id
    const user = await User.findById(userId)

    const foodIndex = findFoodIndex(user.diet, foodId)

    if (foodIndex === -1)
        return res.redirect('/diet')

    user.diet.splice(foodIndex, 1)
    await user.save()

    const food = await Food.findById(foodId)

    food.activeUsers = food.activeUsers - 1
    await food.save()
    return res.redirect("/diet")
}

function findFoodIndex(diet, foodId) {
    if (typeof diet === 'undefined' || diet.length === 0) return -1
    let foodIndex = -1
    diet.find((userDiet, index) => {
        foodIndex = userDiet.food === foodId ? index : -1
    })
    return foodIndex
}

function StrCmpExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

function AnyExp(text) {
    return text.replace(text, ".*");
}