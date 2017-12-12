// Dependencies
var express            = require("express");
var bodyParser         = require("body-parser");
var logger             = require("morgan");
var mongoose           = require("mongoose");
var axios              = require("axios");
var cheerio            = require("cheerio");
var expressHandlebars  = require('express-handlebars');


// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: false }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));

// set up handlebars
app.set("view engine", "hbs"); // Setup Handlebars.
app.engine("hbs", expressHandlebars({
  defaultLayout: "main.hbs",
  extname: ".hbs"
}));


// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/chronicle_scraper";
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
  useMongoClient: true
});

// Routes

app.get("/", function(req, res) {
  res.render('home');
})

app.get("/saved", function(req, res) {
  res.render('saved');
})

// A GET route for scraping the echojs website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  axios.get("https://www.austinchronicle.com/calendar/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $("li.list-item").each(function(i, element) {
      // Save an empty result object
      var result = {};
      result.saved = false;

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("div.event-text")
        .children("h2")
        .children("a")
        .text();

      result.description = $(this)
        .children("div.event-text")
        .children("div.description")
        .text()
        .trim();

      result.dateTime = $(this)
        .children("div.event-text")
        .children("div.date-time")
        .text();
        
      result.venue = $(this)
        .children("div.event-text")
        .children("div.venue")
        .text();
        
      result.link = "https://www.austinchronicle.com" + $(this)
        .children("div.event-text")
        .children("h2")
        .children("a")
        .attr("href");
        
      // Create a new Event using the `result` object built from scraping
      var condition = { title: result.title };
      var update = { $setOnInsert: result };
      var options = { upsert: true };
      
      db.ChronicleEvent
        .update(condition, update, options)
        .then(function(dbChronicleEvent) {
          // If we were able to successfully scrape and save an Article, send a message to the client
          res.send("Scrape Complete");
        })
        .catch(function(err) {
          // If an error occurred, send it to the client
          res.json(err);
        });
    });
  });
});

// Route for getting all Articles from the db
app.get("/events", function(req, res) {
  // Grab every document in the Articles collection
  db.ChronicleEvent
    .find({})
    .then(function(dbChronicleEvents) {
      // If we were able to successfully find Events, send them back to the client
      res.json(dbChronicleEvents);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for getting all Saves from the db
app.get("/saves", function(req, res) {
  // Grab every documents in the ChronicleEvents collection where saved equals true
  db.ChronicleEvent
    .find({ saved: true })
    .then(function(dbChronicleEvents) {
      // If we were able to successfully find ChronicleEvents, send them back to the client
      res.json(dbChronicleEvents);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving an Event
app.post("/saves/:id", function(req, res) {
  db.ChronicleEvent.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true })
  .then(function(dbEvent) {
    // If we were able to successfully update an Article, send it back to the client
    res.json(dbEvent);
  })
  .catch(function(err) {
    // If an error occurred, send it to the client
    res.json(err);
  });  
});


// Route for grabbing a specific Article by id, populate it with it's note
app.get("/events/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.ChronicleEvent
    .findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("notes")
    .then(function(dbEvents) {
      // If we were able to successfully find an Event with the given id, send it back to the client
      res.json(dbEvents);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving an Event's associated Note
app.post("/events/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note
    .create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.ChronicleEvent.findOneAndUpdate({ _id: req.params.id }, { $push: { notes: dbNote._id } }, { new: true });
    })
    .then(function(dbEvent) {
      // If we were able to successfully update an Event, send it back to the client
      res.json(dbEvent);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving an Event's associated Note
app.delete("/events/:id", function(req, res) {
    db.ChronicleEvent.findOneAndUpdate({ _id: req.params.id }, { $pull: { notes: req.body.noteId } }, { new: true })
    .then(function(dbEvent) {
      // If we were able to successfully update an Event, send it back to the client
      res.json(dbEvent);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});


// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});
