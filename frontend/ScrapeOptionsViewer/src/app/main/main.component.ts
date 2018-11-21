import { Component, OnInit } from "@angular/core";
import { IArticle } from "src/interfaces/Article";
import { AppService } from "../app.service";
import { Angular5Csv } from "angular5-csv/Angular5-csv";
import * as jsPDF from "jspdf";
import html2canvas from "html2canvas";

@Component({
  selector: "app-main",
  templateUrl: "./main.component.html",
  styleUrls: ["./main.component.css"]
})
export class MainComponent implements OnInit {
  title = "Options Scrape Viewer";

  errorMessage: string;
  articles: IArticle[];
  articlesMasterList: IArticle[];
  apiError: boolean = false;
  loading: boolean = true;
  noArticlesFound: boolean = false;
  fetchingScrape: boolean = false;
  alreadyScraped: boolean = false;
  finishedScrape: boolean = false;
  csvData: any;
  options: any;
  generatingPDF: boolean = false;

  constructor(private appService: AppService) {
    this.appService.getArticles().subscribe(
      (response: IArticle[]) => {
        this.articles = response;
        console.log(this.articles)

        this.articlesMasterList = this.articles;
        this.loading = false;
      },
      err => {
        this.apiError = true;
        this.loading = false;
      }
    );
  }

  ngOnInit() {
    this.appService.validateSession();
  }

  getNewArticles() {
    console.log("Fetching new articles...");
    this.fetchingScrape = true;
    this.alreadyScraped = false;
    this.finishedScrape = false;

    this.appService.getNewArticles().subscribe(
      (response: IArticle[]) => {
        if (response.length == 0) {
          this.alreadyScraped = true;
        } else {
          this.articles = response;
          console.log("Received new articles.");
          this.articlesMasterList = this.articles;
          this.alreadyScraped = false;
          this.finishedScrape = true;
        }
        this.fetchingScrape = false;
        this.loading = false;
      },
      err => {
        this.apiError = true;
        this.loading = false;
        this.alreadyScraped = false;
        this.fetchingScrape = false;
      }
    );
  }

  exportCSV() {
    this.csvData = [];

    for (let art of this.articles) {
      let a = {
        headline: art.headline,
        scrapeDate: art.scrapeDate,
        symbol1: art.stocks[0].symbol,
        symbol2: art.stocks[1].symbol,
        symbol3: art.stocks[2].symbol,
        text1: art.stocks[0].text,
        text2: art.stocks[1].text,
        text3: art.stocks[2].text
      };
      this.csvData.push(a);
    }

    var options = {
      fieldSeparator: ",",
      quoteStrings: '"',
      decimalseparator: ".",
      showLabels: true,
      showTitle: true,
      noDownload: false,
      headers: [
        "headline",
        "scrapeDate",
        "symbol1",
        "symbol2",
        "symbol3",
        "text1",
        "text2",
        "text3"
      ]
    };

    new Angular5Csv(this.csvData, "articles", options);
  }

  print(): void {
    let printContents, popupWin;
    printContents = document.getElementById("articleContainer").innerHTML;
    popupWin = window.open("", "_blank", "top=0,left=0,height=100%,width=auto");
    popupWin.document.open();
    popupWin.document.write(`
      <html>
        <head>
          <title>Print tab</title>
          <style>
          //........Customized style.......
          </style>
        </head>
    <body onload="window.print();window.close()">${printContents}</body>
      </html>`);

    popupWin.document.close();
  }

  async exportPDF() {
    this.generatingPDF = true;
    let doc = new jsPDF("p", "mm", "a4");
    for (var i = 0; i < this.articles.length; i++) {
      let data = document.getElementById("article" + i);
      await html2canvas(data).then(canvas => {
        // let img = this.getBase64Image(canvas);
        // Few necessary setting options
        var imgWidth = 208;
        var pageHeight = 295;
        var imgHeight = (canvas.height * imgWidth) / canvas.width;
        var heightLeft = imgHeight;
        var position = 0;
        const contentDataURL = canvas.toDataURL("image/png");
        doc.addImage(contentDataURL, "PNG", 0, position, imgWidth, 250);
        doc.addPage();
      });
    }
    this.generatingPDF = false;
    await doc.save("articles.pdf");
  }

  filterHeadline(e: string) {
    this.articles = this.articlesMasterList.filter(x =>
      x.headline.toLocaleLowerCase().includes(e.toLocaleLowerCase())
    );
    if (this.articles.length == 0) {
      this.noArticlesFound = true;
    } else {
      this.noArticlesFound = false;
    }
  }
  filterDate(e: string) {
    this.articles = this.articlesMasterList.filter(x =>
      x.scrapeDate.toLocaleLowerCase().includes(e.toLocaleLowerCase())
    );
    if (this.articles.length == 0) {
      this.noArticlesFound = true;
    } else {
      this.noArticlesFound = false;
    }
  }

  filterSymbol(e: string) {
    this.articles = this.articlesMasterList.filter(x =>
      x.stocks.find(
        s =>
          s.symbol.toString().toLocaleUpperCase() ==
          e.toString().toLocaleUpperCase()
      )
    );
    if (e.length == 0) {
      this.articles = this.articlesMasterList;
    }
    if (this.articles.length == 0) {
      this.noArticlesFound = true;
    } else {
      this.noArticlesFound = false;
    }
  }
}
