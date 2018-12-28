import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { Subscription } from "rxjs";
import { UserService } from "../../user/user.service";
import { ModalService } from "../../modals/modal.service";
import { GlobalService } from "../../globals.service";
import { AuthService } from "../../auth/auth.service";
import { MultiLanguageService } from '../../language.service';

@Component({
    selector: 'app-newpeople',
    templateUrl: './newpeople.component.html'
})
export class NewpeopleComponent implements OnInit, OnDestroy {
    @Input() postListRef;

    constructor(
        private user: UserService,
        private modal: ModalService,
        public global: GlobalService,
        private auth: AuthService,
        public lang: MultiLanguageService
    ) { }

    public people: object[] = [];
    private subscription: Subscription;
    private userSubscription: Subscription;

    ngOnInit() {
        this.subscription = this.user.getNewUsers().subscribe(
            data => {
                let currentId = this.auth.getCookie('userId');
                for (let user of data.data) {
                    if (user._id != currentId) {
                        if (!user.profilePicture) {
                            user.profilePicture = 'emptyprofile.png';
                        }
                        this.people.push(user);
                    }
                }
            },
            error => this.modal.handleError(this.lang.text.errors.findingUsers, error)
        )
    }

    viewProfile(name) {
        this.userSubscription = this.user.viewProfile(name).subscribe(
            data => this.modal.showUserModal(data.data),
            error => this.modal.handleError(this.lang.text.errors.user, error)
        );
    }
    
    switchLanguage(language) {
        if (language == 'english') {
            this.lang.text = this.lang.text_EN;
            localStorage.setItem('lang', 'en');
        } else {
            this.lang.text = this.lang.text_TR;
            localStorage.setItem('lang', 'tr');
        }
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        if (this.userSubscription) this.userSubscription.unsubscribe();
    }
}