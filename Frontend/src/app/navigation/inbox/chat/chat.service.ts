import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import * as io from 'socket.io-client';

import { GlobalService } from 'app/globals.service';
import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { AuthService } from 'app/auth/auth.service';

@Injectable()

export class ChatService {

    constructor(
        public global: GlobalService,
        private http: Http,
        private auth: AuthService
    ) { }

    private socket;
    private room;
    private oldRoom;

    sendMessage(message) {
        this.socket.emit('add-message', message);
    }

    selectRoom(room) {
        this.oldRoom = this.room;
        this.room = room;
        this.socket.emit('room', this.room);
        return this.http.post(this.global.URL + 'chat/room' + this.auth.getToken(), JSON.stringify({ room: this.room, oldRoom: this.oldRoom }), this.auth.getHeaders())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    getRooms() {
        return this.http.get(this.global.URL + 'chat/rooms' + this.auth.getToken(), this.auth.getHeaders())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    getNumbers() {
        return this.http.get(this.global.URL + 'chat/room' + this.auth.getToken(), this.auth.getHeaders())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    sendComplaint(complaint) {
        return this.http.post(this.global.URL + 'user/user/complaint' + this.auth.getToken(), JSON.stringify({ complaint: complaint }), this.auth.getHeaders())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    getMessages() {
        let observable = new Observable(observer => {
            this.socket = io(this.global.URL_CHAT);
            this.socket.on('message', (data) => {
                observer.next(data);
            });
            return () => {
                this.socket.disconnect();
            };
        })
        return observable;
    }
}