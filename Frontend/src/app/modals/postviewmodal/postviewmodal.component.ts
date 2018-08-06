// Main modules
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgForm } from "@angular/forms";
import { FormGroup, FormControl, Validators } from "@angular/forms";

// Services
import { ModalService } from '../modal.service';
import { InboxService } from 'app/navigation/inbox/inbox.service';
import { PostService } from 'app/posts/posts.service';
import { UserService } from 'app/user/user.service';
import { AuthService } from 'app/auth/auth.service';
import { GlobalService } from 'app/globals.service';
import * as $ from 'jquery';
declare var $: any;

// Models
import { Post } from "../../posts/post.model";

@Component({
    selector: 'app-postviewmodal',
    templateUrl: './postviewmodal.component.html',
    styleUrls: ['./postviewmodal.component.css']
})
export class PostviewmodalComponent implements OnInit {

    constructor(
        private modal: ModalService,
        private messageService: InboxService,
        public postService: PostService,
        private user: UserService,
        private auth: AuthService,
        public global: GlobalService
    ) { }

    public content: string = '';
    public onComment: boolean = false;
    public answer: String = '';
    public shareComment: string = '';
    public onSharing: boolean = false;

    public post: Post;
    private parsedLink: string = '';

    @ViewChild('modalElement') modalElement: ElementRef;

    // Close it
    close() {
        this.post = null;
        this.onComment = false;
        this.onSharing = false;
        this.shareComment = '';
        $(this.modalElement.nativeElement).modal('hide');
    }

    // Initialize the reactive form
    ngOnInit() {
        this.modal.postModalViewActivated.subscribe((postObject: Object) => {
            this.post = postObject as Post;

            this.modal.handleModalToggle(this.modalElement.nativeElement, () => {
                this.close();
            });
        });
    }

    // Enable editing
    onEdit() {
        this.postService.editPost(this.post);
        this.modal.showPostModal({ type: 'edit', publicity: this.post.group });
        this.close();
    }

    // Handle deleting
    onDelete() {
        // this.display = 'none';
        var self = this;
        this.modal.showQuestion({
            content: 'Bu mesaji silmek istediginize emin misiniz?',
            itemToBeDeleted: this.post,
            itemCollection: this.postService.posts,
            helperService: this.postService,
            approveFunction: function (post, collection, service) {
                service.deletePost(post).subscribe(
                    result => {
                        // self.modal.handleWarning('Paylasim basari ile silindi!');
                        self.close();
                    },
                    error => {
                        self.modal.handleError('Paylasim silinirken bir sorun olustu', error);
                    }
                );
            }
        });
    }

    // Handle deleting
    onDeleteShare() {
        // this.display = 'none';
        var self = this;
        this.modal.showQuestion({
            content: 'Bu paylasimi silmek istediginize emin misiniz?',
            itemToBeDeleted: this.post,
            itemCollection: this.postService.posts,
            helperService: this.postService,
            approveFunction: function (post, collection, service) {
                service.deletePostShared(post).subscribe(
                    result => {
                        // self.modal.handleWarning('Paylasim basari ile silindi!');
                        self.close();
                    },
                    error => {
                        self.modal.handleError('Paylasim silinirken bir sorun olustu', error);
                    }
                );
            }
        });
    }

    viewProfile(name) {
        this.user.viewProfile(name).subscribe(
            data => {
                this.modal.showUserModal(data.data);
            }, error => {
                this.modal.handleError('Profil yuklenirken bir sorun olustu!', error);
            });
    }

    // Like the post
    likeThis() {
        var user = this.auth.getCookie('user');

        if (!this.post.dislikes.includes(user) && this.post.nickName != this.global.username) {
            this.postService.likePost(this.post).subscribe(data => {
            },
                error => {
                    this.modal.handleError('Paylasim begenilirken bir sorun olustu.', error);
                });
        }
    }

    // Dislike the post
    dislikeThis() {
        var user = this.auth.getCookie('user');

        if (!this.post.likes.includes(user) && this.post.nickName != this.global.username) {
            this.postService.dislikePost(this.post).subscribe(data => {
            },
                error => {
                    this.modal.handleError('Paylasim begenilemedi.', error);
                });
        }
    }

    // Toggle commenting
    commentThis() {
        this.onComment = !this.onComment;
        this.onSharing = false;
    }

    onShare() {
        this.onSharing = !this.onSharing;
        this.onComment = false;
    }

    // Sharing
    shareThis() {
        // First, say something about the share - Open a form modal
        this.postService.sharePost(this.shareComment, this.post).subscribe(
            result => {
                // this.modal.handleWarning('Basari ile paylasildi!');
                this.shareComment = '';
                this.onSharing = false;
            }, error => {
                console.log(error);
                this.modal.handleError('Paylasim paylasilirken bir sorun olustu', error);
            });
    }

    // Send an answer to post
    sendAnswer() {
        this.postService.answerPost(this.answer, this.post).subscribe(
            result => {
                this.answer = '';
                // this.modal.handleWarning('Cevap basari ile gonderildi!');
            }, error => {
                this.modal.handleError('Paylasima cevap verilirken bir sorun olustu', error);
            });
    }

    // Check if the post belongs to the user logged in
    belongsToUser() {
        if (this.post)
            return this.auth.getCookie('userId') == this.post['userId'];
    }

    // Delete an answer
    deleteAnswer(id) {
        var self = this;
        this.modal.showQuestion({
            content: 'Bu mesaji silmek istediginize emin misiniz?',
            itemToBeDeleted: this.post,
            itemCollection: this.post.comments,
            helperService: this.postService,
            approveFunction: function (post, collection, service) {
                service.deleteAnswer(id, post).subscribe(
                    result => {
                        for (let i = 0; i < post.comments.length; i++) {
                            if (post.comments[i].id === id) {
                                post.comments.splice(i, 1);
                            }
                        }
                        // self.modal.handleWarning('Cevap basari ile silindi!');
                    }, error => {
                        self.modal.handleError('Cevap silinirken bir sorun olustu.', error);
                    });
            }
        });
    }

    answerWithEnter(event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            this.sendAnswer();
        }
    }

    // Check if the user is logged in
    isLoggedIn() {
        if (this.post)
            return this.auth.isLoggedIn();
    }

    // Check if the answer belongs to the user logged in
    answerBelongsToUser(belongs) {
        if (this.post)
            return this.auth.getCookie('user') == belongs;
    }

    // Check if a share belongs to a user
    shareBelongsToUser() {
        if (this.post) {
            for (let share of this.post.shares) {
                if (share.user.nickName === this.auth.getCookie('user')) {
                    return true;
                }
            }
            return false;
        }
    }
}
