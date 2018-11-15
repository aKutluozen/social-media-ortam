// Main modules
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgForm } from "@angular/forms";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import * as Entities from 'html-entities';

// Services
import { ModalService } from '../modal.service';
import { AdsService } from 'app/ads/ads.service';
import { GlobalService } from 'app/globals.service';
import * as $ from 'jquery';
declare var $: any;

// Models
import { Ad } from "../../ads/ad.model";
import { MultiLanguageService } from '../../language.service';

@Component({
    selector: 'app-admodal',
    templateUrl: './admodal.component.html'
})
export class AdmodalComponent implements OnInit {

    constructor(
        private modal: ModalService,
        public adService: AdsService,
        public global: GlobalService,
        public lang: MultiLanguageService
    ) { }

    private entities = new Entities.XmlEntities();
    public content: string = '';
    public group: string = '';
    public adForm: FormGroup;
    public imageToShow: string = '';
    public isRotating: boolean = false;
    public imageRatio: Number = 1;

    private ad: Ad;
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
            err => this.modal.handleError(this.lang.text.errors.pictureUpload, err)
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
            err => this.modal.handleError(this.lang.text.errors.pictureDelete, err)
        );
    }

    // Create or update based on action
    onSubmit() {
        // EDIT
        if (this.ad) {
            this.ad.content = this.adForm.value.content;
            this.ad.picture = this.imageToShow;

            if (this.ad.content === '') {
                this.modal.handleError(this.lang.text.errors.fillOutAll, '');
                return;
            }

            this.adService.updateAd(this.ad).subscribe(
                data => this.close(),
                error => {
                    this.modal.handleError(this.lang.text.errors.sharingAd, error);
                    this.close();
                });

            // CREATE
        } else {
            const ad = new Ad(
                '',
                this.adForm.value.title,
                this.adForm.value.content,
                this.imageToShow,
                this.adForm.value.category,
                new Date().toString(),
                ''
            );

            this.adService.addNewAd(ad).subscribe(
                data => this.close(),
                error => {
                    this.modal.handleError(this.lang.text.errors.sharingAd, error);
                    this.close();
                }
            );
        }

        this.close();
    }

    getLink() {
        alert('Link: ' + this.global.URL + 'ad/' + this.ad.adId);
        var link = this.global.URL + 'ad/' + this.ad.adId;
    }

    // Initialize the reactive form
    ngOnInit() {
        this.modal.adNewModalActivated.subscribe((adObject: Object) => {

            if (!this.isEditing) {
                this.adForm.patchValue({
                    content: '',
                    category: '',
                    title: '',
                });
            }

            this.modal.handleModalToggle(this.modalElement.nativeElement, () => { this.close(); })
        });

        this.adForm = new FormGroup({
            content: new FormControl({ value: '', disabled: false }, Validators.required),
            title: new FormControl({ value: '', disabled: false }, Validators.required),
            category: new FormControl({ value: '', disabled: false }, Validators.required),
        });

        // Make sure this happens in update mode
        this.adService.adIsEdit.subscribe(
            (ad: Ad) => {
                this.ad = ad;
                this.adForm.patchValue({
                    content: this.ad.content,
                    title: this.ad.title,
                    category: this.ad.category
                });

                this.isEditing = true;

                // Handle if there is an image
                if (this.ad.picture != '' && this.ad.picture != undefined) {
                    this.imageToShow = this.ad.picture;
                }
            }
        );
    }
}
