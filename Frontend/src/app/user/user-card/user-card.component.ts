import { Component, OnInit, OnDestroy } from "@angular/core";
import { User } from "../user.model";
import { AuthService } from "app/auth/auth.service";
import { ModalService } from 'app/modals/modal.service';
import { UserService } from '../user.service';
import { GlobalService } from "app/globals.service";
import { PostService } from "app/posts/posts.service";
import { Subscription } from 'rxjs/Subscription';

@Component({
	selector: 'app-usercard',
	templateUrl: './user-card.component.html'
})
export class UserCardComponent implements OnInit, OnDestroy {

	constructor(
		private auth: AuthService,
		private modal: ModalService,
		private user: UserService,
		public postService: PostService,
		public global: GlobalService
	) {
	}

	public closePassword: string;
	public profile: User;
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
			},
			error => this.modal.handleError('Profil yuklenirken bir sorun olustu!', error)
		);
	}
}