import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ModalService } from "../modal.service";
import { GlobalService } from "../../globals.service";
import { UserService } from '../../user/user.service';
import * as $ from 'jquery';
import { MultiLanguageService } from '../../language.service';
declare var $: any;

@Component({
    selector: 'app-creditmodal',
    templateUrl: './creditmodal.component.html'
})
export class CreditmodalComponent implements OnInit {

    constructor(private modal: ModalService, private user: UserService, public global: GlobalService, public lang: MultiLanguageService) { }

    public otherUser: any;
    public creditAmount: number = 0;

    @ViewChild('modalElement') modalElement: ElementRef;

    // Close the modal
    close() {
        this.otherUser = {};
        this.creditAmount = 0;
        $(this.modalElement.nativeElement).modal('hide');
    }

    // Initialize the modal
    ngOnInit() {
        this.modal.creditModalActivated.subscribe((otherUser: any) => {
            this.otherUser = otherUser;

            this.modal.handleModalToggle(this.modalElement.nativeElement, () => {
                this.otherUser = {};
                this.creditAmount = 0;
            });
        });
    }

    sendCredit() {
        this.modal.showQuestion({
            content: '<b><big>' + this.creditAmount + '</big></b> kredi gondermek istiyorsunuz. <br>Gonderdikten sonra <b><big>' + (this.global.credit - this.creditAmount) + '</big></b> krediniz kalacaktir. <br> Bu islemi gerceklestirmek istediginize emin misiniz?',
            approveFunction: () => {
                this.user.sendCreditRequest(this.otherUser, this.creditAmount, false).subscribe(
                    data => this.modal.handleWarning('Kredi hediyeniz basari ile gonderilmistir! <br> Kalan kredi: <b><big>' + (this.global.credit - this.creditAmount) + '</big></b>'),
                    error => this.modal.handleError(this.lang.text.errors.creditGiftSending, error),
                    () => this.close()
                );
            }
        })
    }

    askCredit() {
        this.modal.showQuestion({
            content: this.otherUser.nickName + ' isimli kullanicidan <b><big>' + this.creditAmount + '</big></b> kredi istiyorsunuz. <br> Isteginiz kabul edildikten sonra <b><big>' + (this.global.credit + this.creditAmount) + '</big></b> krediniz olacaktir. <br> Bu islemi gerceklestirmek istediginize emin misiniz?',
            approveFunction: () => {
                this.user.sendCreditRequest(this.otherUser, this.creditAmount, true).subscribe(
                    data => this.modal.handleWarning(this.otherUser + ' isimli kullaniciya <b><big>' + this.creditAmount + '</big></b> kredi isteginiz basari ile gonderilmistir!'),
                    error => this.modal.handleError(this.lang.text.errors.creditRequestSending, error),
                    () => this.close()
                );
            }
        })
    }
}
