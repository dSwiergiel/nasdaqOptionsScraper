const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const moment = require("moment");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
Server Config
*/
const app = express();
const router = express.Router();

app.use(cors());
app.use(bodyParser.json());

const port = 4000;
// ********************************************************************************

/*
Database Connection
*/
var db = mongoose.connect(
  "mongodb://localhost:27017/nasdaqArticles",
  { useNewUrlParser: true }
);

const connection = mongoose.connection;
connection.once("open", () => {
  console.log("MongoDB database connection established successfully");
});
// ********************************************************************************

/*
Database Model Schemas
*/
let ArticleSchema = new Schema({
  // headline is our PK for better or for worse. This is to prevent dups
  headline: { type: String, unique: true },
  url: String,
  stocks: [{ symbol: String, text: String }],
  scrapeDate: { type: String },
  scrapeDataStandard: { type: Number }
});
const ArticleModel = mongoose.model("Article", ArticleSchema);
module.exports = ArticleModel;

// ---- NOTE: LOGIN WAS JUST FOR DEMONSTRATION PURPOSES. -----
// ---- NEVER EVER EVER STORE PLAIN TEXT PASSWORDS IN PRODUCTION APPLICATIONS!!!!!! -----
let UserSchema = new Schema({
  username: { type: String, unique: true },
  password: {}
});
const UserModel = mongoose.model("User", UserSchema);
module.exports = UserModel;
// ********************************************************************************

// Scrape URL
const url = "https://www.nasdaq.com/options/";

var articles = [];
var lastScrapeDate = null;
// scrapeLatest();
/*
Server REST Endpoints
*/
router.route("/getArticles").get((req, res) => {
  ArticleModel.find((err, articles) => {
    if (err) {
      console.log(err);
    } else {
      res.json(
        // sort date from newest to oldest
        articles.sort(function(a, b) {
          a = new Date(a.scrapeDataStandard);
          b = new Date(b.scrapeDataStandard);
          return a > b ? -1 : a < b ? 1 : 0;
        })
      );
      // only allow new scrape if its' never been done since server restart
      // or if it has been at least 5 minutes since last scrape
      if (
        lastScrapeDate == null ||
        moment(Date.now()).valueOf() - lastScrapeDate > 300000
      ) {
        scrapeLatest();
      }
    }
  });
});

// for full search which includes results from current scrape
router.route("/getNewArticles").get((req, res) => {
  ArticleModel.find((err, articles) => {
    if (err) {
      console.log(err);
    } else {
      // only allow new scrape if its' never been done since server restart
      // or if it has been at least 5 minutes since last scrape. Else, send content stored in database
      if (
        lastScrapeDate == null ||
        moment(Date.now()).valueOf() - lastScrapeDate > 300000
      ) {
        scrapeLatest().then(() => {
          res.json(
            // sort date from newest to oldest
            articles.sort(function(a, b) {
              a = new Date(a.scrapeDataStandard);
              b = new Date(b.scrapeDataStandard);
              return a > b ? -1 : a < b ? 1 : 0;
            })
          );
        });
      } else { // if scrape has been done recently, send empty array since database was fetched on page load. 
        let emptyArray = [];
        res.json(emptyArray);
      }
    }
  });
});

// NOT REAL USER AUTHENTICATION AT ALL!!! JUST A SIMPLE PLAIN TEXT LOGIN FOR DEMONSTRATION PURPOSES.
// LIKE SERIOUSLY, THIS IS A REALLY BAD WAY TO DO LOGIN AND AUTHENTICATION.
// NEVER STORE PLAIN TEXT OR SEND PLAIN TEXT FOR CREDENTIALS!!!!!!!
router.route("/loginUser").post((req, res) => {
  UserModel.findOne(
    { username: req.body.username, password: req.body.password },
    (err, user) => {
      if (err) {
        console.log(err);
      } else {
        if (user) {
          res.json("Success!");
        } else {
          res.json("Username or password is invalid!");
        }
      }
    }
  );
});

app.use("/", router);

app.listen(port, () => console.log("Express server running on port", port));
// ********************************************************************************

/*
Scrape and Helper functions
*/

// pseudo constructor for Article objects
function Article(headline, url, stocks, text) {
  this.headline = headline;
  this.url = url;
  this.stocks = stocks;
  this.scrapeDate = moment(Date.now()).format("MM/DD/YY hh:mm A");
  this.scrapeDataStandard = moment(Date.now()).valueOf();
}

// Function to scrape latest headlines and the desired content from nasdaq.com/options
async function scrapeLatest() {
  // headless lets it run without opening a browser and displaying what it's doing.
  //It will just do what it should in the background
  console.log("\n-- Web scrape started --");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  lastScrapeDate = moment(Date.now()).valueOf();

  // goes to the initial nasdaq.com/options page
  await page
    .goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 30000
    })
    .catch(err => {
      console.log("Nav time took to long");
    });

  // gets all 30 headlines
  var links = await page
    .evaluate(() => {
      return Array.from(
        document.querySelectorAll("#latest-news-headlines > ul > li")
      ).map(res => res.innerHTML);
    })
    .catch(err => {
      browser.close();
      console.log(err);
    });

  // filters headlines to ones that include "Notable" or "Noteworthy"
  for (let link of links) {
    var $ = cheerio.load(link);

    if (
      ($("b")
        .text()
        .includes("Notable") &&
        $("b")
          .text()
          .includes("Option")) ||
      ($("b")
        .text()
        .includes("Noteworthy") &&
        $("b")
          .text()
          .includes("Option"))
    ) {
      let h = $("b").text();
      let u = $.root()
        .find("a")
        .attr("href");

      // creates a new article object
      let newArticle = new Article(h, u, null, null);

      // pushes to array
      articles.push(newArticle);
    }
  }

  // gets stock symbols from headline, splits them, then adds to each article object
  for (let article of articles) {
    // splits headline at ":" and takes second half of split which contains stock symbols
    let stocksString = article.headline.split(":")[1];

    // splits symbols by ","
    let stockSymbols = stocksString.split(",");

    let stocks = [];

    for (let sym of stockSymbols) {
      // var stock = new Stock(sym, null);
      var stock = { symbol: sym.trim(), text: null };
      stocks.push(stock);
    }

    article.stocks = stocks;
  }

  // goes to each of the relevant articles and scraps needed data
  for (let article of articles) {
    await page
      .goto(article.url, {
        waitUntil: "domcontentloaded",
        timeout: 30000
      })
      .catch(err => {
        console.log("Nav time took to long");
        browser.close();
        return;
      });

    // gets article text
    var articleText = await page.evaluate(() => {
      return document.getElementById("articleText").innerText.trim();
    });

    // splits article text by each mention of the stocks in the headline
    var symbolText = articleText.split("(Symbol: ");

    // adds each stocks associated text
    let i = +0;
    for (let stock of article.stocks) {
      if (i == +0) {
        stock.text = symbolText[i] + "(" + symbolText[i + 1];
        i++;
      } else {
        stock.text = "(" + symbolText[i];
      }
      i++;
    }

    console.log(article);

    // adds the article object to the database
    let a = new ArticleModel(article);
    a.save(function(err, a) {
      if (err) {
        // error code 11000 is when it tried saving duplicate articles.
        // This is fine since we can't know when there will be from the scrape, we just won't add them.
        if (err.code == 11000) {
        } else {
          browser.close();

          console.log(err);
        }
      }
    });
  }

  console.log("\n-- Web scrape complete --");
  browser.close();
  return;
}
