// Main modules
import { Injectable, EventEmitter } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { HttpParams } from '@angular/common/http';
import 'rxjs/Rx';
import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

// Models
import { User } from '../user/user.model';
import { GlobalService } from 'app/globals.service';

@Injectable()
export class AuthService {

    constructor(
        private http: Http,
        public global: GlobalService
    ) { }

    private headers = { headers: new Headers({ 'Content-Type': 'application/json' }) };
    private messageSource = new BehaviorSubject<string>("");

    public currentMessage = this.messageSource.asObservable();

    // Service can talk outside the world
    changeMessage(message: string) {
        this.messageSource.next(message);
    }

    // Create the token string
    getToken() {
        return this.getCookie('token') ? '?token=' + this.getCookie('token') : '';
    }

    // Create the token string
    getHeaders() {
        return { headers: new Headers({ 'Content-Type': 'application/json' }) };
    }

    // Clear the local storage, get rid of token and the other info
    logout() {
        this.setCookie('token', null, 0);
        this.setCookie('userId', null, 0);
        this.setCookie('user', null, 0);
        // window.location.href = './';
        window.location.reload(true);
        // navigator['app'].loadUrl('file:///android_asset/www/index.html');
    }

    // Determined by checking if there is a token saved or not
    isLoggedIn() {
        return this.getCookie('token') !== '';
    }

    // Sign up a user for the first time
    signup(user: User) {
        return this.http.post(this.global.URL + 'user', JSON.stringify(user), this.headers)
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    // Sign in
    signin(user: User) {
        return this.http.post(this.global.URL + 'user/signin', JSON.stringify(user), this.headers)
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    // Cookie functions
    setCookie(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
    }

    sendResetRequest(email) {
        return this.http.post(this.global.URL + 'mail/reset', JSON.stringify({ email: email }), this.headers)
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    refreshPassword(email, code, newPassword) {
        return this.http.post(this.global.URL + 'mail/reset/new', JSON.stringify({ email: email, code: code, newPassword: newPassword }), this.headers)
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }


    sendErrorMessage(error) {
        return this.http.post(this.global.URL + 'mail/error', JSON.stringify({ error: error }), this.headers)
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    sendAdminMessage(message, type, user) {
        return this.http.post(this.global.URL + 'mail/message', JSON.stringify({ message: message, messageType: type, nickName: user }), this.headers)
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }
}