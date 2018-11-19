import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
// import { HttpClient } from 'selenium-webdriver/http';
import { Observable, EMPTY, throwError } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";
@Injectable({
  providedIn: "root"
})
export class AppService {
  private apiUrl: string;
  constructor(private httpClient: HttpClient) {
    this.apiUrl = "http://localhost:4000";
  }

  getArticles() {
    return this.httpClient.get(this.apiUrl + "/getArticles/").pipe(
      catchError(err => {
        return throwError(err);
      })
    );
  }

  getNewArticles() {
    return this.httpClient.get(this.apiUrl + "/getNewArticles/").pipe(
      catchError(err => {
        return throwError(err);
      })
    );
  }
}
