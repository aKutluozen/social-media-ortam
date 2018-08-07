import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ModalService } from "../modal.service";
import * as $ from 'jquery';
declare var $: any;

@Component({
    selector: 'app-warning',
    templateUrl: './warning.component.html'
})
export class WarningComponent implements OnInit {

    constructor(private modal: ModalService) { }

    public warning: string = '';

    @ViewChild('modalElement') modalElement: ElementRef;

    // Initialize the modal
    ngOnInit() {
        this.modal.warningOccurred.subscribe((warning: string) => {
            this.warning = warning;
            this.modal.handleModalToggle(this.modalElement.nativeElement, () => {
                this.warning = '';
            });
        });
    }
}
