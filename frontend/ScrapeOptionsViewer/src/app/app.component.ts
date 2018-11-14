import { Component } from "@angular/core";
import { IArticle } from "src/interfaces/Article";
import { AppService } from "./app.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent {
  title = "ScrapeOptionsViewer";

  errorMessage: string;
  articles: IArticle[];
  articlesMasterList: IArticle[];
  apiError: boolean = false;
  loading: boolean = true;

  constructor(private appService: AppService) {
    this.appService.getArticles().subscribe(
      (response: IArticle[]) => {
        this.articles = response;
        this.articlesMasterList = response;
        console.log(this.articles);
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
  }
  // filterHeadline(e: string) {
  //   this.articles = this.articlesMasterList.filter(x =>
  //     x.scrapeDate.toLocaleLowerCase().includes(e.toLocaleLowerCase())
  //   );
  // }
  // filterSymbol(e: string) {
  //   this.articles = this.articlesMasterList.filter(x => {
  //     x.stocks.filter(s =>
  //       s.symbol.toLocaleLowerCase().includes(e.toLocaleLowerCase())
  //     );
  //   });
  // }


}
