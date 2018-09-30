// Main modules
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { NgForm } from "@angular/forms";
import { FormGroup, FormControl, Validators } from "@angular/forms";

// Services
import { ModalService } from '../modal.service';
import { UserService } from 'app/user/user.service';
import { AuthService } from 'app/auth/auth.service';
import { GlobalService } from 'app/globals.service';
import * as $ from 'jquery';
declare var $: any;

// Models
import { Ad } from "../../ads/ad.model";
import { AdsService } from '../../ads/ads.service';

@Component({
    selector: 'app-adviewmodal',
    templateUrl: './adviewmodal.component.html'
})
export class AdviewmodalComponent implements OnInit {

    constructor(
        private modal: ModalService,
        private user: UserService,
        private adsService: AdsService,
        private auth: AuthService,
        public global: GlobalService
    ) { }

    public content: string = '';
    public ad: Ad;

    @ViewChild('modalElement') modalElement: ElementRef;

    // Close it
    close() {
        this.ad = null;
        $(this.modalElement.nativeElement).modal('hide');
    }

    // Initialize the reactive form
    ngOnInit() {
        this.modal.adModalViewActivated.subscribe((adObject: Object) => {
            this.ad = adObject as Ad;

            this.modal.handleModalToggle(this.modalElement.nativeElement, () => {
                this.close();
            });
        });
    }

    // Enable editing
    onEdit() {
        this.adsService.editAd(this.ad);
        this.modal.showNewAdModal();
        this.close();
    }

    // Handle deleting
    onDelete() {
        this.modal.showQuestion({
            content: 'Bu mesaji silmek istediginize emin misiniz?',
            approveFunction: () => {
                this.adsService.deleteAd(this.ad).subscribe(
                    result => this.close(),
                    error => this.modal.handleError('Paylasim silinirken bir sorun olustu', error)
                );
            }
        });
    }

    // Check if the ad belongs to the user logged in
    belongsToUser() {
        if (this.ad)
            return this.auth.getCookie('user') == this.ad['nickName'];
    }

    // Check if the user is logged in
    isLoggedIn() {
        if (this.ad)
            return this.auth.isLoggedIn();
    }
}
