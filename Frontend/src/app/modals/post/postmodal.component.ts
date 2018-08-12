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
    selector: 'app-postmodal',
    templateUrl: './postmodal.component.html'
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

    public content: string = '';
    public group: string = '';
    public postForm: FormGroup;
    public imageToShow: string = '';
    public isCropping: boolean = false;
    public isRotating: boolean = false;
    public imageRatio: Number = 1;

    private post: Post;
    private parsedLink: string = '';
    private isEditing: boolean = false;
    private degree: number = 0;

    public imageChangedEvent: any = '';
    public cropperSize: any = { x1: 0, y1: 0, x2: '100%', y2: '100%' };
    public croppedImage: any = '';
    public pictureMessage: string = '';

    @ViewChild('modalElement') modalElement: ElementRef;

    fileChangeEvent(event: any): void {
        this.imageChangedEvent = event;

        // Get the original image dimension for cropping purposes
        var fr = new FileReader;

        fr.onload = () => {
            var img = new Image;

            img.onload = () => {
                this.imageRatio = img.width / img.height;
            };

            img.src = fr.result;
        };

        fr.readAsDataURL(event.target.files[0]); // I'm using a <input type="file"> for demonstrating
    }

    imageCropped(image: string) {
        this.croppedImage = image;

        // Check vertical proportion here, if too big, stop it.
        var i = new Image();
        i.onload = () => {
            if (i.height > 960) {
                this.modal.handleError('Resim cok uzun! Yukselik ve genislik orani 3/1\'i gecemez.', {});
                // Reset the cropper
                this.cropperSize.x2 = 320;
            }
        };

        i.src = this.croppedImage;

        if (!this.isCropping) {
            $('.cropper').hide();
        }
    }

    rotateImage() {
        this.isRotating = true;

        $('#i1').attr('src', this.croppedImage);

        var canvas = $('#rotateCanvas')[0];
        var img = new Image();
        img.src = this.croppedImage;

        this.degree += 90;
        this.degree %= 360;

        if (this.degree == 0 || this.degree == 180) {
            canvas.width = img.width;
            canvas.height = img.height;
            this.imageRatio = img.height / img.width;
        } else {
            canvas.width = img.height;
            canvas.height = img.width;
            this.imageRatio = img.width / img.height;
        }

        var context = canvas.getContext("2d");

        if (this.degree == 0 || this.degree == 180) {
            context.translate(img.width / 2, img.height / 2);
        } else {
            context.translate(img.height / 2, img.width / 2);
        }
        context.rotate(this.degree * Math.PI / 180);
        context.drawImage(img, -(img.width / 2), - (img.height / 2));
        context.restore();
        var rotatedImageSrc = canvas.toDataURL();
        this.croppedImage = rotatedImageSrc;
        $('#i1').attr('src', rotatedImageSrc);
        if (!this.isCropping) this.cropperSize = { x1: 0, y1: 0, x2: '100%', y2: '100%' }
    }

    imageLoaded() {
        // show cropper
    }

    loadImageFailed() {
        // show message
    }

    close(isSavingPicture?) {
        // Delete if an image is uploaded!
        if (isSavingPicture == false && !this.isEditing && this.imageToShow) {
            this.deletePostPicture();
        }

        this.croppedImage = '';
        this.postForm.reset();
        this.post = null;
        this.postForm.value.content = '';
        this.imageToShow = '';
        this.isCropping = false;
        this.pictureMessage = '';
        this.imageChangedEvent = null;
        this.isRotating = false;
        this.group = '';
        document.getElementById('postPictureFile')['value'] = null;
        document.getElementById('postPictureFile')['value'] = '';
        $(this.modalElement.nativeElement).modal('hide');
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
                this.isCropping = false;
                this.isRotating = false;
                this.imageToShow = response.data;
            },
            () => { console.log('bad') }
        );
    }

    emptyPostImage() {
        this.croppedImage = '';
        this.imageChangedEvent = null;
        this.imageToShow = '';
        this.isCropping = false;
        this.isRotating = false;
    }

    deletePostPicture() {
        this.postService.deletePostPicture(
            this.imageToShow,
            () => {
                this.imageToShow = '';
                if (this.post != undefined) {
                    this.post.image = '';
                }
                console.log('Deleted!');
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
                            hashTags.add(finalWord.toLowerCase());
                        }
                    } else {
                        hashTags.add(cleanWord.toLowerCase());
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
            if (postObject['publicity']) {
                this.group = postObject['publicity'];
            }

            if (!this.isEditing) {
                this.postForm.patchValue({
                    content: ''
                });
            }

            this.modal.handleModalToggle(this.modalElement.nativeElement, () => { })
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
