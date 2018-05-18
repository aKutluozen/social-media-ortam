import { Component, OnInit } from '@angular/core';
import { ModalService } from "../modal.service";

@Component({
    selector: 'app-warning',
    templateUrl: './warning.component.html',
    styleUrls: ['./warning.component.css']
})
export class WarningComponent implements OnInit {

    constructor(private modal: ModalService) { }

    public warning: string;
    public display = 'none';

    // Close the modal
    close() {
        this.display = 'none';
        this.warning = '';
    }

    // Initialize the modal
    ngOnInit() {
        this.modal.warningOccurred.subscribe((warning: string) => {
            this.warning = warning;
            this.display = 'block';
        });
    }
}
