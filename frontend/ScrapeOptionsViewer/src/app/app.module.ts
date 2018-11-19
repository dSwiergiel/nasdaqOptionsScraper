import { BrowserModule } from "@angular/platform-browser";
import { NgModule, Injectable } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HttpClient, HttpClientModule } from "@angular/common/http";
import { RouterModule, Routes } from "@angular/router";
import { AppComponent } from "./app.component";
import { LoginComponent } from "./login/login.component";
import { NavbarComponent } from "./navbar/navbar.component";
import { MainComponent } from './main/main.component';

const routes: Routes = [
  { path: "articles", component: MainComponent },
  { path: "login", component: LoginComponent },
  { path: "**", component: LoginComponent },
  { path: "", component: LoginComponent }
] ;

@NgModule({
  declarations: [AppComponent, LoginComponent, NavbarComponent, MainComponent],
  imports: [
    BrowserModule,
    BrowserModule,
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot(routes, { useHash: false, scrollPositionRestoration: 'enabled'})
  ],
  exports: [
    RouterModule
  ],
  providers: [HttpClient],
  bootstrap: [AppComponent]
})
export class AppModule {}
