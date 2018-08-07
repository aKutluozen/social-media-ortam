import { Component, OnInit, OnDestroy } from "@angular/core";
import { User } from "./user.model";
import { AuthService } from "app/auth/auth.service";
import { ModalService } from 'app/modals/modal.service';
import { UserService } from './user.service';
import { Router } from "@angular/router";
import { NgForm, FormGroup, FormControl, Validators } from "@angular/forms";
import { GlobalService } from "app/globals.service";
import { PostService } from "app/posts/posts.service";
import { Subscription } from 'rxjs/Subscription';
import { Post } from '../posts/post.model';

@Component({
	selector: 'app-user',
	templateUrl: './user.component.html',
	styleUrls: ['./user.component.css']
})
export class UserComponent implements OnInit, OnDestroy {

	constructor(
		private auth: AuthService,
		private modal: ModalService,
		private user: UserService,
		private router: Router,
		public postService: PostService,
		public global: GlobalService
	) {
	}

	public profile: User;
	public profileForm: FormGroup;
	public images: string[] = [];
	public oldImages: string[] = [];
	public showImage: string = 'none';
	public imageShowed: string = '';
	public friends: Object[] = [];
	private subscription: Subscription;
	private postSubscription: Subscription;
	public myPosts: Post[] = [];

	// Profile picture variables
	public profilePictureChangedEvent: any = '';
	public croppedProfilePicture: any = '';
	public profilePicture: string = '';

	// Cover picture variables
	public coverPictureChangedEvent: any = '';
	public croppedCoverPicture: any = '';
	public coverPicture: string = '';

	private userSubscription: Subscription;

	showThisImage(imageUrl) {
		if (imageUrl) {
			this.modal.showImageInModal(imageUrl);
		}
	}

	// publicity: 'private' or nothing
	openPostWindow() {
		this.modal.showPostModal({ publicity: 'private' });
	}

	// Profile info update actions ************

	enableInfoUpdate() {
		this.profileForm.enable();
		this.profileForm.get('email').disable();
		this.profileForm.get('nickName').disable();
		// this.profileForm.get('chatNickName').disable();
	}

	disableInfoUpdate() {
		this.profileForm.disable();
	}

	saveProfile() {
		this.userSubscription = this.user.updateProfile(this.profileForm.value).subscribe(
			result => {
				this.profileForm.disable();
				// this.modal.handleWarning('Profiliniz basari ile guncellenmistir!');
			},
			error => {
				this.modal.handleError('Profil guncellenirken bir hata olustu!', error);
			}
		);
	}

	// Media pictures update actions ************

	deleteThisImage(image) {

		// Don't delete empty images
		if (image) {
			this.modal.showQuestion({
				content: 'Bu resmi istediginizden emin misiniz?',
				itemToBeDeleted: image,
				itemCollection: this.user,
				approveFunction: (image, user) => {
					user.deleteGalleryPicture(
						image,
						() => {
							let pos = this.images.indexOf(image);
							this.images.splice(pos, 1);
							this.fillEmptyImages();
							// this.modal.handleWarning('Resim silindi!');
						},
						() => {
							this.modal.handleError('Resimler yuklenirken bir sorun oldu', {});
							console.log('Many images are NOT uploaded!');
						});
				}
			});
		}
	}

	addGalleryImages() {
		var files = document.getElementById('pictureFiles')['files'];

		for (let file of files) {
			if (file.size > 1000000) {
				this.modal.handleWarning('Resimler 1 MB\'den buyuk olmamalidir. 1 MB\'den buyuk resimler yuklenmedi.');
			}
		}

		var emptyImagesCount = 0;
		for (var i = 0; i < this.images.length; ++i) {
			if (this.images[i] == '') {
				emptyImagesCount++;
			}
		}

		if (files) {
			if (files.length > emptyImagesCount) {
				this.modal.handleWarning('Maksimum 6 resim hakkini doldurdunuz. Bazi resimleri silerek yeni resimlere yer acabilirsiniz.');
			} else {
				this.user.updateGalleryPictures(
					files,
					(response) => {
						this.images = [];
						for (let file of response.data) {
							this.images.push(file);
						}
						this.fillEmptyImages();
					},
					() => {
						console.log('Many images are NOT uploaded!');
					});
			}
		}
	}

