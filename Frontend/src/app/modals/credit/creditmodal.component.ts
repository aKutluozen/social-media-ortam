import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ModalService } from "../modal.service";
import { GlobalService } from "../../globals.service";
import { UserService } from '../../user/user.service';
import * as $ from 'jquery';
declare var $: any;

@Component({
    selector: 'app-creditmodal',
    templateUrl: './creditmodal.component.html'
})
export class CreditmodalComponent implements OnInit {

    constructor(private modal: ModalService, private user: UserService, public global: GlobalService) { }

    public otherUser: string;
    public creditAmount: number = 0;

    @ViewChild('modalElement') modalElement: ElementRef;

    // Close the modal
    close() {
        this.otherUser = '';
        this.creditAmount = 0;
        $(this.modalElement.nativeElement).modal('hide');
    }

    // Initialize the modal
    ngOnInit() {
        this.modal.creditModalActivated.subscribe((otherUser: string) => {
            this.otherUser = otherUser;

            this.modal.handleModalToggle(this.modalElement.nativeElement, () => {
                this.otherUser = '';
                this.creditAmount = 0;
            });
        });
    }

    sendCredit() {
        this.modal.showQuestion({
            content: 'Bu islemi gerceklestirmek istediginize emin misiniz?',
            approveFunction: () => {
                this.user.sendCreditRequest(this.otherUser, this.creditAmount, false).subscribe(
                    data => this.modal.handleWarning('Kredi hediyeniz basari ile gonderilmistir!'),
                    error => this.modal.handleError('Kredi hediyesi isteginiz gonderilirken bir sorun olustu!', error)
                );
                this.close();
            }
        })
    }

    askCredit() {
        this.modal.showQuestion({
            content: 'Bu islemi gerceklestirmek istediginize emin misiniz?',
            approveFunction: () => {
                this.user.sendCreditRequest(this.otherUser, this.creditAmount, true).subscribe(
                    data => this.modal.handleWarning('Isteginiz basari ile gonderilmistir!'),
                    error => this.modal.handleError('Kredi istegi gonderilirken bir sorun olustu!', error)
                );
                this.close();
            }
        })
    }
}
