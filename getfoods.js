import mongoose from "mongoose";
mongoose.connect("mongodb://localhost/dietnote", {useNewUrlParser: true, useUnifiedTopology: true});
import Food from "./models/food"
import fs from "fs"

fs.exists('foods.json', function(exists){
   if(exists){
        console.log("delete the existing foods.json first");
   }
   else{
        Food.find({}, function(err, foods){
            var obj = {
                table:[]
            };
            obj.table = foods;
            var json = JSON.stringify(obj);
            fs.writeFile('foods.json', json, 'utf8', function(err){
                console.log("done");
            });   
       });
   }
});