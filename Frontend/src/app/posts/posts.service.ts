// Main modules
import { Http, Response, Headers } from "@angular/http";
import { Injectable, EventEmitter } from "@angular/core";
import 'rxjs/Rx';
import { Observable } from "rxjs";
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

// Models
import { Post } from "./post.model";

// Services
import { AuthService } from 'app/auth/auth.service';
import { GlobalService } from "app/globals.service";
import { UserService } from "../user/user.service";

@Injectable()
export class PostService {

    constructor(
        private http: Http,
        private auth: AuthService,
        public global: GlobalService,
        private userService: UserService
    ) { }

    public posts: Post[] = [];

    public postIsEdit = new EventEmitter<Post>();

    addNewPost(post: Post) {
        return this.http.post(this.global.URL + 'post' + this.auth.getToken(), JSON.stringify(post), this.auth.getHeaders())
            .map((response: Response) => {
                var result = response.json();

                // Handle link parsing view
                var linkCont = '';
                if (result.linkCont != '') {
                    try {
                        linkCont = JSON.parse(result.linkContent);
                    } catch (e) {
                        linkCont = '';
                    }
                }

                // Handle image if there is one
                if (result.image != '' && result.image != undefined) {
                    result.image = result.image;
                }

                // Handle profile picture
                if (result.user.profilePicture != '' && result.user.profilePicture != undefined) {
                    result.user.profilePicture = result.user.profilePicture;
                }

                const post = new Post(
                    result.content,
                    result.user.nickName,
                    result.subject,
                    result.created,
                    [],
                    [],
                    [],
                    [],
                    result._id,
                    result.user._id,
                    result.user.profilePicture,
                    result.image,
                    linkCont,
                    result.group
                );

                this.posts.unshift(post);
            })
            .catch((error: Response) => {
                try {
                    return Observable.throw(error.json());
                } catch (e) {
                    return Observable.throw(error);
                }
            });
    }

    addPostPicture(picture: File, callbackSuccess, callbackError) {
        var ajax = new XMLHttpRequest();
        var formData = new FormData();

        formData.append('imagefile', picture);
        ajax.upload.addEventListener("progress", function () { }, false);
        ajax.addEventListener('load', function () { }, false);
        ajax.open('POST', this.global.URL + 'post/image' + this.auth.getToken(), true);
        ajax.send(formData);

        ajax.onload = function (response) {
            switch (response.srcElement['status']) {
                case 200: callbackSuccess(JSON.parse(ajax.response)); break;
                case 500: console.log('Problem updating post picture!'); break;
            }
        };

        ajax.onerror = function () {
            callbackError();
        };
    }

    deletePostPicture(picture, callbackSuccess, callbackError) {
        var ajax = new XMLHttpRequest();
        ajax.upload.addEventListener("progress", function () { }, false);
        ajax.addEventListener('load', function () { }, false);

        ajax.open('DELETE', this.global.URL + 'post/image' + this.auth.getToken(), true);
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

    // Gets all the posts by friends
    getPosts(subject?: string, amount?: number, publicity?: string, person?: string) {
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

        return this.http.get(this.global.URL + 'post/friends' + subjectString + publicityString + '/' + amount + personString + this.auth.getToken())
            .map((response: Response) => {
                let posts = response.json().data,
                    transformedPosts: Post[] = [];

                for (let post of posts) {
                    // Handle link content first
                    if (post.linkContent !== '') {
                        post.linkContent = JSON.parse(post.linkContent);
                    }

                    // If it shared, add it with a new nickName
                    if (post.shares.length > 0) {
                        for (let share of post.shares) {

                            // Handle empty profile picture
                            var profilePic = '';
                            if (post.user.profilePicture != '' && post.user.profilePicture != undefined) {
                                profilePic = post.user.profilePicture;
                                if (share.user.profilePicture != '' && share.user.profilePicture != undefined) {
                                    share.user.profilePicture = share.user.profilePicture;
                                }
                            }

                            // Handle post picture
                            var postPic = '';
                            if (post.image != '' && post.image != undefined) {
                                postPic = post.image;
                            }
                        }

                        transformedPosts.push(new Post(
                            post.content,
                            post.user.nickName,
                            post.subject,
                            post.created,
                            post.likes,
                            post.dislikes,
                            post.comments,
                            post.shares,
                            post._id,
                            post.user._id,
                            profilePic,
                            postPic,
                            post.linkContent,
                            post.group,
                            true)
                        );
                    } else {

                        // Handle empty profile picture
                        var profilePic = '';
                        if (post.user.profilePicture != '' && post.user.profilePicture != undefined) {
                            profilePic = post.user.profilePicture;
                        }

                        // Handle post picture
                        var postPic = '';
                        if (post.image != '' && post.image != undefined) {
                            postPic = post.image;
                        }

                        // Then add them normally
                        transformedPosts.push(new Post(
                            post.content,
                            post.user.nickName,
                            post.subject,
                            post.created,
                            post.likes,
                            post.dislikes,
                            post.comments,
                            post.shares,
                            post._id,
                            post.user._id,
                            profilePic,
                            postPic,
                            post.linkContent,
                            post.group)
                        );
                    }
                }
                
                return transformedPosts;
            })
            .catch((error: Response) => Observable.throw(error.json()));
    }

    getLoadedPosts() {
        console.log(this.posts);
        return this.posts;
    }

    getSubjects() {
        return this.http.get(this.global.URL + 'post/subjects')
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    parseLink(link) {
        return this.http.get('http://api.linkpreview.net/?key=5a46599c7f94e72917992eb44102af9a64cdcada695c3&q=' + link)
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error));
    }

