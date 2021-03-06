import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import { User } from "../user.model";
import { AuthService } from "app/auth/auth.service";
import { ModalService } from 'app/modals/modal.service';
import { UserService } from '../user.service';
import { GlobalService } from "app/globals.service";
import { PostService } from "app/posts/posts.service";
import { Subscription } from 'rxjs/Subscription';
import { MultiLanguageService } from "../../language.service";
import { Router } from "@angular/router";

@Component({
	selector: 'app-usercard',
	templateUrl: './user-card.component.html'
})
export class UserCardComponent implements OnInit, OnDestroy {

	constructor(
		public auth: AuthService,
		private modal: ModalService,
		public router: Router,
		private user: UserService,
		public postService: PostService,
		public global: GlobalService,
		public lang: MultiLanguageService
	) {
	}

	public closePassword: string;
	@Input() public profile: User;
	@Input() public isOwnProfile: boolean = false;
	private userSubscription: Subscription;

	ngOnDestroy() {
		if (this.userSubscription) this.userSubscription.unsubscribe();
	}

	// Initialize the whole user form
	ngOnInit() {
		this.userSubscription = this.user.getProfile().subscribe(
			data => {
				this.profile = data.data;
				this.global.profilePicture = this.profile.profilePicture;
				this.global.username = this.profile.nickName;
				if (this.isOwnProfile) {
					this.profile.profilePicture = this.global.profilePicture;
				}
			},
			error => console.error('no user')
		);
	}
}