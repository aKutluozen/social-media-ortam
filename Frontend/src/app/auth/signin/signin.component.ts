// Main modules
import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { Router } from "@angular/router";

// Models
import { User } from "app/user/user.model";

// Services
import { AuthService } from "../auth.service";
import { ModalService } from "app/modals/modal.service";
import { GlobalService } from "app/globals.service";
import { Subscription } from "rxjs";

@Component({
    selector: 'app-signin',
    templateUrl: './signin.component.html',
    styleUrls: ['../auth.component.css']
})
export class SigninComponent implements OnInit, OnDestroy {

    constructor(
        private auth: AuthService,
        private router: Router,
        private modal: ModalService,
        public global: GlobalService
    ) { }

    public signinForm: FormGroup;
    private subscription: Subscription;

    // Sign in, save the token and other unique information
    onSubmit() {
        const user = new User(this.signinForm.value.email, this.signinForm.value.password);
        this.subscription = this.auth.signin(new User(this.signinForm.value.email, this.signinForm.value.password)).subscribe(
            data => {
                this.auth.setCookie('token', data.token, 7);
                this.auth.setCookie('userId', data.userId, 7);
                this.auth.setCookie('user', data.name, 7);
                this.auth.changeMessage(data.name);
                
                this.global.profilePicture = data.picture;
                this.global.name = data.name;
                
                this.modal.handleWarning('Hosgeldin ' + this.auth.getCookie('user') + '! Simdi ana sayfaya yonlendiriliyorsunuz!'); // Show this only when first logged in

                window.setTimeout(function() {
                    window.location.href = '/posts/all'; // Reset data
                }, 1000);
                
            },
            error => {
                this.modal.handleError('Giris yapilamadi, lutfen bilgilerinizi kontrol ediniz!', error);
            }
        );
        this.signinForm.reset();
    }

    // Initialize the reactive form, redirect to profile if already logged in
    ngOnInit() {
        if (this.auth.isLoggedIn()) {
            this.router.navigate(['/auth', 'profile']);
        }
        this.signinForm = new FormGroup({
            email: new FormControl(null, [
                Validators.required,
                Validators.pattern("[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?")
            ]),
            password: new FormControl(null, Validators.required)
        });
    }

    ngOnDestroy() {
        if (this.subscription) this.subscription.unsubscribe();
    }
}