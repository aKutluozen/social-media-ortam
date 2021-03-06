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
import * as $ from 'jquery';
import { MultiLanguageService } from "../language.service";
declare var $: any;

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
		public lang: MultiLanguageService,
		private router: Router,
		public postService: PostService,
		public global: GlobalService
	) {
	}

	public passwordOld: string;
	public passwordNew: string;
	public closePassword: string;
	public profile: User;
	public profileForm: FormGroup;
	public images: string[] = [];
	public oldImages: string[] = [];
	public showImage: string = 'none';
	public imageShowed: string = '';
	public isRotating: boolean = false;
	public isRotatingCover: boolean = false;

	public friends: Object[] = [];
	private subscription: Subscription;
	private postSubscription: Subscription;
	private degree: number = 0;
	private degreeCover: number = 0;
	public myPosts: Post[] = [];
	private isCroppingCover: boolean = false;

	// Profile picture variables
	public profilePictureChangedEvent: any = '';
	public croppedProfilePicture: any = '';
	public profilePicture: string = '';

	// Cover picture variables
	public coverPictureChangedEvent: any = '';
	public croppedCoverPicture: any = '';
	public coverPicture: string = '';
	public coverCropperSize: any = {};
	public coverImageRatio: number = 0;

	private userSubscription: Subscription;

	resetPassword(oldPass, newPass) {
		this.user.resetPassword(oldPass, newPass).subscribe(
			data => this.modal.handleWarning(this.lang.text.user.passwordReset),
			error => this.modal.handleError(this.lang.text.errors.passwordReset, error)
		);
	}

	closeAccount(oldPass) {
		this.modal.showQuestion({
			content: this.lang.text.user.areYouSureCloseAccount,
			approveFunction: () => {
				this.user.closeAccount(oldPass, this.auth.getCookie('user')).subscribe(
					data => {
						this.modal.handleWarning(this.lang.text.user.accountClosed);
						this.auth.logout();
						this.router.navigateByUrl('/auth/signin');
					},
					error => this.modal.handleError(this.lang.text.errors.closingAccount, error)
				);
			}
		});
	}

	rotateCoverImage() {
		this.isRotatingCover = true;

		$('#i1c').attr('src', this.croppedCoverPicture);

		var canvas = $('#rotateCoverCanvas')[0];
		var img = new Image();
		img.src = this.croppedCoverPicture;

		this.degree += 90;
		this.degree %= 360;

		canvas.width = 800;
		canvas.height = 300;

		var context = canvas.getContext("2d");

		if (this.degree == 0 || this.degree == 180) {
			context.translate(img.width / 2, img.height / 2);
		} else {
			context.translate(img.height / 2, img.width / 2);
		}
		context.rotate(this.degree * Math.PI / 180);
		context.drawImage(img, -(img.width / 2), - (img.height / 2));
		context.restore();
		var rotatedImageSrc = canvas.toDataURL();
		this.croppedCoverPicture = rotatedImageSrc;
		$('#i1c').attr('src', rotatedImageSrc);
		if (!this.isCroppingCover) this.coverCropperSize = { x1: 0, y1: 0, x2: '100%', y2: '100%' }
	}

	rotateProfileImage() {
		this.isRotating = true;

		$('#i1p').attr('src', this.croppedProfilePicture);

		var canvas = $('#rotateProfileCanvas')[0];
		var img = new Image();
		img.src = this.croppedProfilePicture;

		this.degree += 90;
		this.degree %= 360;

		if (this.degree == 0 || this.degree == 180) {
			canvas.width = img.width;
			canvas.height = img.height;
		} else {
			canvas.width = img.height;
			canvas.height = img.width;
		}

		var context = canvas.getContext("2d");

		if (this.degree == 0 || this.degree == 180) {
			context.translate(img.width / 2, img.height / 2);
		} else {
			context.translate(img.height / 2, img.width / 2);
		}
		context.rotate(this.degree * Math.PI / 180);
		context.drawImage(img, -(img.width / 2), - (img.height / 2));
		context.restore();
		var rotatedImageSrc = canvas.toDataURL();
		this.croppedProfilePicture = rotatedImageSrc;
		$('#i1p').attr('src', rotatedImageSrc);
	}

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
		this.profileForm.get('chatNickName').disable();
	}

	disableInfoUpdate() {
		this.profileForm.disable();
	}

	saveProfile() {
		this.userSubscription = this.user.updateProfile(this.profileForm.value).subscribe(
			result => {
				this.profileForm.disable();
				this.modal.handleWarning(this.lang.text.user.profileUpdated);
			},
			error => this.modal.handleError(this.lang.text.errors.profileUpdated, error)
		);
	}

	// Media pictures update actions ************

	deleteThisImage(image) {
		// Don't delete empty images
		if (image) {
			this.modal.showQuestion({
				content: this.lang.text.general.areSureDeletePicture,
				approveFunction: () => {
					this.user.deleteGalleryPicture(
						image,
						() => {
							let pos = this.images.indexOf(image);
							this.images.splice(pos, 1);
							this.fillEmptyImages();
						},
						err => this.modal.handleError(this.lang.text.errors.picturesUpload, err)
					);
				}
			});
		}
	}

	addGalleryImages() {
		var files = document.getElementById('pictureFiles')['files'];

		for (let file of files) {
			if (file.size > 1000000) {
				this.modal.handleWarning(this.lang.text.errors.pictureSize);
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
				this.modal.handleWarning(this.lang.text.errors.pictureLimit);
			} else {
				this.user.updateGalleryPictures(
					files,
					response => {
						this.images = [];
						for (let file of response.data) {
							this.images.push(file);
						}
						this.fillEmptyImages();
					},
					err => this.modal.handleError(this.lang.text.errors.picturesUpload, err)
				);
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
			content: this.lang.text.general.areSureDeletePicture,
			approveFunction: () => {
				this.user.deleteProfilePicture(
					response => {
						this.profilePicture = '';
						this.global.profilePicture = '';
					},
					err => this.modal.handleError(this.lang.text.errors.pictureUpload, err)
				);
			}
		});
	}

	emptyProfilePicture() {
		this.croppedProfilePicture = '';
		this.profilePictureChangedEvent = null;
		this.profilePicture = '';
		this.isRotating = false;
	}

	addProfileImage() {
		var file = this.global.dataURLtoFile(this.croppedProfilePicture, 'pic.jpeg');

		this.user.updateProfilePicture(
			file,
			response => {
				if (response.data != '') {
					this.croppedProfilePicture = '';
					this.profilePictureChangedEvent = null;
					this.isRotating = false;
					this.profilePicture = response.data;
					this.global.profilePicture = response.data;
				} else {
					this.profilePicture = '';
				}
			},
			err => this.modal.handleError(this.lang.text.errors.user, err)
		);
	}

	// Cover picture update actions ************

	coverPictureFileChangeEvent(event: any): void {
		this.coverPictureChangedEvent = event;
	}

	coverPictureCropped(image: string) {
		this.croppedCoverPicture = image;

		// Check vertical proportion here, if too big, stop it.
		var i = new Image();
		i.onload = () => {
			if (i.height > 960) {
				this.modal.handleError(this.lang.text.errors.pictureRatio, {});
				// Reset the cropper
				this.coverCropperSize.x2 = 320;
			}
		};

		i.src = this.croppedCoverPicture;
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
		this.isRotatingCover = false;
	}

	addCoverImage() {
		var file = this.global.dataURLtoFile(this.croppedCoverPicture, 'pic.jpeg');

		this.user.updateCoverImage(
			file,
			response => {
				if (response.data != '') {
					this.croppedCoverPicture = '';
					this.coverPictureChangedEvent = null;
					this.coverPicture = response.data;
					this.isRotatingCover = false;
				} else {
					this.coverPicture = '';
				}
			},
			err => this.modal.handleError(this.lang.text.errors.pictureUpload, err)
		);
	}

	deleteCoverImage() {
		this.modal.showQuestion({
			content: this.lang.text.general.areSureDeletePicture,
			approveFunction: () => {
				this.user.deleteCoverImage(
					response => this.coverPicture = '',
					err => this.modal.handleError(this.lang.text.errors.pictureUpload, err)
				);
			}
		});
	}

	// Show a friends profile in a modal
	showFriend(name) {
		this.userSubscription = this.user.viewProfile(name).subscribe(
			data => this.modal.showUserModal(data.data),
			error => this.modal.handleError(this.lang.text.errors.user, error)
		);
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
			shortMessage: new FormControl({ value: '', disabled: true }),
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
			data => this.postService.posts = data,
			error => console.error(error)
		);

		this.userSubscription = this.user.getProfile().subscribe(
			data => {
				this.profile = data.data;

				for (let user of data.data.following) {
					if (user.accepted === true) {
						if (!user.friend.profilePicture || user.friend.profilePicture == '') {
							user.friend.profilePicture = 'emptyprofile.png';
						}
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
					shortMessage: this.profile.shortMessage || '',
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
			error => this.modal.handleError(this.lang.text.errors.user, error)
		);
	}
}