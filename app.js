if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

//Node modules
const express = require("express");
const path = require("path");
const ejsMate = require("ejs-mate");
const ExpressError = require('./utils/ExpressError');
const request = require("request"); // library for node.js similar to fetch

const app = express();

//The Movie DB Api
const APIKEY = process.env.APIKEY;

//Setting the view engine to ejs
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));

//Initialising Express
app.use(express.static(path.join(__dirname, "public")));


function getRequest(url) {
  try {
    return new Promise(function (success, failure) {
        request(url, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                success(body);
            } else {
                failure(error);
            }
        });
    });
  } catch(error) {
    console.log(error);
  }
}

//Routes
app.get("/", (req, res) => {
  res.render("home");
});

app.get('/films', (req, res) => {
  try{
  let query = req.query.search; 
  request(`https://api.themoviedb.org/3/search/movie?api_key=${APIKEY}&include_adult=false&query=` + query, (error, response, body) => {
      if(error){
          console.log(error);
      } else {
          let data = JSON.parse(body);
          res.render('index', {data: data, querySearch: query}); //passes variables to rendered page. 
      }  
  })
} catch(error) {
  console.log(error) && res.render('error');
}
})

app.get('/films/:id', (req, res) => {
  try {
  let filmId = req.params.id; //takes id paramter defined on the index page.
        getRequest(`https://api.themoviedb.org/3/movie/${filmId}/credits?api_key=${APIKEY}&language=en-US`).then(function (body1) {
          let actorData = JSON.parse(body1);
          res.locals.actorData = actorData; // global variable in ejs template 
          return getRequest(`https://api.themoviedb.org/3/movie/${filmId}?api_key=${APIKEY}&language=en-US`);
      }).then(function (body2) {
        let filmData = JSON.parse(body2);
        res.render('show', {filmData: filmData, querySearch: filmId}); //passes variables to rendered page. 
      });
    } catch(error) {
      console.log(error) && res.render('error');
    }
});

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404))
})

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) err.message = "Oh No, Something Went Wrong!";
  res.status(statusCode).render("error", { err });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Serving on port: ${port}`);
});
