import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ModalService } from "../modal.service";
import { UserService } from '../../user/user.service';
import * as $ from 'jquery';
import { MultiLanguageService } from '../../language.service';
declare var $: any;

@Component({
    selector: 'app-complaintmodal',
    templateUrl: './complaintmodal.component.html'
})
export class ComplaintmodalComponent implements OnInit {

    constructor(private modal: ModalService, private user: UserService, public lang: MultiLanguageService) { }

    public complaint: object;
    public days: number = 0;

    @ViewChild('modalElement') modalElement: ElementRef;

    // Close the modal
    close() {
        this.complaint = {};
        $(this.modalElement.nativeElement).modal('hide');
    }

    // Initialize the modal
    ngOnInit() {
        this.modal.complaintModalActivated.subscribe((complaint: object) => {
            this.complaint = complaint;

            this.modal.handleModalToggle(this.modalElement.nativeElement, () => {
                this.complaint = {};
            });
        });
    }

    blockFromChat(person) {
        this.user.blockFromChat(person, this.days)
            .subscribe(
                (res) => {
                    if (res.message == 'success') {
                        this.modal.handleWarning('Kullanici basari ile yasaklandi.');
                        this.close();
                    } else {
                        this.modal.handleError('Yasaklarken sorun olustu', res);
                    }
                },
                (err) => this.modal.handleError('Yasaklarken sorun olustu', err)
            );
    }
}
