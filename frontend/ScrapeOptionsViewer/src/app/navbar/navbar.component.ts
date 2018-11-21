import { Component, OnInit } from '@angular/core';
import { AppService } from "../app.service";
import {  Router } from "@angular/router";

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  constructor(private appService: AppService, private router: Router) {

   }

  ngOnInit() {
  }

  logoutUser(){
    this.appService.userAuthenticated = false;

    // removes user from local storage
    this.appService.removeStorage();
    this.router.navigate(["/login"]);
  }

}
