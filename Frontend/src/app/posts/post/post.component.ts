// Main Modules
import { Component, Input, OnInit, OnDestroy } from "@angular/core";

// Models
import { Post } from "../post.model";

// Services
import { PostService } from "../posts.service";
import { ModalService } from "app/modals/modal.service";
import { UserService } from "app/user/user.service";
import { AuthService } from "app/auth/auth.service";
import { GlobalService } from "app/globals.service";
import { Subscription } from "rxjs";

@Component({
    selector: 'app-post',
    templateUrl: './post.component.html'
})
export class PostComponent implements OnInit, OnDestroy {
    @Input() post: Post;
    @Input() mylocation: String;
    @Input() inView: String;

    public inProfile: boolean = false;
    public inViewPass: boolean = false;
    private subscription: Subscription;

    constructor(
        public postService: PostService,
        private modal: ModalService,
        private user: UserService,
        private auth: AuthService,
        public global: GlobalService
    ) { }

    ngOnInit() {
        if (this.mylocation == 'profile') {
            this.inProfile = true;
        } else {
            this.inProfile = false;
        }

        if (this.inView == 'inView') {
            this.inViewPass = true;
        } else {
            this.inViewPass = false;
        }
    }

    ngOnDestroy() {
        if (this.subscription) this.subscription.unsubscribe();
    }

    view() {
        if (this.inViewPass) {
            this.post['inView'] = true;
        }
        this.modal.showPostViewModal(this.post);
    }

    viewProfile(name) {
        this.subscription = this.user.viewProfile(name).subscribe(
            data => this.modal.showUserModal(data.data), 
            error => this.modal.handleError('Profil yuklenirken bir sorun olustu!', error)
        );
    }

    // Check if the post belongs to the user logged in
    belongsToUser() {
        return this.auth.getCookie('userId') == this.post.userId;
    }

    // Check if the user is logged in
    isLoggedIn() {
        return this.auth.isLoggedIn();
    }

    // Check if the answer belongs to the user logged in
    answerBelongsToUser(belongs) {
        return this.auth.getCookie('user') == belongs;
    }

    // Check if a share belongs to a user
    shareBelongsToUser() {
        for (let share of this.post.shares) {
            if (share.user.nickName === this.auth.getCookie('user')) {
                return true;
            }
        }
        return false;
    }
}