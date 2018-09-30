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
                var result = response.json().data;

                // Handle image if there is one
                if (result.picture != '' && result.picture != undefined) {
                    result.picture = result.picture;
                }

                const ad = new Ad(
                    result._id,
                    result.title,
                    result.content,
                    result.picture,
                    result.category,
                    result.created,
                    result.user.nickName
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
            console.log('hereee', response);
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
    getAds(amount?: number, category?: string) {
        // Check if there is a subject filter

        return this.http.get(this.global.URL + 'ad/' + amount + '/' + category + this.auth.getToken())
            .map((response: Response) => {
                let ads = response.json().data,
                    transformedAds: Ad[] = [];

                for (let ad of ads) {
                    // Then add them normally
                    transformedAds.push(new Ad(
                        ad._id,
                        ad.title,
                        ad.content,
                        ad.picture,
                        ad.category,
                        ad.created,
                        ad.user.nickName)
                    );
                }

                return transformedAds;
            })
            .catch((error: Response) => { console.log(error); return Observable.throw(error.json()) });
    }

    getLoadedAds() {
        return this.ads;
    }

    getOneAd(id) {
        return this.http.get(this.global.URL + 'ad/ad/' + id + this.auth.getToken())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error));
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