    getOnePost(id) {
        return this.http.get(this.global.URL + 'post/post/' + id + this.auth.getToken())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error));
    }

    likePost(post) {
        let name = this.auth.getCookie('user');

        // If the user didn't like it before, add username to the liked list of the post
        if (post.likes.indexOf(name) === -1) {
            return this.http.patch(this.global.URL + 'post/like/' + post.postId + this.auth.getToken(), { name: name }, this.auth.getHeaders())
                .map((response: Response) => {
                    post.likes.unshift(name);
                    this.userService.adjustCredit(post.nickName, 1, true).subscribe(data => { }, err => console.log(err));
                    return response.json();
                })
                .catch((error: Response) => Observable.throw(error.json()));

            // If the user is already there, remove his name from the list
        } else {
            return this.http.delete(this.global.URL + 'post/like/' + post.postId + '/' + name + '/' + this.auth.getToken(), this.auth.getHeaders())
                .map((response: Response) => {
                    post.likes.splice(post.likes.indexOf(name), 1);
                    this.userService.adjustCredit(post.nickName, 1, false).subscribe(data => { }, err => console.log(err));
                    return response.json();
                })
                .catch((error: Response) => Observable.throw(error.json()));
        }
    }

    dislikePost(post) {
        let name = this.auth.getCookie('user');

        // If the user didn't do it before, add username to the liked list of the post
        if (post.dislikes.indexOf(name) === -1) {
            return this.http.patch(this.global.URL + 'post/dislike/' + post.postId + this.auth.getToken(), { name: name }, this.auth.getHeaders())
                .map((response: Response) => {
                    post.dislikes.unshift(name);
                    this.userService.adjustCredit(post.nickName, 1, false).subscribe(data => { }, err => console.log(err));
                    return response.json();
                })
                .catch((error: Response) => Observable.throw(error.json()));

            // If the user is already there, remove his name from the list
        } else {
            return this.http.delete(this.global.URL + 'post/dislike/' + post.postId + '/' + name + '/' + this.auth.getToken(), this.auth.getHeaders())
                .map((response: Response) => {
                    post.dislikes.splice(post.dislikes.indexOf(name), 1);
                    this.userService.adjustCredit(post.nickName, 1, true).subscribe(data => { }, err => console.log(err));
                    return response.json();
                })
                .catch((error: Response) => Observable.throw(error.json()));
        }
    }

    answerPost(answer, post) {
        // Create a unique post ID using date
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

        return this.http.patch(this.global.URL + 'post/answer/' + post.postId + this.auth.getToken(), JSON.stringify(comment), this.auth.getHeaders())
            .map((response: Response) => {
                // Handle temprorary username and picture !!!
                comment.user['profilePicture'] = this.global.profilePicture;
                comment.user['nickName'] = this.global.username;

                post.comments.unshift(comment);
                return response.json();
            })
            .catch((error: Response) => Observable.throw(error.json()));
    }

    deleteAnswer(id, post) {
        return this.http.delete(this.global.URL + 'post/' + post.postId + '/answer/' + id + this.auth.getToken())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    updatePost(post: Post) {
        return this.http.patch(this.global.URL + 'post/' + post.postId + this.auth.getToken(), JSON.stringify(post), this.auth.getHeaders())
            .map((response: Response) => response.json())
            .catch((error: Response) => Observable.throw(error.json()));
    }

    // Broadcast the edit post
    editPost(post: Post) {
        this.postIsEdit.emit(post);
    }

    deletePost(post: Post) {
        return this.http.delete(this.global.URL + 'post/' + post.postId + this.auth.getToken())
            .map((response: Response) => {
                this.posts.splice(this.posts.indexOf(post), 1);
                // What happens to other people who shared the post??? It must be removed from their shared lists too!
                return response.json();
            })
            .catch((error: Response) => Observable.throw(error.json()));
    }

    deletePostShared(post: Post) {
        return this.http.delete(this.global.URL + 'post/post/' + post.postId + this.auth.getToken())
            .map((response: Response) => {
                // Remove the current user from the post
                let name = this.auth.getCookie('user');

                for (let i = 0; i < post.shares.length; i++) {
                    if (name === post.shares[i].user.nickName) {
                        post.shares.splice(i, 1);
                    }
                }

                // If the user is the last one to share the post, make it look normal
                if (post.shares.length < 1) {
                    post.isShared = false;
                }

                return response.json();
            })
            .catch((error: Response) => Observable.throw(error.json()));
    }

    sharePost(comment: string, post: Post) {
        return this.http.post(this.global.URL + 'post/post/' + post.postId + this.auth.getToken(), JSON.stringify({ comment: comment }), this.auth.getHeaders())
            .map((response: Response) => {
                this.posts.splice(this.posts.indexOf(post), 1); // remove it first
                // parse the user, add it to the posts last share element, then push it back again
                var result = response.json().obj;

                var obj = {
                    date: result.date,
                    user: {
                        nickName: result.nickName,
                        profilePicture: result.profilePicture
                    },
                    comment: comment
                }

                post.isShared = true;
                post.shares.push(obj)
                this.posts.unshift(post);

                return response.json();
            })
            .catch((error: Response) => Observable.throw(error.json()));
    }
}