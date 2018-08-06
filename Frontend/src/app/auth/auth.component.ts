import { Component } from "@angular/core";
import { AuthService } from "./auth.service";
import { GlobalService } from "../globals.service";

@Component({
    selector: 'app-auth',
    templateUrl: './auth.component.html'
})
export class AuthComponent {
    constructor(private auth: AuthService, private global: GlobalService) { }

    // Check if logged in
    isLoggedIn() {
        return this.auth.isLoggedIn();
    }
}