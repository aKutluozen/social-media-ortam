import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { ModalService } from "../modal.service";
import * as $ from 'jquery';
declare var $: any;

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html'
})
export class ErrorComponent implements OnInit {

    constructor(private modal: ModalService) { }

    public error: string = '';

    @ViewChild('modalElement') modalElement: ElementRef;

    // Initialize the modal
    ngOnInit() {
        this.modal.errorOccurred.subscribe((error: string) => {
            this.error = error;

            this.modal.handleModalToggle(this.modalElement.nativeElement, () => {
                this.error = '';
            });
        });
    }
}