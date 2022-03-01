import mongoose from "mongoose";
import { promises as fs } from "fs"

import dbConfig from "./dbConfig.js";

const db = await mongoose.connect(dbConfig.db, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

if (!db) {
    console.error("cannot connect to db")
    process.exit(1);
}

import Exercise from "../models/exercise.js";

async function seedExercises() {
    try {
        await Exercise.remove({});
    } catch (err) {
        console.error(err)
    }

    const path = './exercises.json'

    try {
        let obj = {
            table: []
        }

        const data = await fs.readFile(path, 'utf-8');

        obj = JSON.parse(data);

        console.log(`no of exercises: ${obj.table.length}`);

        obj.table.forEach(async (exercise) => {
            const newExercise = new Exercise(exercise);
            await newExercise.save();
        })
        console.log("Done!");
    } catch (err) {
        console.error(err);
    }
}

// async function updateExercises() {
//     const exercises = await Exercise.find({});
//     exercises.forEach(async (exercise) => {
//         await Exercise.findByIdAndUpdate(exercise._id, {
//             ...exercise,
//             verified: true,
//             activeUsers: 0,
//         })
//     })
// }


await seedExercises();

process.on('SIGINT', function () {
    mongoose.connection.close(function () {
        console.log('Mongoose disconnected on app termination');
        process.exit(0);
    });
});
