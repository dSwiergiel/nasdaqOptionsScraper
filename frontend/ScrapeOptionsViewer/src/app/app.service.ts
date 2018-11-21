import { Injectable, Inject } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
// import { HttpClient } from 'selenium-webdriver/http';
import { Observable, EMPTY, throwError } from "rxjs";
import { catchError, map, tap } from "rxjs/operators";
import {
  SESSION_STORAGE,
  InMemoryStorageService
} from "angular-webstorage-service";

// key that is used to access the data in local storage
const STORAGE_KEY = "local_User";
@Injectable({
  providedIn: "root"
})
export class AppService {
  private apiUrl: string;
  userAuthenticated: Boolean = false;
  user: any;

  constructor(
    private httpClient: HttpClient,
    @Inject(SESSION_STORAGE) private storage: InMemoryStorageService
  ) {
    // this.apiUrl = "http://localhost:4000";
    this.apiUrl = "192.241.129.214";
  }

  getArticles() {
    return this.httpClient.get(this.apiUrl + "/getArticles/").pipe(
      catchError(err => {
        return throwError(err);
      })
    );
  }

  // get user from local storage
  getStorage() {
    return this.storage.get(STORAGE_KEY) || null;
  }
  // insert user info to local storage
  setStorage(data) {
    this.storage.set(STORAGE_KEY, data);
  }
  // remove user creds from local storage
  removeStorage() {
    this.storage.remove(STORAGE_KEY);
  }

  loginUser(body) {
    const httpOptions = {
      headers: new HttpHeaders({
        "Content-Type": "application/json"
      })
    };
    return this.httpClient
      .post(this.apiUrl + "/loginUser/", body, httpOptions)
      .pipe(
        catchError(err => {
          return throwError(err);
        })
      );
  }

  validateSession() {
    if (0) {
      return (this.userAuthenticated = true);
    } else {
      return (this.userAuthenticated = false);
    }
  }

  getNewArticles() {
    return this.httpClient.get(this.apiUrl + "/getNewArticles/").pipe(
      catchError(err => {
        return throwError(err);
      })
    );
  }
}
