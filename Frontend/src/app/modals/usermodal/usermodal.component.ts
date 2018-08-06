import { Component, OnInit } from '@angular/core';

// Services
import { ModalService } from '../modal.service';
import { UserService } from 'app/user/user.service';
import { AuthService } from 'app/auth/auth.service';
import { GlobalService } from 'app/globals.service';
import { PostService } from 'app/posts/posts.service';

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
		public postService: PostService
	) { }

	public display: string = 'none';
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

			if (user.nickName === this.auth.getCookie('user')) {
				this.isMe = true;
			} else {
				this.isMe = false;
			}

			this.user = user;
			this.display = 'block';
			
			if (this.user['viewType'] == 'just-view') {
				this.justView = true;
			} else {
				this.justView = false;
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
			this.postService.getPosts(this.user._id, 0, 'private', this.user._id).subscribe(
				data => {
					this.user.posts = data;
				},
				error => console.log(error)
			);

			console.log(this.user);
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
					console.log(this.friends);
				}, error => { }
			);
		});
	}

	// Turn on the answering modal
	answerMessage(receiver) {
		this.modal.showInputModal({
			type: 'first',
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
				// this.modal.handleWarning('Takip istegi basari ile gonderildi');
				this.close();
			}, error => {
				this.modal.handleError('Istek gonderilemedi', error);
			});
	}

	// Delete a friend
	unfriend(name) {
		this.modal.showQuestion({
			content: 'Bu kisiyi arkadasliktan cikarmak istediginize emin misiniz?',
			itemToBeDeleted: name,
			itemCollection: '',
			helperService: this.userService,
			approveFunction: (name, collection, service) => {
				service.deleteFriend(name).subscribe(
					data => {
						this.isFriend = false;
						// this.modal.handleWarning('Arkadasliktan cikarildi!');
						this.close();
					}, error => {
						this.modal.handleError('Arkadaslik iptal edilirken bir sorun olustu', error);
					});
			}
		});

	}

	// Close the modal
	close() {
		this.user = {};
		this.display = 'none';
	}
}
