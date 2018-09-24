// Main modules
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgForm } from "@angular/forms";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import * as Entities from 'html-entities';

// Services
import { ModalService } from '../modal.service';
import { InboxService } from 'app/navigation/inbox/inbox.service';
import { AdsService } from 'app/ads/ads.service';
import { UserService } from 'app/user/user.service';
import { AuthService } from 'app/auth/auth.service';
import { GlobalService } from 'app/globals.service';
import * as $ from 'jquery';
declare var $: any;

// Models
import { Ad } from "../../ads/ad.model";

@Component({
    selector: 'app-admodal',
    templateUrl: './admodal.component.html'
})
export class AdmodalComponent implements OnInit {

    constructor(
        private modal: ModalService,
        private messageService: InboxService,
        public adService: AdsService,
        private user: UserService,
        private auth: AuthService,
        public global: GlobalService
    ) { }
    
    private entities = new Entities.XmlEntities();
    public content: string = '';
    public group: string = '';
    public adForm: FormGroup;
    public imageToShow: string = '';
    public isRotating: boolean = false;
    public imageRatio: Number = 1;

    private ad: Ad;
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
            img.onload = () => this.imageRatio = img.width / img.height;
            img.src = fr.result.toString();
        };

        fr.readAsDataURL(event.target.files[0]); // I'm using a <input type="file"> for demonstrating
    }

    imageCropped(image: string) {
        this.croppedImage = image;
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
            this.deleteAdPicture();
        }

        this.croppedImage = '';
        this.adForm.reset();
        this.ad = null;
        this.adForm.value.content = '';
        this.imageToShow = '';
        this.pictureMessage = '';
        this.imageChangedEvent = null;
        this.isRotating = false;
        this.group = '';
        document.getElementById('adPictureFile')['value'] = null;
        document.getElementById('adPictureFile')['value'] = '';
        $(this.modalElement.nativeElement).modal('hide');
    }

    addAdImage() {
        var file = this.global.dataURLtoFile(this.croppedImage, 'pic.jpeg');

        this.adService.addAdPicture(
            file,
            // SUCCESS
            response => {
                this.pictureMessage = '';
                this.imageChangedEvent = null;
                this.croppedImage = null;
                this.isRotating = false;
                this.imageToShow = response.data;
            },
            err => this.modal.handleError('Resim eklenirken bir sorun olustu', err)
        );
    }

    emptyAdImage() {
        this.croppedImage = '';
        this.imageChangedEvent = null;
        this.imageToShow = '';
        this.isRotating = false;
    }

    deleteAdPicture() {
        this.adService.deleteAdPicture(
            this.imageToShow,
            () => {
                this.imageToShow = '';
                if (this.ad != undefined) {
                    this.ad.picture = '';
                }
            },
            err => this.modal.handleError('Gonderi resmi silinirken bir sorun olustu', err)
        );
    }

    // Create or update based on action
    onSubmit() {
        // Handle if link parsing if there is one
        let link = getLink(this.adForm.value.content);
        if (link) {
            this.adService.parseLink(link).subscribe(
                data => {
                    // If the response isn't empty
                    if (data.title !== '') {
                        this.parsedLink = JSON.stringify(data);
                    } else {
                        this.parsedLink = '';
                    }
                    sendAdToBackEnd.call(this);
                },
                err => this.modal.handleError('Linkte bir sorun olustu!', err)
            );
        } else {
            this.parsedLink = '';
            sendAdToBackEnd.call(this);
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

        function sendAdToBackEnd() {
            // EDIT
            if (this.ad) {
                // Parse hashtags first!
                let hashTags = getHashTags(this.adForm.value.content);
                if (hashTags.length === 0) {
                    hashTags = ['genel'];
                }

                this.ad.content = this.adForm.value.content;
                this.ad.subject = hashTags;
                this.ad.image = this.imageToShow;
                this.ad.linkContent = this.parsedLink;
                this.ad.group = this.group;

                if (this.ad.content === '') {
                    this.modal.handleError('Lutfen butun bilgilerini doldurunuz!', '');
                    return;
                }

                this.adService.updateAd(this.ad).subscribe(
                    data => this.close(),
                    error => {
                        this.modal.handleError('Paylasirken bir sorun oldu!', error);
                        this.close();
                    });
                try {
                    this.ad.linkContent = this.entities.decode(this.ad.linkContent);
                    // this.ad.linkContent = this.ad.linkContent.replace(/&quot;/g, '\"');
                    this.ad.linkContent = JSON.parse(this.ad.linkContent);
                } catch (e) {
                    this.ad.linkContent = '';
                }

                // CREATE
            } else {
                // Parse hashtags first!
                let hashTags = getHashTags(this.adForm.value.content);
                if (hashTags.length === 0) {
                    hashTags = ['genel'];
                }

                // Create
                const ad = new Ad(
                    this.adForm.value.content,
                    null,
                    hashTags,
                    '', [], [], [], [], '', '', '',
                    this.imageToShow,
                    this.parsedLink,
                    this.group,
                    false
                );

                this.adService.addNewAd(ad).subscribe(
                    data => this.close(),
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
        this.modal.adModalActivated.subscribe((adObject: Object) => {
            if (adObject['publicity']) {
                this.group = adObject['publicity'];
            }

            if (!this.isEditing) {
                this.adForm.patchValue({
                    content: ''
                });
            }

            this.modal.handleModalToggle(this.modalElement.nativeElement, () => { this.close(); })
        });

        this.adForm = new FormGroup({
            content: new FormControl({ value: '', disabled: false }, Validators.required)
        });

        // Make sure this happens in update mode
        this.adService.adIsEdit.subscribe(
            (ad: Ad) => {
                this.ad = ad;
                this.adForm.patchValue({
                    content: this.ad.content
                });

                this.isEditing = true;

                // Handle if there is an image
                if (this.ad.image != '' && this.ad.image != undefined) {
                    this.imageToShow = this.ad.image;
                }
            }
        );
    }
}
