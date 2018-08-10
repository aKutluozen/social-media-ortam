// Main modules
import { Injectable, EventEmitter, Output } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { Router } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import 'rxjs/Rx';
import { Observable, Subject } from 'rxjs';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { HttpClient } from '@angular/common/http';

// Models
import { User } from './user.model';

// Services
import { ModalService } from 'app/modals/modal.service';
import { AuthService } from 'app/auth/auth.service';
import { GlobalService } from 'app/globals.service';

@Injectable()
export class UserService {

    constructor(
        private http: Http,
        private auth: AuthService,
        private modal: ModalService,
        private router: Router,
        public global: GlobalService
    ) { }

    private friends: object[] = [];

    private _friendDeleteEvent = new BehaviorSubject<string>('test 123');
    public $friendEvent = this._friendDeleteEvent.asObservable();

    // Delete a friend bi-directionally
    deleteFriend(name) {
        return this.http.delete(this.global.URL + 'user/user/unfriend/' + name + this.auth.getToken(), this.auth.getHeaders())
            .map((response: Response) => {
                this._friendDeleteEvent.next(name);
                return response.json();
            })
            .catch((error: Response) => Observable.throw(error.json()));
    }

    // Get the friends request and messages list
    getFriendsList() {
        return this.http.get(this.global.URL + 'user/user' + this.auth.getToken())
            .map((response: Response) => {
                for (let user of response.json().data.following) {
                    if (user.accepted === true) {
                        this.friends.push(user);
                    }
                }
                return response.json().data.following;
            })
            .catch((error: Response) => Observable.throw(error.json()));
    }

