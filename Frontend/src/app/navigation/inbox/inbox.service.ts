// Main modules
import { Injectable, EventEmitter } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs';

// Services
import { AuthService } from 'app/auth/auth.service';
import { GlobalService } from 'app/globals.service';

@Injectable()
export class InboxService {

    constructor(
        private http: Http,
        private auth: AuthService,
        public global: GlobalService
    ) { }

    // Get all the messages and requests - Internal
    getMessagesWithAFriend(messageId) {
        return this.http.get(this.global.URL + 'message/message/' + messageId + this.auth.getToken())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    // Delete a dialog
    deleteMessage(id) {
        return this.http.delete(this.global.URL + 'message/message/' + id + this.auth.getToken())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    // Gets the latest message based on an interval
    getMessagesOnInterval(id, latestDate, interval) {
        return Observable.interval(interval)
            .flatMap(() => this.getLastMessage(id, latestDate))
            .catch((error: Response) => Observable.throw(error.json()));;
    }

    // Get all the messages of a given user
    getMessagesInGeneral(offset) {
        return this.http.get(this.global.URL + 'message/all/' + offset + '/' + this.auth.getToken())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    // Gets the last message of a messaging - Check it by the latest time, get everything new
    getLastMessage(id, latestDate) {
        return this.http.get(this.global.URL + 'message/message/' + latestDate + '/' + id + this.auth.getToken())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    // Send a message to a user - Type: chat or first
    sendMessage(message, receiver, type) {
        return this.http.post(
          this.global.URL + 'message/message/' + receiver + this.auth.getToken(),
          JSON.stringify({ message: message }), this.auth.getHeaders())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    getNumbers() {
        return this.http.get(this.global.URL + 'user/inbox/numbers' + this.auth.getToken())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }
}
