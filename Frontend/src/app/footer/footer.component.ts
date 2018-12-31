import { Component, OnInit } from '@angular/core';
import { MultiLanguageService } from '../language.service';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html'
})
export class FooterComponent implements OnInit {
    constructor(private lang: MultiLanguageService) { }
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