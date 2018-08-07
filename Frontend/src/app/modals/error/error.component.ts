import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { ModalService } from "../modal.service";
import * as $ from 'jquery';
import { AuthService } from "../../auth/auth.service";
declare var $: any;

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html'
})
export class ErrorComponent implements OnInit {

    constructor(private modal: ModalService, private auth: AuthService) { }

    public error: any;

    @ViewChild('modalElement') modalElement: ElementRef;

    // Initialize the modal
    ngOnInit() {
        this.modal.errorOccurred.subscribe((errorObj: any) => {
            this.error = errorObj
            this.modal.handleModalToggle(this.modalElement.nativeElement, () => {
                this.error = {};
            });
        });
    }

    sendErrorMessage() {
        this.auth.sendErrorMessage(this.error.error.message).subscribe(
            data => {
                this.modal.handleWarning('Hata raporu basariyla gonderildi!');
                $(this.modalElement.nativeElement).modal('hide');
            }, error => {
                this.modal.handleError('Hata raporu gonderilemedi', error);
            }
        )
    }
}