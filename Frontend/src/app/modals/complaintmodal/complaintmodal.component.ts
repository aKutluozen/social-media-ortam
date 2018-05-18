import { Component, OnInit } from '@angular/core';
import { ModalService } from "../modal.service";
import { UserService } from '../../user/user.service';

@Component({
    selector: 'app-complaintmodal',
    templateUrl: './complaintmodal.component.html',
    styleUrls: ['./complaintmodal.component.css']
})
export class ComplaintmodalComponent implements OnInit {

    constructor(private modal: ModalService, private user: UserService) { }

    public complaint: object;
    public display = 'none';
    public days: number = 0;

    // Close the modal
    close() {
        this.display = 'none';
        this.complaint = {};
    }

    // Initialize the modal
    ngOnInit() {
        this.modal.complaintModalActivated.subscribe((complaint: object) => {
            this.complaint = complaint;
            this.display = 'block';
        });
    }

    blockFromChat(person) {
        this.user.blockFromChat(person, this.days)
            .subscribe(
                (res) => {
                    if (res.message == 'success') {
                        this.modal.handleWarning('Kullanici basari ile yasaklandi.');
                        this.display = 'none';
                    } else {
                        this.modal.handleError('Yasaklarken sorun olustu', res);
                    }
                },
                (err) => console.log(err)
            );
    }
}
