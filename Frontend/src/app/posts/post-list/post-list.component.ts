import { Component, OnInit, OnDestroy } from "@angular/core";

import { Post } from "../post.model";
import { PostService } from "../posts.service";
import { ModalService } from "app/modals/modal.service";
import { AuthService } from "app/auth/auth.service";
import { Subscription } from "rxjs";
import { MultiLanguageService } from "../../language.service";
import { GlobalService } from "../../globals.service";

@Component({
    selector: 'app-post-list',
    templateUrl: './post-list.component.html'
})
export class PostListComponent implements OnInit, OnDestroy {

    constructor(
        public postService: PostService,
        private modal: ModalService,
        public auth: AuthService,
        public lang: MultiLanguageService,
        public global: GlobalService
    ) { }

    public postAmount: number = 0;
    public subject: string = '';
    private postSubscription: Subscription;
    private postSubscriptionWithInterval: Subscription = null;
    private postSubscriptionSubjects: Subscription = null;

    private postLoadInterval: any = {};

    // Initialize posts, get all of them
    ngOnInit() {
        this.subject = '';
        this.postAmount = 0;
        this.loadPosts();
        this.postLoadInterval = window.setInterval(() => {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
                this.loadMore();
            }
        }, 1000);
    }

    loadPosts() {
        this.postSubscription = this.postService.getPosts('', 0).subscribe(
            (posts: Post[]) => {
                this.postService.posts = posts.slice();
            }, error => {
                this.postSubscription.unsubscribe();
                this.modal.handleError(this.lang.text.errors.showingPosts, error);
            });
    }

    ngOnDestroy() {
        window.clearInterval(this.postLoadInterval);
        if (this.postSubscription) this.postSubscription.unsubscribe();
        if (this.postSubscriptionSubjects) this.postSubscriptionSubjects.unsubscribe();
        if (this.postSubscriptionWithInterval) this.postSubscriptionWithInterval.unsubscribe();

    }

    // Get posts by subject
    filterBySubject(subject) {
        this.subject = subject;
        this.postAmount = 0;
        this.postSubscriptionSubjects = this.postService.getPosts(subject, this.postAmount).subscribe((posts: Post[]) => {
            this.postService.posts = posts.slice();
        }, error => {
            this.postSubscriptionSubjects.unsubscribe();
            this.modal.handleError(this.lang.text.errors.subjects, error);
        });
    }

    loadMore() {
        this.postAmount += 5;
        this.postSubscriptionWithInterval = this.postService.getPosts(this.subject, this.postAmount).subscribe((morePosts: Post[]) => {
            if (morePosts.length > 0) {
                this.postService.posts = this.postService.posts.concat(morePosts);
            } else {
                window.clearInterval(this.postLoadInterval);
            }
        }, error => {
            this.postSubscriptionWithInterval.unsubscribe();
            window.clearInterval(this.postLoadInterval);
            this.modal.handleError(this.lang.text.errors.subjects, error);
        });
    }

    openPostWindow() {
        this.modal.showPostModal({ publicity: 'public' });
    }
}