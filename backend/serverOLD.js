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
var db = mongoose.connect("mongodb://localhost:27017/nasdaqArticles");

const connection = mongoose.connection;
const dbCollection = db.collections;
connection.once("open", () => {
  console.log("MongoDB database connection established successfully!");
});
// ********************************************************************************

/*
Database Model Schema
*/
let ArticleSchema = new Schema({
  headline: String,
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

let scrape = async () => {
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

  // console.log(articles)
  // for (let a of articles) {
  //   console.log(a);
  // }

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

    // articleText = articleText.replace(RegExp("\n","g"), "<br>");
    var symbolText = articleText.split("(Symbol: ");

    // var $ = cheerio.load(articleTextHTML);
    let i = +0;
    for (let stock of article.stocks) {
      if (i == +0) {
        stock.text = symbolText[i] + "(" + symbolText[i + 1];
        i++;
      } else {
        stock.text = "(" + symbolText[i];
      }
      i++;
      // stock.text = $("p").text();
    }

    // console.log($('p').text());
    console.log(article);

    // let a = new ArticleModel(JSON.stringify(article));
    let a = new ArticleModel(article);
    a.save(function(err, a) {
      if (err) return console.error(err);
    });
  }

  console.log("\n-- Web scrape complete --");
  browser.close();
  return;
};

scrape().then(values => {});

// var ArticleSchema = new Schema({
//   headline: String,
//   url: String,
//   stocks: [{symbol: String, text: String}],
//   scrapeDate: String
// })

function Article(headline, url, stocks, text) {
  this.headline = headline;
  this.url = url;
  this.stocks = stocks;
  this.scrapeDate = moment(Date.now()).format("MM/DD/YY HH:mm A");
}

// function Stock(symbol, text) {
//   this.symbol = symbol;
//   this.text = text;
// }

app.use("/", router);

app.listen(port, () => console.log("Express server running on port", port));







