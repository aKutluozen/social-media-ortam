import { Component } from "@angular/core";
import { AuthService } from "./auth.service";
import { GlobalService } from "../globals.service";
import { MultiLanguageService } from '../language.service';

@Component({
    selector: 'app-auth',
    templateUrl: './auth.component.html'
})
export class AuthComponent {
    constructor(
        private auth: AuthService,
        public global: GlobalService,
        public lang: MultiLanguageService
    ) { }

    // Check if logged in
    isLoggedIn() {
        return this.auth.isLoggedIn();
    }
}