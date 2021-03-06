import { BrowserModule } from "@angular/platform-browser";
import { NgModule, Injectable } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { RouterModule, Routes, CanActivate, Router } from "@angular/router";
import { AppComponent } from "./app.component";
import { LoginComponent } from "./login/login.component";
import { NavbarComponent } from "./navbar/navbar.component";
import { MainComponent } from "./main/main.component";
import { AppService } from "./app.service";
import { Angular2CsvModule } from "angular2-csv";
import { StorageServiceModule } from "angular-webstorage-service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private appService: AppService) {}

  canActivate() {
    // check to see if a user has been authenticated
    if (this.appService.getStorage() != null) {
      // if they are, return true and allow the user to load the articles component
      return true;
    }

    // If not, they redirect them to the login page
    this.router.navigate(["/login"]);
    return false;
  }
}

const routes: Routes = [
  { path: "articles", component: MainComponent, canActivate: [AuthGuard]},
  // { path: "projects/nasdaqoptionsscraper/login", component: LoginComponent },
  { path: "login", component: LoginComponent},
  { path: "**", component: MainComponent, canActivate: [AuthGuard]},
  { path: "", component: MainComponent, canActivate: [AuthGuard]}
];

@NgModule({
  declarations: [AppComponent, LoginComponent, NavbarComponent, MainComponent],
  imports: [
    BrowserModule,
    BrowserModule,
    HttpClientModule,
    FormsModule,
    Angular2CsvModule,
    StorageServiceModule,
    RouterModule.forRoot(routes, {
      useHash: false,
      scrollPositionRestoration: "enabled"
    })
  ],
  exports: [RouterModule],
  providers: [HttpClient, AuthGuard],
  bootstrap: [AppComponent]
})
export class AppModule {}
