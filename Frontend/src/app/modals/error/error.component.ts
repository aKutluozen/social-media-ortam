import { Component, OnInit } from "@angular/core";
import { ModalService } from "../modal.service";

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html',
    styleUrls: ['./error.component.css']
})
export class ErrorComponent implements OnInit {

    constructor(private modal: ModalService) { }

    public error: string = '';
    public display: string = 'none';

    // Close the modal
    close() {
        this.display = 'none';
    }

    // Initialize the modal
    ngOnInit() {
        this.modal.errorOccurred.subscribe((error: string) => {
            this.error = error;
            this.display = 'block';
        });
    }
}