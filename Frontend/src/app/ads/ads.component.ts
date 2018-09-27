import { Component, OnInit } from '@angular/core';
import { GlobalService } from '../globals.service';
import { AuthService } from '../auth/auth.service';
import { ModalService } from '../modals/modal.service';
import { NgForm, FormGroup, FormControl, Validators } from "@angular/forms";

@Component({
    selector: 'app-ads',
    templateUrl: './ads.component.html'
})
export class AdsComponent implements OnInit {
    constructor(private global: GlobalService, private auth: AuthService, private modal: ModalService) { }

    ngOnInit() {

    }

    openAdWindow() {
        this.modal.showNewAdModal();
    }
}