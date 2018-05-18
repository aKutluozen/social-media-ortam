import { Component, OnInit } from '@angular/core';
import { GlobalService } from '../globals.service';
import { UserService } from '../user/user.service';
import { ModalService } from '../modals/modal.service';

@Component({
    selector: 'app-admin',
    templateUrl: './admin.component.html',
    styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
    constructor(private global: GlobalService, private user: UserService, private modal: ModalService) { }

    public admin: string = 'here';
    public complaints: object[] = [];

    ngOnInit() {
        this.load();
    }

    // Handle complaints here too, not in the notifications window!

    // Also, try and get their ban situation.
    load() {
        this.user
            .getComplaints()
            .subscribe(
                data => {this.complaints = data.complaints; console.log(data);},
                error => {
                    this.modal.handleError(
                        "Sikayetler goruntulenirken bir sorun olustu",
                        error
                    );
                }
            );
    }
}