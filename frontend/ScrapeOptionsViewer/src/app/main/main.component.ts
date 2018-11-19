import { Component, OnInit } from "@angular/core";
import { IArticle } from "src/interfaces/Article";
import { AppService } from "../app.service";

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

  constructor(private appService: AppService) {
    this.appService.getArticles().subscribe(
      (response: IArticle[]) => {
        this.articles = response;

        this.articlesMasterList = this.articles;
        this.loading = false;
      },
      err => {
        this.apiError = true;
        this.loading = false;
      }
    );
  }
  ngOnInit() {}

  getNewArticles() {
    console.log('Fetching new articles...')
    this.appService.getNewArticles().subscribe(
      (response: IArticle[]) => {
        this.articles = response;
        console.log('Received new articles.')
        this.articlesMasterList = this.articles;
        this.loading = false;
      },
      err => {
        this.apiError = true;
        this.loading = false;
      }
    );
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
