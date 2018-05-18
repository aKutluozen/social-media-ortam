// Main modules
import { Component, OnInit, OnDestroy } from "@angular/core";
import { FormGroup, FormControl, Validators } from "@angular/forms";
import { Router } from "@angular/router";

// Services
import { AuthService } from "../auth.service";

// Models
import { User } from "app/user/user.model";
import { ModalService } from "app/modals/modal.service";
import { Subscription } from "rxjs";

@Component({
    selector: 'app-signup',
    templateUrl: './signup.component.html',
    styleUrls: ['../auth.component.css']
})
export class SignupComponent implements OnInit, OnDestroy {

    constructor(
        private auth: AuthService,
        private router: Router,
        private modal: ModalService
    ) { }

    public signupForm: FormGroup;
    private subscription: Subscription;

    // Sign up, create a new user and send it
    onSubmit() {
        const user = new User(
            this.signupForm.value.email,
            this.signupForm.value.password,
            this.signupForm.value.nickName
        );

        this.subscription = this.auth.signup(user).subscribe(
            data => {
                this.modal.handleWarning('Kayit oldugunuz icin tesekkurler! Artik siteye giris yapabilirsiniz.');
                this.router.navigateByUrl('/auth/signin');
            },
            error => {
                this.modal.handleError('Kayit olurken bir problem olustu!', error);
            }
        );
        this.signupForm.reset();
    }

    // Initialize the reactive form, redirect to profile if already logged in
    ngOnInit() {
        if (this.auth.isLoggedIn()) {
            this.router.navigate(['/auth', 'profile']);
        }

        this.signupForm = new FormGroup({
            nickName: new FormControl(null, Validators.required),
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