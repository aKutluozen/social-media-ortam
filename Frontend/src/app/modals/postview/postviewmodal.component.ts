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
import { MultiLanguageService } from '../../language.service';

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
        public lang: MultiLanguageService,
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
        this.modal.showQuestion({
            content: 'Bu mesaji silmek istediginize emin misiniz?',
            approveFunction: () => {
                this.postService.deletePost(this.post).subscribe(
                    result => this.close(),
                    error => this.modal.handleError('Paylasim silinirken bir sorun olustu', error)
                );
            }
        });
    }

    // Handle deleting
    onDeleteShare() {
        this.modal.showQuestion({
            content: 'Bu paylasimi silmek istediginize emin misiniz?',
            approveFunction: () => {
                this.postService.deletePostShared(this.post).subscribe(
                    result => this.close(),
                    error => this.modal.handleError('Paylasim silinirken bir sorun olustu', error)
                );
            }
        });
    }

    viewProfile(name) {
        this.user.viewProfile(name).subscribe(
            data => this.modal.showUserModal(data.data),
            error => this.modal.handleError('Profil yuklenirken bir sorun olustu!', error)
        );
    }

    // Like the post
    likeThis() {
        if (!this.post.dislikes.includes(this.auth.getCookie('user')) && this.post.nickName != this.global.username) {
            this.postService.likePost(this.post).subscribe(data => { },
                error => this.modal.handleError('Paylasim begenilirken bir sorun olustu.', error)
            );
        }
    }

    // Dislike the post
    dislikeThis() {
        if (!this.post.likes.includes(this.auth.getCookie('user')) && this.post.nickName != this.global.username) {
            this.postService.dislikePost(this.post).subscribe(data => { },
                error => this.modal.handleError('Paylasim begenilemedi.', error)
            );
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
                this.shareComment = '';
                this.onSharing = false;
            }, error => this.modal.handleError('Paylasim paylasilirken bir sorun olustu', error)
        );
    }

    // Send an answer to post
    sendAnswer() {
        this.postService.answerPost(this.answer, this.post).subscribe(
            result => this.answer = '',
            error => this.modal.handleError('Paylasima cevap verilirken bir sorun olustu', error)
        );
    }

    // Check if the post belongs to the user logged in
    belongsToUser() {
        if (this.post)
            return this.auth.getCookie('userId') == this.post['userId'];
    }

    // Delete an answer
    deleteAnswer(id) {
        this.modal.showQuestion({
            content: 'Bu mesaji silmek istediginize emin misiniz?',
            approveFunction: () => {
                this.postService.deleteAnswer(id, this.post).subscribe(
                    result => {
                        for (let i = 0; i < this.post.comments.length; i++) {
                            if (this.post.comments[i].id === id) {
                                this.post.comments.splice(i, 1);
                            }
                        }
                    }, error => this.modal.handleError('Cevap silinirken bir sorun olustu.', error)
                );
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
