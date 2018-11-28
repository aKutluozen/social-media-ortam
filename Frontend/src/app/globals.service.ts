// Main modules
import { Injectable } from '@angular/core';

@Injectable()
export class GlobalService {
    public URL: string = "https://kutatku.com:3000/";
    public URL_CHAT: string = "https://kutatku.com:5000";
    // public URL: string = "http://localhost:3000/";
    // public URL_CHAT: string = "http://localhost:5000";

    public URL_S3_USERS: string = "https://s3.us-east-2.amazonaws.com/kutatku/user_images/";
    public URL_S3_POSTS: string = "https://s3.us-east-2.amazonaws.com/kutatku/post_images/";
    public URL_S3_ADS: string = "https://s3.us-east-2.amazonaws.com/kutatku/classified_images/";
    public URL_S3_VISUALS: string = "https://s3.us-east-2.amazonaws.com/kutatku/visuals/";
    public URL_EMPTY_PROFILE_PIC: string = "emptyprofile.png";
    public URL_EMPTY_GALLERY_PIC: string = "uploadempty.png";

    public profilePicture: string = this.URL_EMPTY_PROFILE_PIC;
    public username: string = '';
    public credit: number = 0;
    public banned: boolean = false;
    public languageSelected: string = '';

    dataURLtoFile(dataurl, filename) {
        var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    }

    decodeHTML(html) {
        var txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    parseLanguageJSON(langArr, langNum) {
        let obj = {};

        for (let row of langArr) {
            if (!obj[row[0]]) {
                obj[row[0]] = {}
            }
            obj[row[0]][row[1]] = row[langNum + 1];
        }

        return obj;
    }
}
