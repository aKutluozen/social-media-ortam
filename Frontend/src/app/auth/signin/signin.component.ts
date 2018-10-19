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
import { MultiLanguageService } from "../../language.service";

@Component({
    selector: 'app-signin',
    templateUrl: './signin.component.html'
})
export class SigninComponent implements OnInit, OnDestroy {

    constructor(
        private auth: AuthService,
        private router: Router,
        private modal: ModalService,
        public global: GlobalService,
        public lang: MultiLanguageService
    ) { }

    public signinForm: FormGroup;
    public resetForm: FormGroup;
    public isResetting: boolean = false;
    private subscription: Subscription;
    private timeoutLogin: any = 0;

    // Sign in, save the token and other unique information
    onSubmit() {
        const user = new User(this.signinForm.value.email, this.signinForm.value.password);
        this.subscription = this.auth.signin(new User(this.signinForm.value.email, this.signinForm.value.password)).subscribe(
            data => {
                this.auth.setCookie('token', data.data.token, 1);
                this.auth.setCookie('userId', data.data.userId, 1);
                this.auth.setCookie('user', data.data.name, 1);
                this.auth.setCookie('chatNickName', data.data.chatNickName, 1);
                this.auth.changeMessage(data.data.name);

                this.global.profilePicture = data.data.picture;
                this.global.username = data.data.name;
                this.global.credit = data.data.credit;

                this.modal.handleWarning(this.lang.text.success.welcome + ' ' + this.auth.getCookie('user') + '!'); // Show this only when first logged in

                this.timeoutLogin = window.setTimeout(function () {

                    window.location.reload(true);
                    window.location.href = './';
                    // navigator['app'].loadUrl('file:///android_asset/www/index.html');
                    window.clearTimeout(this.timeoutLogin);
                }, 500);

            },
            error => this.modal.handleError(this.lang.text.errors.login, error)
        );
        this.signinForm.reset();
    }

    forgot() {
        this.isResetting = !this.isResetting;
    }

    // Initialize the reactive form, redirect to profile if already logged in
    ngOnInit() {
        this.signinForm = new FormGroup({
            email: new FormControl(null, [
                Validators.required,
                Validators.pattern("^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$")
            ]),
            password: new FormControl(null, Validators.required)
        });
        this.resetForm = new FormGroup({
            email: new FormControl(null, [
                Validators.required,
                Validators.pattern("^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$")
            ]),
            resetCode: new FormControl(null, Validators.required),
            newPassword: new FormControl(null, [Validators.required, Validators.pattern('(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&].{8,}')])
        });
        if (this.auth.isLoggedIn()) {
            this.router.navigateByUrl('/auth/signin');
        } else {
            this.router.navigateByUrl('/posts/all');
        }
    }

    sendForgotRequest() {
        this.auth.sendResetRequest(this.resetForm.value.email).subscribe(
            data => this.modal.handleWarning(this.lang.text.success.sentCodeToEmail),
            error => this.modal.handleError(this.lang.text.errors.unexplanied, error)
        );
    }

    refreshPassword() {
        this.auth.refreshPassword(this.resetForm.value.email, this.resetForm.value.resetCode, this.resetForm.value.newPassword).subscribe(
            data => {
                this.modal.handleWarning(this.lang.text.success.passwordReset);
                this.isResetting = false;
            },
            error => this.modal.handleError(this.lang.text.errors.wrongCode, error)
        );
    }

    ngOnDestroy() {
        if (this.subscription) this.subscription.unsubscribe();
    }
}