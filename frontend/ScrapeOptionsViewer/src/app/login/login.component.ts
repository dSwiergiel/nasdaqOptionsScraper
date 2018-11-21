import { Component, OnInit } from "@angular/core";
import { AppService } from "../app.service";
import { Router } from "@angular/router";
@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.css"]
})
export class LoginComponent implements OnInit {
  response: any;
  username: String;
  password: String;
  loginSuccess: boolean = false;
  user: any;

  constructor(
    private appService: AppService,
    private router: Router,
  ) {}

  ngOnInit() {}

  loginUser() {

    // get user creds from local storage else get from login screen
    // let userLogin = this.appService.getStorage() || {username: this.username, password: this.password}; 

    let userLogin = this.appService.getStorage() == null ? {username: this.username, password: this.password} : this.appService.getStorage();
    // let userLogin = {
    //   username: this.username,
    //   password: this.password
    // };

    this.appService.loginUser(userLogin).subscribe(
      response => {
        this.response = response;
        if (this.response.includes("Success!")) {
          this.appService.userAuthenticated = true;
          this.loginSuccess = true;
          this.appService.setStorage(userLogin);
          this.router.navigate(["/articles"]);
        } else {
          this.appService.userAuthenticated = false;
          this.loginSuccess = false;
          this.appService.removeStorage();
        }
        console.log(this.response);
      },
      err => {}
    );
  }
}