    isFriend(nickName) {
        return this.http.get(this.global.URL + 'user/user/friend/' + nickName + this.auth.getToken())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error));
    }

    // Gets all the loaded friends
    getLoadedFriends() {
        return this.friends;
    }

    // Get the profile
    getProfile() {
        return this.http.get(this.global.URL + 'user/user' + this.auth.getToken())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    // View a profile
    viewProfile(name) {
        return this.http.get(this.global.URL + 'user/user/requests/' + name + this.auth.getToken())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    // Get all the users as the search result
    getUsers(searchTerm) {
        return this.http.get(this.global.URL + 'user/user/all/' + searchTerm + this.auth.getToken())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    // Save the changes in the profile
    updateProfile(user: User) {
        return this.http.patch(this.global.URL + 'user/user' + this.auth.getToken(), JSON.stringify(user), this.auth.getHeaders())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    updateCoverImage(picture: File, callbackSuccess, callbackError) {
        var ajax = new XMLHttpRequest();
        var formData = new FormData();

        formData.append('imagefile', picture);
        ajax.upload.addEventListener("progress", function () { }, false);
        ajax.addEventListener('load', function () { }, false);
        ajax.open('POST', this.global.URL + 'user/user/coverImage' + this.auth.getToken(), true);
        ajax.send(formData);

        ajax.onload = function (response) {
            switch (response.srcElement['status']) {
                case 200: callbackSuccess(JSON.parse(ajax.response)); break;
                case 500: console.log('Problem updating cover picture!'); break;
            }
        };

        ajax.onerror = function () {
            callbackError();
        };
    }

    deleteCoverImage(callbackSuccess, callbackError) {
        var ajax = new XMLHttpRequest();
        var formData = new FormData();

        ajax.upload.addEventListener("progress", function () { }, false);
        ajax.addEventListener('load', function () { }, false);
        ajax.open('DELETE', this.global.URL + 'user/user/coverImage' + this.auth.getToken(), true);
        ajax.send();

        ajax.onload = function (response) {
            switch (response.srcElement['status']) {
                case 200: callbackSuccess(JSON.parse(ajax.response)); break;
                case 404: console.log('cover image to delete was not found!'); break;
            }
        };

        ajax.onerror = function () {
            callbackError();
        };
    }

    updateProfilePicture(picture: File, callbackSuccess, callbackError) {
        var ajax = new XMLHttpRequest();
        var formData = new FormData();

        formData.append('imagefile', picture);
        ajax.upload.addEventListener("progress", function () { }, false);
        ajax.addEventListener('load', function () { }, false);
        ajax.open('POST', this.global.URL + 'user/user/profilePicture' + this.auth.getToken(), true);
        ajax.send(formData);

        ajax.onload = function (response) {
            switch (response.srcElement['status']) {
                case 200: callbackSuccess(JSON.parse(ajax.response)); break;
                case 500: console.log('Problem updating profile picture!'); break;
            }
        };

        ajax.onerror = function () {
            callbackError();
        };
    }

    deleteProfilePicture(callbackSuccess, callbackError) {
        var ajax = new XMLHttpRequest();
        var formData = new FormData();

        ajax.upload.addEventListener("progress", function () { }, false);
        ajax.addEventListener('load', function () { }, false);
        ajax.open('DELETE', this.global.URL + 'user/user/profilePicture' + this.auth.getToken(), true);
        ajax.send();

        ajax.onload = function (response) {
            switch (response.srcElement['status']) {
                case 200: callbackSuccess(JSON.parse(ajax.response)); break;
                case 404: console.log('image to delete was not found!'); break;
            }
        };

        ajax.onerror = function () {
            callbackError();
        };
    }

    deleteGalleryPicture(picture, callbackSuccess, callbackError) {
        var ajax = new XMLHttpRequest();
        ajax.upload.addEventListener("progress", function () { }, false);
        ajax.addEventListener('load', function () { }, false);

        ajax.open('DELETE', this.global.URL + 'user/user/images' + this.auth.getToken(), true);
        ajax.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        ajax.send(JSON.stringify({ pictureToDelete: picture }));

        ajax.onload = function (response) {
            switch (response.srcElement['status']) {
                case 200: callbackSuccess(JSON.parse(ajax.response)); break;
                case 404: console.log('image to delete was not found!'); break;
            }
        };

        ajax.onerror = function () {
            callbackError();
        };
    }

    updateGalleryPictures(pictures: File[], callbackSuccess, callbackError) {
        var ajax = new XMLHttpRequest();
        var formData = new FormData();

        // Make a list of images to be added
        for (let i = 0; i < pictures.length; i++) {
            if (pictures[i].size < 1000000) {
                formData.append('imagefile' + i, pictures[i]);
            }
        }

        ajax.upload.addEventListener("progress", function () { }, false);
        ajax.addEventListener('load', function () { }, false);
        ajax.open('POST', this.global.URL + 'user/user/images' + this.auth.getToken(), true);
        ajax.send(formData);

        ajax.onload = function (response) {
            callbackSuccess(JSON.parse(ajax.response));
        };

        ajax.onerror = function () {
            callbackError();
        };
    }

    blockFromChat(person, days) {
        return this.http.post(this.global.URL + 'user/user/ban/' + person + '/' + days + this.auth.getToken(), this.auth.getHeaders())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    resetPassword(oldPass, newPass) {
        return this.http.post(this.global.URL + 'user/password' + this.auth.getToken(), JSON.stringify({ oldPassword: oldPass, newPassword: newPass }), this.auth.getHeaders())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    getComplaints() {
        return this.http.get(this.global.URL + 'user/user/complaints' + this.auth.getToken())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    // Send a follow request
    sendFollowRequest(id) {
        return this.http.post(this.global.URL + 'user/user/follow/' + id + this.auth.getToken(), this.auth.getHeaders())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    // Get all the messages and requests
    getFriendRequests(offset) {
        return this.http.get(this.global.URL + 'user/user/requests/all/' + offset + this.auth.getToken())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    removeNotification(id, type, user) {
        return this.http.delete(this.global.URL + 'user/user/notifications/' + id + '/' + type + '/' + user + this.auth.getToken(), this.auth.getHeaders())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    getNotifications(offset) {
        return this.http.get(this.global.URL + 'user/user/notifications/' + offset + this.auth.getToken())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    // Accept a friend request and add to the list
    addToFollowing(id) {
        return this.http.patch(this.global.URL + 'user/user/follow/' + id + this.auth.getToken(), this.auth.getHeaders())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    // Reject a request and remove it from the list
    rejectFollowing(name) {
        return this.http.delete(this.global.URL + 'user/user/follow/' + name + this.auth.getToken(), this.auth.getHeaders())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    // Check th inbox periodically
    checkInboxOnInterval(interval) {
        return Observable.interval(interval).flatMap(() => this.checkInbox());
    }

    // Check inbox
    checkInbox() {
        return this.http.get(this.global.URL + 'user/user/inbox' + this.auth.getToken())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    // Mark a message read
    markInbox(id) {
        return this.http.post(this.global.URL + 'user/user/inbox/' + id + this.auth.getToken(), this.auth.getHeaders())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    // isAdding can be true of false
    adjustCredit(nickName, amount, isAdding) {
        return this.http.patch(this.global.URL + 'user/user/credit/' + nickName + '/' + isAdding + '/' + amount + this.auth.getToken(), this.auth.getHeaders())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }
}