// Main modules
import { Http, Response, Headers } from "@angular/http";
import { Injectable, EventEmitter } from "@angular/core";
import 'rxjs/Rx';
import { Observable } from "rxjs";

// Models
import { Ad } from "./ad.model";

// Services
import { AuthService } from 'app/auth/auth.service';
import { GlobalService } from "app/globals.service";
import { UserService } from "../user/user.service";

@Injectable()
export class AdsService {

    constructor(
        private http: Http,
        private auth: AuthService,
        public global: GlobalService,
        private userService: UserService
    ) { }

    public ads: Ad[] = [];
    public adIsEdit = new EventEmitter<Ad>();

    addNewAd(ad: Ad) {
        return this.http.post(this.global.URL + 'ad' + this.auth.getToken(), JSON.stringify(ad), this.auth.getHeaders())
            .map((response: Response) => {
                console.log(response);
                var result = response.json().data;

                // Handle image if there is one
                if (result.picture != '' && result.picture != undefined) {
                    result.picture = result.picture;
                }

                // Handle profile picture
                if (result.user.profilePicture != '' && result.user.profilePicture != undefined) {
                    result.user.profilePicture = result.user.profilePicture;
                }

                const ad = new Ad(
                    '',
                    result.title,
                    result.content,
                    result.picture,
                    result.category,
                    result.created,
                    result.user.id
                );

                this.ads.unshift(ad);
            })
            .catch((error: Response) => {
                try {
                    return Observable.throw(error.json());
                } catch (e) {
                    return Observable.throw(error);
                }
            });
    }

    addAdPicture(picture: File, callbackSuccess, callbackError) {
        var ajax = new XMLHttpRequest();
        var formData = new FormData();

        formData.append('imagefile', picture);
        ajax.upload.addEventListener("progress", function () { }, false);
        ajax.addEventListener('load', function () { }, false);
        ajax.open('POST', this.global.URL + 'ad/image' + this.auth.getToken(), true);
        ajax.send(formData);

        ajax.onload = function (response) {
            switch (response.srcElement['status']) {
                case 200: callbackSuccess(JSON.parse(ajax.response)); break;
                case 500: console.error('Problem updating ad picture!'); break;
            }
        };

        ajax.onerror = function () {
            callbackError();
        };
    }

    deleteAdPicture(picture, callbackSuccess, callbackError) {
        var ajax = new XMLHttpRequest();
        ajax.upload.addEventListener("progress", function () { }, false);
        ajax.addEventListener('load', function () { }, false);

        ajax.open('DELETE', this.global.URL + 'ad/image' + this.auth.getToken(), true);
        ajax.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        ajax.send(JSON.stringify({ pictureToDelete: picture }));

        ajax.onload = function (response) {
            switch (response.srcElement['status']) {
                case 200: callbackSuccess(JSON.parse(ajax.response)); break;
                case 404: console.error('image to delete was not found!'); break;
            }
        };

        ajax.onerror = function () {
            callbackError();
        };
    }

    // Gets all the ads by friends
    getAds(subject?: string, amount?: number, publicity?: string, person?: string) {
        // Check if there is a subject filter
        let subjectString = '',
            publicityString = '',
            personString = '';

        if (subject) {
            subjectString = '/' + subject;
        }

        if (publicity) {
            publicityString = '/' + publicity;
        }

        if (person) {
            personString = '/' + person;
        }

        return this.http.get(this.global.URL + 'ad/friends' + subjectString + publicityString + '/' + amount + personString + this.auth.getToken())
            .map((response: Response) => {
                let ads = response.json().data,
                    transformedAds: Ad[] = [];

                for (let ad of ads) {
                    // Handle link content first
                    if (ad.linkContent !== '') {
                        ad.linkContent = this.global.decodeHTML(ad.linkContent);
                        ad.linkContent = JSON.parse(ad.linkContent);
                    }

                    // If it shared, add it with a new nickName
                    if (ad.shares.length > 0) {
                        for (let share of ad.shares) {

                            // Handle empty profile picture
                            var profilePic = '';
                            if (ad.user.profilePicture != '' && ad.user.profilePicture != undefined) {
                                profilePic = ad.user.profilePicture;
                                if (share.user.profilePicture != '' && share.user.profilePicture != undefined) {
                                    share.user.profilePicture = share.user.profilePicture;
                                }
                            }

                            // Handle ad picture
                            var adPic = '';
                            if (ad.image != '' && ad.image != undefined) {
                                adPic = ad.image;
                            }
                        }

                        transformedAds.push(new Ad(
                            '',
                            ad.title,
                            ad.content,
                            ad.image,
                            ad.category,
                            ad.created,
                            ad.user.id)
                        );
                    } else {

                        // Handle empty profile picture
                        var profilePic = '';
                        if (ad.user.profilePicture != '' && ad.user.profilePicture != undefined) {
                            profilePic = ad.user.profilePicture;
                        }

                        // Handle ad picture
                        var adPic = '';
                        if (ad.image != '' && ad.image != undefined) {
                            adPic = ad.image;
                        }

                        // Then add them normally
                        transformedAds.push(new Ad(
                            '',
                            ad.title,
                            ad.content,
                            ad.image,
                            ad.category,
                            ad.created,
                            ad.user.id)
                        );
                    }
                }
                
                return transformedAds;
            })
            .catch((error: Response) => { console.log(error); return Observable.throw(error.json())});
    }

