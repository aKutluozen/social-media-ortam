// Main modules
import { Component, OnInit, OnDestroy } from '@angular/core';

// Services
import { ModalService } from 'app/modals/modal.service';
import { UserService } from 'app/user/user.service';
import { GlobalService } from 'app/globals.service';
import { Subscription } from 'rxjs';
import { MultiLanguageService } from '../../../language.service';

@Component({
	selector: 'app-requests',
	templateUrl: './requests.component.html'
})
export class RequestsComponent {

	constructor(
		private modal: ModalService,
		private user: UserService,
		public global: GlobalService,
		public lang: MultiLanguageService
	) { }
	public requests: object[] = [];

	private requestOffset: number = 0;
	private skipNumber: number = 5;
	private friendSubscription: Subscription;
	private profileSubscription: Subscription;

	destroyAll() {
		this.requestOffset = 0;
		this.requests = [];
		if (this.friendSubscription) this.friendSubscription.unsubscribe();
		if (this.profileSubscription) this.profileSubscription.unsubscribe();
	}

	loadAll() {
		this.requestOffset = 0;
		this.requests = [];
		this.load();
	}

	load() {
		this.friendSubscription = this.user.getFriendRequests(this.requestOffset).subscribe(
			data => {
				if (data.data.length == 0) {
					this.requestOffset -= this.skipNumber;
				}

				for (let item of data.data) {
					if (item.accepted === false) {
						this.requests.push(item);
					}
				}
			}, error => this.modal.handleError('Mesajlar ve istekler goruntulenirken bir sorun olustu', error)
		);
	}

	loadMore() {
		this.requestOffset += this.skipNumber;
		this.load();
	}

	// View a profile with a given name
	viewProfile(name) {
		this.profileSubscription = this.user.viewProfile(name).subscribe(
			data => {
				data.data.viewType = 'just-view';
				this.modal.showUserModal(data.data);
			}, error => this.modal.handleError('Profil yuklenirken bir sorun olustu!', error)
		);
	}
}
