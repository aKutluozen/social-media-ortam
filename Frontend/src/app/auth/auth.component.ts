import { Component, OnInit } from "@angular/core";
import { AuthService } from "./auth.service";
import { GlobalService } from "../globals.service";
import { MultiLanguageService } from "../language.service";

@Component({
    selector: 'app-auth',
    templateUrl: './auth.component.html'
})
export class AuthComponent implements OnInit {
    constructor(
        private auth: AuthService,
        public global: GlobalService,
        public lang: MultiLanguageService
    ) { }

    // Check if logged in
    isLoggedIn() {
        return this.auth.isLoggedIn();
    }

    ngOnInit() {
        let chosenLang = localStorage.getItem('lang');
        if (chosenLang == 'tr') {
            this.switchLanguage('turkish');
        } else {
            this.switchLanguage('english');
        }
    }

    switchLanguage(language) {
        if (language == 'english') {
            this.lang.text = this.lang.text_EN;
            localStorage.setItem('lang', 'en');
        } else {
            this.lang.text = this.lang.text_TR;
            localStorage.setItem('lang', 'tr');
        }
    }
}