// Main modules
import { Component, OnInit, OnDestroy, Input, ViewChild, ElementRef } from '@angular/core';

// Services
import { AuthService } from 'app/auth/auth.service';
import { ModalService } from 'app/modals/modal.service';
import { UserService } from 'app/user/user.service';
import { GlobalService } from 'app/globals.service';
import * as $ from 'jquery';

// Models
import { User } from 'app/user/user.model';
import { Subscription } from 'rxjs';
import { MultiLanguageService } from '../../language.service';

@Component({
	selector: 'app-search',
	templateUrl: './search.component.html'
})
export class SearchComponent implements OnInit, OnDestroy {

	constructor(
		private auth: AuthService,
		private user: UserService,
		private modal: ModalService,
		public global: GlobalService,
		public lang: MultiLanguageService
	) { }

	public searchTerm: string = "";
	public usersFound: User[] = [];

	private friends: Object[] = [];
	private friendSubscription: Subscription;
	private userSubscription: Subscription;
	private querySubscription: Subscription;

	@ViewChild('searchButton') searchButtonEl: ElementRef;

	// Run the seach, store the results
	ngOnInit() {
		if (this.global.username !== '') {
			this.friendSubscription = this.user.getFriendsList().subscribe(
				data => this.friends = data,
				error => this.modal.handleError(this.lang.text.errors.friendList, error)
			);
		}
	}

	ngOnDestroy() {
		if (this.querySubscription) this.querySubscription.unsubscribe();
		if (this.userSubscription) this.userSubscription.unsubscribe();
		if (this.friendSubscription) this.friendSubscription.unsubscribe();
	}

	closeDropdown(el) {
		$(el).parent().hide();
	}

	// Find users, skip the current user
	search() {
		this.ngOnInit();
		this.userSubscription = this.user.getUsers(this.searchTerm).subscribe(
			users => {
				this.usersFound = [];
				let currentId = this.auth.getCookie('userId');
				for (let user of users.data) {
					if (user._id != currentId) {
						// Handle missing pictures
						if (!user.profilePicture) {
							user.profilePicture = 'emptyprofile.png';
						}

						this.usersFound.push(user);
					}
				}
				this.searchTerm = '';
				this.userSubscription.unsubscribe();
			}, error => this.modal.handleError(this.lang.text.errors.findingUsers, error)
		);
	}

	searchWithEnter(event) {
		if (event.keyCode === 13) {
			event.preventDefault();
			this.searchButtonEl.nativeElement.click();
			this.search();
		}
	}

	// Check if the user is logged in
	isLoggedIn() {
		return this.auth.isLoggedIn();
	}

	viewProfile(name) {
		this.userSubscription = this.user.viewProfile(name).subscribe(
			data => this.modal.showUserModal(data.data),
			error => this.modal.handleError(this.lang.text.errors.user, error)
		);
	}
}
