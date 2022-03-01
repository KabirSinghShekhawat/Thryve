import mongoose from "mongoose";
import { promises as fs } from "fs"

import dbConfig from "./dbConfig.js";

const db = await mongoose.connect(dbConfig.db, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

if(!db) {
    console.error("cannot connect to db")
    process.exit(1);
}

import Food from "../models/food.js";

async function seedFoods() {
    try {
        await Food.remove({});
    } catch (err) {
        console.error(err)
    }

    const path = './foods.json'

    try {
        let obj = {
            table: []
        }

        const data = await fs.readFile(path, 'utf-8');

        obj = JSON.parse(data);

        console.log(`no of foods: ${obj.table.length}`);

        obj.table.forEach(async (food) => {
            const newFood = new Food(food);
            await newFood.save();
        })
        console.log("Done!");
    } catch (err) {
        console.error(err);
    }
}

// async function updateFoods() {
//     const foods = await Food.find({});
//     console.log(foods)
//     console.log(`Updating ${foods.length} foods`);
//     foods.forEach(async (food) => {
//         await Food.findByIdAndUpdate(food._id, {
//             ...food,
//             verified: true,
//             activeUsers: 0,
//         })
//     })
//     console.log("Done!");
//     process.exit();
// }

await seedFoods();

process.on('SIGINT', function () {
    mongoose.connection.close(function () {
        console.log('Mongoose disconnected on app termination');
        process.exit(0);
    });
});