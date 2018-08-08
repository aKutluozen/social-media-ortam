// Main modules
import { Injectable } from '@angular/core';

@Injectable()
export class GlobalService {
    public URL: string = "http://18.217.236.111:3000/";
    public URL_CHAT: string = "http://18.217.236.111:5000";
    // public URL: string = "http://localhost:3000/";
    // public URL_CHAT: string = "http://localhost:5000";

    public URL_S3_USERS: string = "https://s3.us-east-2.amazonaws.com/socialmediaimages2017/user_images/";
    public URL_S3_POSTS: string = "https://s3.us-east-2.amazonaws.com/socialmediaimages2017/post_images/";
    public URL_EMPTY_PROFILE_PIC: string = "emptyprofile.png";
    public URL_EMPTY_GALLERY_PIC: string = "uploadempty.png";

    public profilePicture: string = '';
    public username: string = '';
    public credit: number = 0;
    public banned: boolean = false;

    dataURLtoFile(dataurl, filename) {
        var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    }
}
