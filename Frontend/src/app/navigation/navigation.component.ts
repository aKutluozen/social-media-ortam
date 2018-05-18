// Main Modules
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

// Services
import { AuthService } from 'app/auth/auth.service';
import { UserService } from 'app/user/user.service';
import { ModalService } from 'app/modals/modal.service';
import { GlobalService } from 'app/globals.service';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-navigation',
	templateUrl: './navigation.component.html',
	styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit, OnDestroy {

	constructor(
		private router: Router,
		private auth: AuthService,
		private user: UserService,
		private modal: ModalService,
		public global: GlobalService
	) { }

	public username: string = '';
	public searchString: string = '';
	public isNew: boolean = false;
	private messageSubscription: Subscription;
	private inboxSubscription: Subscription;
	private profileSubscription: Subscription;

	// Show the username if there is one
	ngOnInit() {
		this.messageSubscription = this.auth.currentMessage.subscribe(message => {
			this.username = message;
		});

		this.username = this.auth.getCookie('user') || '';

		this.profileSubscription = this.user.getProfile().subscribe(
			(data) => {
				this.global.profilePicture = data.data.profilePicture;
				this.global.name = data.data.nickName;
			},
			(error) => {
				console.log(error);
			}
		);

		if (this.username) {
			this.inboxSubscription = this.user.checkInboxOnInterval(5000).subscribe(data => {
				this.isNew = data.message;
				this.global.banned = data.userSituation.isBanned;
			}, error => {
				this.modal.handleError('Mesajlar ve istekler kontrol edilirken bir sorun olustu', error);
			});
		}
	}

	ngOnDestroy() {
		if (this.messageSubscription) this.messageSubscription.unsubscribe();
		if (this.inboxSubscription) this.inboxSubscription.unsubscribe();
		if (this.profileSubscription) this.profileSubscription.unsubscribe();
	}

	logOut() {
		this.modal.showQuestion({
			content: 'Cikis yapmak istediginize emin misiniz?',
			approveFunction: () => {
				this.auth.logout();
			}
		});
	}
}
