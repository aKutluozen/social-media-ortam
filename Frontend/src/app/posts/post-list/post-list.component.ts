import { Component, OnInit, OnDestroy } from "@angular/core";

import { Post } from "../post.model";
import { PostService } from "../posts.service";
import { ModalService } from "app/modals/modal.service";
import { AuthService } from "app/auth/auth.service";
import { Subscription } from "rxjs";

@Component({
    selector: 'app-post-list',
    templateUrl: './post-list.component.html',
    styleUrls: ['./post-list.component.css']
})
export class PostListComponent implements OnInit, OnDestroy {

    constructor(
        public postService: PostService,
        private modal: ModalService,
        private auth: AuthService
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
                this.modal.handleError('Paylasimlari goruntulerken bir sorun olustu', error);
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
            this.modal.handleError('Konulari goruntulerken bir sorun olustu', error);
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
            this.modal.handleError('Konulari goruntulerken bir sorun olustu', error);
        });
    }

    openPostWindow() {
        this.modal.showPostModal({ publicity: 'public' });
    }
}