// Main modules
import { Component, OnInit } from '@angular/core';
import { NgForm } from "@angular/forms";
import { FormGroup, FormControl, Validators } from "@angular/forms";

// Services
import { ModalService } from '../modal.service';
import { InboxService } from 'app/navigation/inbox/inbox.service';
import { PostService } from 'app/posts/posts.service';
import { UserService } from 'app/user/user.service';
import { AuthService } from 'app/auth/auth.service';
import { GlobalService } from 'app/globals.service';

// Models
import { Post } from "../../posts/post.model";

@Component({
    selector: 'app-postmodal',
    templateUrl: './postmodal.component.html',
    styleUrls: ['./postmodal.component.css']
})
export class PostmodalComponent implements OnInit {

    constructor(
        private modal: ModalService,
        private messageService: InboxService,
        public postService: PostService,
        private user: UserService,
        private auth: AuthService,
        public global: GlobalService
    ) { }

    public display: string = 'none';
    public content: string = '';
    public group: string = '';
    public postForm: FormGroup;
    public imageToShow: string = '';

    private post: Post;
    private parsedLink: string = '';
    private isEditing: boolean = false;

    public imageChangedEvent: any = '';
    public croppedImage: any = '';
    public pictureMessage: string = '';

    fileChangeEvent(event: any): void {
        this.imageChangedEvent = event;
    }
    imageCropped(image: string) {
        this.croppedImage = image;
    }
    imageLoaded() {
        // show cropper
    }
    loadImageFailed() {
        // show message
    }

    close(isSavingPicture?) {
        // Delete if an image is uploaded!
        if (isSavingPicture == false) {
            this.deletePostPicture();
        }

        this.croppedImage = '';
        this.display = 'none';
        this.postForm.reset();
        this.post = null;
        this.postForm.value.content = '';
        this.imageToShow = '';
        this.pictureMessage = '';
        this.imageChangedEvent = null;
        this.group = '';
        document.getElementById('postPictureFile')['value'] = null;
        document.getElementById('postPictureFile')['value'] = '';
    }

    addPostImage() {
        var file = this.global.dataURLtoFile(this.croppedImage, 'pic.jpeg');

        this.postService.addPostPicture(
            file,
            // SUCCESS
            (response) => {
                this.pictureMessage = '';
                this.imageChangedEvent = null;
                this.croppedImage = null;
                this.imageToShow = response.data;
            },
            () => { console.log('bad') }
        );
    }

    emptyPostImage() {
		this.croppedImage = '';
		this.imageChangedEvent = null;
		this.imageToShow = '';
	}

    deletePostPicture() {
        this.postService.deletePostPicture(
            this.imageToShow,
            () => {
                this.imageToShow = '';
                if (this.post != undefined) {
                    this.post.image = '';
                }
            },
            () => {
                console.log('Many images are NOT uploaded!');
            });
    }

    // Create or update based on action
    onSubmit() {
        // Handle if link parsing if there is one
        let link = getLink(this.postForm.value.content);
        if (link) {
            this.postService.parseLink(link).subscribe(
                data => {
                    // If the response isn't empty
                    if (data.title !== '') {
                        this.parsedLink = JSON.stringify(data);
                    } else {
                        this.parsedLink = '';
                    }
                    sendPostToBackEnd.call(this);
                }
            )
        } else {
            this.parsedLink = '';
            sendPostToBackEnd.call(this);
        }

        function getHashTags(content) {
            let words = content.split(' ');
            let hashTags = new Set();

            for (let word of words) {
                // Get only the hashtagged words
                if (word.substring(0, 1) === '#') {
                    let cleanWord = word.substring(1, word.length);

                    // Clean it from non alphanumeric characters, then add it to array
                    if (cleanWord.match(/[^a-z0-9]+/i) != null) {
                        let finalWord = cleanWord.substring(0, cleanWord.match(/[^a-z0-9]+/i).index);
                        if (finalWord.length > 0) {
                            hashTags.add(finalWord);
                        }
                    } else {
                        hashTags.add(cleanWord);
                    }
                }
            }

            return Array.from(hashTags);
        }

        function getLink(content) {
            let words = content.split(' ');

            for (let word of words) {
                if (word.match(/(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})/)) {
                    return word;
                }
            }
        }

        function sendPostToBackEnd() {
            // EDIT
            if (this.post) {
                // Parse hashtags first!
                let hashTags = getHashTags(this.postForm.value.content);
                if (hashTags.length === 0) {
                    hashTags = ['genel'];
                }

                this.post.content = this.postForm.value.content;
                this.post.subject = hashTags;
                this.post.image = this.imageToShow;
                this.post.linkContent = this.parsedLink;
                this.post.group = this.group;

                if (this.post.content === '') {
                    this.modal.handleError('Lutfen butun bilgilerini doldurunuz!', '');
                    return;
                }

                this.postService.updatePost(this.post).subscribe(
                    data => {
                        // this.modal.handleWarning('Basari ile guncellendi!');
                        this.close();
                    },
                    error => {
                        this.modal.handleError('Paylasirken bir sorun oldu!', error);
                        this.close();
                    });

                try {
                    this.post.linkContent = JSON.parse(this.post.linkContent);
                } catch (e) {
                    this.post.linkContent = '';
                }

                // CREATE
            } else {
                // Parse hashtags first!
                let hashTags = getHashTags(this.postForm.value.content);
                if (hashTags.length === 0) {
                    hashTags = ['genel'];
                }
                
                // Create
                const post = new Post(
                    this.postForm.value.content,
                    null,
                    hashTags,
                    '', [], [], [], [], '', '', '',
                    this.imageToShow,
                    this.parsedLink,
                    this.group,
                    false
                );

                this.postService.addNewPost(post).subscribe(
                    data => {
                        // this.modal.handleWarning('Basari ile paylasildi!');
                        this.close();
                    },
                    error => {
                        this.modal.handleError('Paylasirken bir sorun oldu!', error);
                        this.close();
                    }
                );
            }

            this.close();
        }
    }

    // Initialize the reactive form
    ngOnInit() {
        this.modal.postModalActivated.subscribe((postObject: Object) => {
            this.display = 'block';
            if (postObject['publicity']) {
                this.group = postObject['publicity'];
            }

            if (!this.isEditing) {
                this.postForm.patchValue({
                    content: ''
                });
            }
        });

        this.postForm = new FormGroup({
            content: new FormControl({ value: '', disabled: false }, Validators.required)
        });

        // Make sure this happens in update mode
        this.postService.postIsEdit.subscribe(
            (post: Post) => {
                this.post = post;
                this.postForm.patchValue({
                    content: this.post.content
                });

                this.isEditing = true;

                // Handle if there is an image
                if (this.post.image != '' && this.post.image != undefined) {
                    this.imageToShow = this.post.image;
                }
            }
        );
    }
}