	// Profile picture update actions ************

	profilePictureFileChangeEvent(event: any): void {
		this.profilePictureChangedEvent = event;
	}

	profilePictureCropped(image: string) {
		this.croppedProfilePicture = image;
	}

	profileImageLoaded() {
		// show cropper
	}

	profileImageLoadImageFailed() {
		// show message
	}

	deleteProfilePicture() {
		this.modal.showQuestion({
			content: 'Profile resmini istediginizden emin misiniz?',
			itemToBeDeleted: '',
			itemCollection: this.user,
			approveFunction: (message, user) => {
				user.deleteProfilePicture(
					(response) => {
						this.profilePicture = '';
						this.global.profilePicture = '';
						// this.modal.handleWarning('Profil resmi silindi!');
					},
					(error) => {
						console.log('Profile image NOT updated!');
					});
			}
		});
	}

	emptyProfilePicture() {
		this.croppedProfilePicture = '';
		this.profilePictureChangedEvent = null;
		this.profilePicture = '';
	}

	addProfileImage() {
		var file = this.global.dataURLtoFile(this.croppedProfilePicture, 'pic.jpeg');

		this.user.updateProfilePicture(
			file,
			(response) => {
				if (response.data != '') {
					this.croppedProfilePicture = '';
					this.profilePictureChangedEvent = null;
					this.profilePicture = response.data;
					this.global.profilePicture = response.data;
				} else {
					this.profilePicture = '';
				}
			},
			() => {
				console.log('Profile image NOT uploaded!');
			});
	}

	// Cover picture update actions ************

	coverPictureFileChangeEvent(event: any): void {
		this.coverPictureChangedEvent = event;
	}

	coverPictureCropped(image: string) {
		this.croppedCoverPicture = image;
	}

	coverImageLoaded() {
		// show cropper
	}

	coverImageLoadImageFailed() {
		// show message
	}

	emptyCoverPicture() {
		this.croppedCoverPicture = '';
		this.coverPictureChangedEvent = null;
		this.coverPicture = '';
	}

	addCoverImage() {
		var file = this.global.dataURLtoFile(this.croppedCoverPicture, 'pic.jpeg');

		this.user.updateCoverImage(
			file,
			(response) => {
				if (response.data != '') {
					this.croppedCoverPicture = '';
					this.coverPictureChangedEvent = null;
					this.coverPicture = response.data;
				} else {
					this.coverPicture = '';
				}
			},
			() => {
				console.log('Cover image NOT uploaded!');
			});
	}

	deleteCoverImage() {
		this.modal.showQuestion({
			content: 'Kapak resmini istediginizden emin misiniz?',
			itemToBeDeleted: '',
			itemCollection: this.user,
			approveFunction: (message, user) => {
				user.deleteCoverImage(
					(response) => {
						this.coverPicture = '';
						// this.modal.handleWarning('Kapak resmi silindi!');
					},
					(error) => {
						console.log('Cover image NOT updated!');
					});
			}
		});
	}

	// Show a friends profile in a modal
	showFriend(name) {
		this.userSubscription = this.user.viewProfile(name).subscribe(
			data => {
				this.modal.showUserModal(data.data);
			}, error => {
				this.modal.handleError('Profil yuklenirken bir sorun olustu!', error);
			});
	}

	// Fill images with empty ones if less than 5
	fillEmptyImages() {
		for (let i = 0; i < 6; i++) {
			if (this.images.length < 6) {
				this.images.push("");
			}
		}
	}

	ngOnDestroy() {
		if (this.subscription) this.subscription.unsubscribe();
		if (this.postSubscription) this.postSubscription.unsubscribe();
		if (this.userSubscription) this.userSubscription.unsubscribe();
	}