    getLoadedAds() {
        return this.ads;
    }

    getSubjects() {
        return this.http.get(this.global.URL + 'ad/subjects')
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    parseLink(link) {
        return this.http.get('http://api.linkpreview.net/?key=5a46599c7f94e72917992eb44102af9a64cdcada695c3&q=' + link)
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error));
    }

    getOneAd(id) {
        return this.http.get(this.global.URL + 'ad/ad/' + id + this.auth.getToken())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error));
    }

    likeAd(ad) {
        let name = this.auth.getCookie('user');

        // If the user didn't like it before, add username to the liked list of the ad
        if (ad.likes.indexOf(name) === -1) {
            return this.http.patch(this.global.URL + 'ad/like/' + ad.adId + this.auth.getToken(), { name: name }, this.auth.getHeaders())
                .map((response: Response) => {
                    ad.likes.unshift(name);
                    this.userService.adjustCredit(ad.nickName, 1, true).subscribe(data => { }, err => console.error(err));
                    return response.json();
                })
                .catch((error: Response) => Observable.throw(error.json()));
            // If the user is already there, remove his name from the list
        } else {
            return this.http.delete(this.global.URL + 'ad/like/' + ad.adId + '/' + name + '/' + this.auth.getToken(), this.auth.getHeaders())
                .map((response: Response) => {
                    ad.likes.splice(ad.likes.indexOf(name), 1);
                    this.userService.adjustCredit(ad.nickName, 1, false).subscribe(data => { }, err => console.error(err));
                    return response.json();
                })
                .catch((error: Response) => Observable.throw(error.json()));
        }
    }

    dislikeAd(ad) {
        let name = this.auth.getCookie('user');

        // If the user didn't do it before, add username to the liked list of the ad
        if (ad.dislikes.indexOf(name) === -1) {
            return this.http.patch(this.global.URL + 'ad/dislike/' + ad.adId + this.auth.getToken(), { name: name }, this.auth.getHeaders())
                .map((response: Response) => {
                    ad.dislikes.unshift(name);
                    return response.json();
                })
                .catch((error: Response) => Observable.throw(error.json()));

            // If the user is already there, remove his name from the list
        } else {
            return this.http.delete(this.global.URL + 'ad/dislike/' + ad.adId + '/' + name + '/' + this.auth.getToken(), this.auth.getHeaders())
                .map((response: Response) => {
                    ad.dislikes.splice(ad.dislikes.indexOf(name), 1);
                    return response.json();
                })
                .catch((error: Response) => Observable.throw(error.json()));
        }
    }

    answerAd(answer, ad) {
        // Create a unique ad ID using date
        let d = new Date();
        let str = this.auth.getCookie('user') + d.getTime();
        const id = str.replace(/\s/g, '');

        // Create a comment object
        var comment = {
            id: id,
            answer: answer,
            // nickName: this.auth.getCookie('user'),
            user: {},
            date: new Date()
        }

        return this.http.patch(this.global.URL + 'ad/answer/' + ad.adId + this.auth.getToken(), JSON.stringify(comment), this.auth.getHeaders())
            .map((response: Response) => {
                // Handle temprorary username and picture !!!
                comment.user['profilePicture'] = this.global.profilePicture;
                comment.user['nickName'] = this.global.username;

                ad.comments.unshift(comment);
                return response.json();
            })
            .catch((error: Response) => Observable.throw(error.json()));
    }

    deleteAnswer(id, ad) {
        return this.http.delete(this.global.URL + 'ad/' + ad.adId + '/answer/' + id + this.auth.getToken())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    updateAd(ad: Ad) {
        return this.http.patch(this.global.URL + 'ad/' + ad.adId + this.auth.getToken(), JSON.stringify(ad), this.auth.getHeaders())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    // Broadcast the edit ad
    editAd(ad: Ad) {
        this.adIsEdit.emit(ad);
    }

    deleteAd(ad: Ad) {
        return this.http.delete(this.global.URL + 'ad/' + ad.adId + this.auth.getToken())
            .map((response: Response) => {
                this.ads.splice(this.ads.indexOf(ad), 1);
                // What happens to other people who shared the ad??? It must be removed from their shared lists too!
                return response.json();
            })
            .catch((error: Response) => Observable.throw(error.json()));
    }
}