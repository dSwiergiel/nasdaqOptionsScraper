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
const dbCollection = db.collections;
connection.once("open", () => {
  console.log("MongoDB database connection established successfully");
});
// ********************************************************************************

/*
Database Model Schema
*/
let ArticleSchema = new Schema({
  // headline is our PK for better or for worse. This is to prevent dups
  headline: { type: String, unique: true },
  url: String,
  stocks: [{ symbol: String, text: String }],
  scrapeDate: { type: String }
});

const ArticleModel = mongoose.model("Article", ArticleSchema);
module.exports = ArticleModel;
// ********************************************************************************

// Scrape URL
const url = "https://www.nasdaq.com/options/";

var articles = [];
scrapeLatest();
/*
Server REST Endpoints
*/
router.route("/getArticles").get((req, res) => {
  ArticleModel.find((err, articles) => {
    if (err){
      console.log(err);
    } else {
      scrapeLatest();
      res.json(articles);
    } 
  });
});
// ********************************************************************************

app.use("/", router);

app.listen(port, () => console.log("Express server running on port", port));

// pseudo constructor for Article objects
function Article(headline, url, stocks, text) {
  this.headline = headline;
  this.url = url;
  this.stocks = stocks;
  this.scrapeDate = moment(Date.now()).format("MM/DD/YY hh:mm A");
}

// Function to scrape latest headlines and the desired content from nasdaq.com/options
async function scrapeLatest() {
  // headless lets it run without opening a browser and displaying what it's doing.
  //It will just do what it should in the background
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // goes to the initial nasdaq.com/options page
  await page.goto(url, {
    waitUntil: "domcontentloaded",
    timeout: 3000000
  });

  // gets all 30 headlines
  var links = await page.evaluate(() => {
    return Array.from(
      document.querySelectorAll("#latest-news-headlines > ul > li")
    ).map(res => res.innerHTML);
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
    await page.goto(article.url, {
      waitUntil: "domcontentloaded",
      timeout: 3000000
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

    let a = new ArticleModel(article);
    a.save(function(err, a) {
      if (err) {
        if (err.code == 11000) {
        } else {
          console.log(err)
        }
      }
    });
  }

  console.log("\n-- Web scrape complete --");
  browser.close();
  return;
}
