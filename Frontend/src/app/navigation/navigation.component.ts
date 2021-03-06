// Main Modules
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

// Services
import { AuthService } from 'app/auth/auth.service';
import { UserService } from 'app/user/user.service';
import { ModalService } from 'app/modals/modal.service';
import { GlobalService } from 'app/globals.service';
import { Subscription } from 'rxjs';
import * as $ from 'jquery';
import { MultiLanguageService } from '../language.service';

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
		public global: GlobalService,
		public lang: MultiLanguageService
	) {}

	public username: string = '';
	public searchString: string = '';
	public flagObject: any = {};
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
			data => {
				this.global.profilePicture = data.data.profilePicture;
				this.global.username = data.data.nickName;
			},
			error => console.error(error)
		);

		if (this.username) {
			this.inboxSubscription = this.user.checkInboxOnInterval(3000).subscribe(data => {
				this.flagObject = data.data.flagObject;
				this.flagObject.numbers = data.data.numbers;
				this.global.banned = data.data.userSituation.isBanned;
				this.global.credit = data.data.numbers.credit;
			}, error => {
				this.inboxSubscription.unsubscribe();
				this.modal.handleError(this.lang.text.errors.inbox, error);
			});
		}

		$(document).click(function (e) {
			if (!$(e.target).is('.navbar-collapse *') || $(e.target).is('#profileLink') || $(e.target).is('#homePageLink *')) {
				$('.collapse').removeClass('show');
			}
		});

		let chosenLang = localStorage.getItem('lang');
		if (chosenLang == 'tr') {
			this.switchLanguage('turkish');
		} else {
			this.switchLanguage('english');
		}
	}

	closeDropdown(el) {
		$(el).parent().hide();
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
		if (this.messageSubscription) this.messageSubscription.unsubscribe();
		if (this.inboxSubscription) this.inboxSubscription.unsubscribe();
		if (this.profileSubscription) this.profileSubscription.unsubscribe();
	}

	logOut() {
		this.modal.showQuestion({
			content: this.lang.text.auth.areYouSureLogout,
			approveFunction: () => {
				this.auth.logout();
			}
		});
	}
}