	// Initialize the whole user form
	ngOnInit() {

		this.subscription = this.user.$friendEvent.subscribe(
			data => {
				let pos = this.friends.indexOf(data);
				this.friends.splice(pos, 1);
			}
		);

		this.profileForm = new FormGroup({
			firstName: new FormControl({ value: '', disabled: true }, Validators.required),
			lastName: new FormControl({ value: '', disabled: true }, Validators.required),
			nickName: new FormControl({ value: '', disabled: true }),
			chatNickName: new FormControl({ value: '', disabled: true }),
			birthday: new FormControl({ value: '', disabled: true }, Validators.required),
			jobStatus: new FormControl({ value: '', disabled: true }, Validators.required),
			education: new FormControl({ value: '', disabled: true }, Validators.required),
			email: new FormControl({ value: '', disabled: true }),
			bio: new FormControl({ value: '', disabled: true }, Validators.required),
			twitterLink: new FormControl({ value: '', disabled: true }),
			youtubeLink: new FormControl({ value: '', disabled: true }),
			googleplusLink: new FormControl({ value: '', disabled: true }),
			linkedinLink: new FormControl({ value: '', disabled: true }),
			snapchatLink: new FormControl({ value: '', disabled: true }),
			instagramLink: new FormControl({ value: '', disabled: true }),
		});

		this.postSubscription = this.postService.getPosts(this.auth.getCookie('userId'), 0, 'private', this.auth.getCookie('userId')).subscribe(
			data => {
				this.postService.posts = data;
			},
			error => console.log(error)
		);

		this.userSubscription = this.user.getProfile().subscribe(
			data => {
				this.profile = data.data;

				// Add data to a USER MODEL !!!
				for (let user of data.data.following) {
					if (user.accepted === true) {
						// if (user.friend.profilePicture != '' && user.friend.profilePicture != undefined) {
						// 	user.friend.profilePicture = user.friend.profilePicture;
						// }
						// Handle missing pictures
						if (!user.friend.profilePicture || user.friend.profilePicture == '') {
							user.friend.profilePicture = 'emptyprofile.png';
						}
						// console.log(user.friend);
						this.friends.push(user);
					}
				}

				let birthdayDate = new Date(),
					realBirthday = '';

				if (this.profile.birthday) {
					birthdayDate = new Date(this.profile.birthday);
					realBirthday = birthdayDate.toISOString().split('T')[0];
				}

				// Get only friend nicknames for group purposes
				var friendNicknames = [];
				for (let friend of this.friends) {
					friendNicknames.push(friend['nickName']);
				}

				// Parse gallery imagesimages
				for (let image of this.profile.images) {
					this.images.push(image);
				}

				this.fillEmptyImages();

				if (this.profile.profilePicture != '' && this.profile.profilePicture != undefined) {
					this.profilePicture = this.profile.profilePicture;
				} else {
					this.profilePicture = '';
				}

				if (this.profile.coverImage != '' && this.profile.coverImage != undefined) {
					this.coverPicture = this.profile.coverImage;
				} else {
					this.coverPicture = '';
				}

				this.global.profilePicture = this.profile.profilePicture;
				this.global.username = this.profile.nickName;

				this.profileForm.patchValue({
					firstName: this.profile.firstName || '',
					lastName: this.profile.lastName || '',
					nickName: this.profile.nickName || '',
					chatNickName: this.profile.chatNickName || '',
					birthday: realBirthday || '',
					jobStatus: this.profile.jobStatus || '',
					education: this.profile.education || '',
					email: this.profile.email || '',
					bio: this.profile.bio || '',
					twitterLink: this.profile.twitterLink || '',
					youtubeLink: this.profile.youtubeLink || '',
					googleplusLink: this.profile.googleplusLink || '',
					linkedinLink: this.profile.linkedinLink || '',
					snapchatLink: this.profile.snapchatLink || '',
					instagramLink: this.profile.instagramLink || ''
				});
			},
			error => {
				this.modal.handleError('Profil yuklenirken bir sorun olustu!', error);
			}
		);
	}
}