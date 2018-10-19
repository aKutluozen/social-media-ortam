import { Component, OnInit } from '@angular/core';
import { GlobalService } from '../globals.service';
import { AuthService } from '../auth/auth.service';
import { ModalService } from '../modals/modal.service';
import { NgForm, FormGroup, FormControl, Validators } from "@angular/forms";
import { MultiLanguageService } from '../language.service';

@Component({
    selector: 'app-admin',
    templateUrl: './admin.component.html'
})
export class AdminComponent implements OnInit {
    constructor(
        private global: GlobalService, 
        private auth: AuthService, 
        private modal: ModalService, 
        public lang: MultiLanguageService
    ) { }

    public complaints: object[] = [];
    public messageForm: FormGroup;

    ngOnInit() {
        this.messageForm = new FormGroup({
            messageType: new FormControl({ value: 'suggestion', disabled: false }, Validators.required),
            message: new FormControl({ value: null, disabled: false }, Validators.required)
        });
    }

    sendMessage() {
        this.auth.sendAdminMessage(this.messageForm.value.message, this.messageForm.value.messageType, this.global.username).subscribe(
            data => { 
                this.modal.handleWarning(this.lang.text.success.messageSent); 
                this.messageForm.reset(); 
            },
            error => this.modal.handleError(this.lang.text.errors.sendingMessage, error)
        );
    }
}