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
            content: this.lang.text.credit.sendSentenceIntro + this.creditAmount + this.lang.text.credit.sendSentenceMiddle + (this.global.credit - this.creditAmount) + this.lang.text.credit.sendSentenceEnd,
            approveFunction: () => {
                this.user.sendCreditRequest(this.otherUser, this.creditAmount, false).subscribe(
                    data => this.modal.handleWarning(this.lang.text.credit.sendSuccessSentenceIntro + (this.global.credit - this.creditAmount) + this.lang.text.credit.sendSuccessSentenceEnd),
                    error => this.modal.handleError(this.lang.text.errors.creditGiftSending, error),
                    () => this.close()
                );
            }
        })
    }

    askCredit() {
        this.modal.showQuestion({
            content: this.otherUser.nickName + this.lang.text.credit.askSentenceIntro + this.creditAmount + this.lang.text.credit.askSentenceMiddle + (this.global.credit + this.creditAmount) + this.lang.text.credit.askSentenceEnd,
            approveFunction: () => {
                this.user.sendCreditRequest(this.otherUser, this.creditAmount, true).subscribe(
                    data => this.modal.handleWarning(this.otherUser + this.lang.text.credit.askSuccessSentenceIntro + this.creditAmount + this.lang.text.credit.askSuccessSentenceEnd),
                    error => this.modal.handleError(this.lang.text.errors.creditRequestSending, error),
                    () => this.close()
                );
            }
        })
    }
}
