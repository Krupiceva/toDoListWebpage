//native node modules
const https = require("https");

//external node modules, installed via npm
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

//local modules
const date = require(__dirname + "/date.js");

/*******Application*******/

//Database initialization
mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});
const itemSchema = new mongoose.Schema({
  name: String
});
const Item = mongoose.model("Item", itemSchema);
//Make some default data
const item1 = new Item({
  name: "Welcome to your toDo list"
});
const item2 = new Item({
  name: "Hit the + button to add more items"
});
const item3 = new Item({
  name: "<-- Hit this to delete an item"
});
let defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});
const List = mongoose.model("List", listSchema);

//Express initialization
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
app.set("view engine", "ejs");

/*Homepage*/
//Get route
app.get("/", function(req, res) {
  //Find all items in DB
  Item.find(function(err, foundItems){
    //If collection itmes is empty then add default values and redirect to homepage, otherwise render the homepage
    if(foundItems.length === 0){
      //Insert default data to DB
      Item.insertMany(defaultItems, function(err){
        if(err){
          console.log(err);
        } else{
          console.log("Successfully added default items!");
        }
      });
      res.redirect("/");
    } else{
        res.render("list", {listTitle: "Today", newListItems: foundItems});
    }

  });
});
//Post route
app.post("/", function(req, res){
  let itemName = req.body.newValue;
  let listName = req.body.list;

  let newItem =  new Item({
    name: itemName
  });

  if(listName === "Today"){
    //Add new item to DB
    newItem.save();
    res.redirect("/");
  }else{
    List.findOne({name: listName}, function(err, foundList){
      if(!err){
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/" + listName);
      }
    });
  }

});

//Delete post route: when user check checkbox next to some item in todo list
app.post("/delete", function(req, res){
  let checkedItemID = req.body.checkbox;
  let listName = req.body.listName;

  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemID, function(err){
      if(err){
        console.log(err);
      } else{
        console.log("Successfully deleted an item from DB");
        res.redirect("/");
      }
    });
  } else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }


});

//Custom routes
app.get("/:customTitle", function(req, res){
  let customTitle = _.capitalize(req.params.customTitle);

  List.findOne({name: customTitle}, function(err, foundList){
    if(!err){
      if(!foundList){
        //Create a new list
        let list = new List({
          name: customTitle,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customTitle);
      } else{
        //Show existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  })

});

app.post("/work", function(req, res){
  let item = req.body.newValue;
  workItems.push(item);
  res.redirect("/work");
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
