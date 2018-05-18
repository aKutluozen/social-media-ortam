// Main modules
import { Component, OnInit, OnDestroy } from '@angular/core';

// Services
import { ModalService } from 'app/modals/modal.service';
import { UserService } from 'app/user/user.service';
import { GlobalService } from 'app/globals.service';
import { Subscription } from 'rxjs';

@Component({
	selector: 'app-requests',
	templateUrl: './requests.component.html',
	styleUrls: ['./requests.component.css']
})
export class RequestsComponent {

	constructor(
		private modal: ModalService,
		private user: UserService,
		public global: GlobalService
	) { }
	public requests: object[] = [];

	private requestOffset: number = 0;
	private skipNumber: number = 5;
	private friendSubscription: Subscription;
	private profileSubscription: Subscription;
	private requestSubscription: Subscription;

  destroyAll() {
    this.requestOffset = 0;
    this.requests = [];
    if (this.friendSubscription) this.friendSubscription.unsubscribe();
		if (this.profileSubscription) this.profileSubscription.unsubscribe();
		if (this.requestSubscription) this.requestSubscription.unsubscribe();
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
			}, error => {
				this.modal.handleError('Mesajlar ve istekler goruntulenirken bir sorun olustu', error);
			});
	}

	loadMore() {
		this.requestOffset += this.skipNumber;
		this.load();
	}

	// Accept friendship, remove it from the list if successfull
	acceptRequest(id, request) {
		this.requestSubscription = this.user.addToFollowing(id).subscribe(
			data => {
				for (let i = 0; i < this.requests.length; i++) {
					if (this.requests[i]['nickName'] === request.nickName) {
						this.requests.splice(i, 1);
					}
				}
				this.modal.handleWarning('Takip istegi kabul edildi!');
			}, error => {
				this.modal.handleError('Kabul edilemedi', error);
			});
	}

	// Reject friendship, remove it from the list if successfull
	rejectRequest(name, request) {
		this.modal.showQuestion({
			content: 'Bu istegi geri cevirmek istediginize emin misiniz?',
			itemToBeDeleted: name,
			itemCollection: this.requests,
			helperService: this.user,
			approveFunction: (name, collection, service) => {
				this.requestSubscription = service.rejectFollowing(name).subscribe(
					data => {
						for (let i = 0; i < collection.length; i++) {
							if (collection[i]['nickName'] === request.nickName) {
								collection.splice(i, 1);
							}
						}
						this.modal.handleWarning('Takip istegi iptal edildi!');
					}, error => {
						this.modal.handleError('Takip istegi iptal edilirken bir sorun olustu', error);
					});
			}
		});
	}

	// View a profile with a given name
	viewProfile(name) {
		this.profileSubscription = this.user.viewProfile(name).subscribe(
			data => {
				// add view type to user object
				data.data.viewType = 'just-view';
				this.modal.showUserModal(data.data);
			}, error => {
				this.modal.handleError('Profil yuklenirken bir sorun olustu!', error);
			});
	}
}
