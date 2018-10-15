import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

// Services
import { ModalService } from '../modal.service';
import { UserService } from 'app/user/user.service';
import { AuthService } from 'app/auth/auth.service';
import { GlobalService } from 'app/globals.service';
import { PostService } from 'app/posts/posts.service';
import * as $ from 'jquery';
import { MultiLanguageService } from '../../language.service';
declare var $: any;

@Component({
	selector: 'app-usermodal',
	templateUrl: './usermodal.component.html',
	styleUrls: ['./usermodal.component.css']
})
export class UsermodalComponent implements OnInit {

	constructor(
		private modal: ModalService,
		private userService: UserService,
		private auth: AuthService,
		public global: GlobalService,
		public postService: PostService,
		public lang: MultiLanguageService
	) { }

	@ViewChild('modalElement') modalElement: ElementRef;

	public user: any = {};
	public images: string[] = [];
	public justView: boolean = false;
	public isMe: boolean = false;
	public isFriend: boolean = false;
	public isInTheFollowList: boolean = false;
	public showImage: string = '';

	private friends: any = {};

	// Initialize the modal
	ngOnInit() {
		this.modal.userModalActivated.subscribe((user: any) => {

			this.isMe = false;
			if (user.nickName === this.auth.getCookie('user')) {
				this.isMe = true;
			}

			this.user = user;

			this.justView = false;
			if (this.user['viewType'] == 'just-view') {
				this.justView = true;
			}

			// Handle gallery
			if (this.user.images) {
				this.images = [];
				for (let image of this.user.images) {
					if (image != '') {
						this.images.push(image);
					}
				}
			}

			this.user.posts = [];
			var postSubscription = this.postService.getPosts(this.user._id, 0, 'private', this.user._id).subscribe(
				data => this.user.posts = data,
				error => { postSubscription.unsubscribe(); console.error(error) }
			);

			this.isInTheFollowList = false;
			// Check if a friend!
			this.userService.getFriendsList().subscribe(
				data => {
					this.friends = data;
					for (let friend of data) {
						if (friend.nickName == this.user.nickName) {
							this.isInTheFollowList = true;
						}

						if (friend.nickName == this.user.nickName && friend.accepted == true) {
							this.isFriend = true;
							break;
						} else {
							this.isFriend = false;
						}
					}

					this.modal.handleModalToggle(this.modalElement.nativeElement, () => {
						this.user = {};
					});
				}, error => { }
			);
		});
	}

	creditAskSend(nickName, profilePicture) {
		this.modal.showCreditModal({nickName: nickName, profilePicture: profilePicture});
	}

	// Turn on the answering modal
	answerMessage(receiver) {
		this.modal.showInputModal({
			type: 'chat',
			title: 'Mesaj gonder',
			receiver: receiver
		});
		this.close();
	}

	showThisImage(imageUrl) {
		if (imageUrl) {
			this.modal.showImageInModal(imageUrl);
		}
	}

	// Returns true when the request is sent but not accepted yet
	isRequestSent(otherUser) {
		if (otherUser.following) {
			var currentUser = this.auth.getCookie('user');
			for (let followed of otherUser.following) {
				if (followed.nickName == currentUser && followed.accepted === false) {
					return true;
				}
			}

			return false;
		}
	}

	// Add user tot he following list of the other user
	follow(id) {
		this.userService.sendFollowRequest(id).subscribe(
			data => {
				this.modal.handleWarning('Takip istegi basari ile gonderildi');
				this.close();
			}, error => this.modal.handleError('Istek gonderilemedi', error)
		);
	}

	// Accept friendship, remove it from the list if successfull
	acceptRequest(id) {
		this.userService.addToFollowing(id).subscribe(
			data => {
				this.modal.handleWarning('Takip istegi kabul edildi!');
				this.close();
			}, error => this.modal.handleError('Kabul edilemedi', error)
		);
	}

	// Reject friendship, remove it from the list if successfull
	rejectRequest(name) {
		this.modal.showQuestion({
			content: 'Bu istegi geri cevirmek istediginize emin misiniz?',
			approveFunction: () => {
				this.userService.rejectFollowing(name).subscribe(
					data => {
						this.modal.handleWarning('Takip istegi iptal edildi!');
						this.close();
					}, error => this.modal.handleError('Takip istegi iptal edilirken bir sorun olustu', error)
				);
			}
		});
	}

	// Delete a friend
	unfriend(name) {
		this.modal.showQuestion({
			content: 'Bu kisiyi arkadasliktan cikarmak istediginize emin misiniz?',
			approveFunction: () => {
				this.userService.deleteFriend(name).subscribe(
					data => {
						this.isFriend = false;
						this.modal.handleWarning('Arkadasliktan cikarildi!');
						this.close();
					}, error => this.modal.handleError('Arkadaslik iptal edilirken bir sorun olustu', error)
				);
			}
		});
	}

	// Close the modal
	close() {
		$(this.modalElement.nativeElement).modal('hide');
	}
}
