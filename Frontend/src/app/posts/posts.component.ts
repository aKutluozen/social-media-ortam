import { Component } from '@angular/core';
import { ModalService } from 'app/modals/modal.service';
import { AuthService } from '../auth/auth.service';

@Component({
	selector: 'app-posts',
	templateUrl: './posts.component.html'
})
export class PostsComponent {
	constructor(
		private modal: ModalService,
		public auth: AuthService
	) { }

	openPostWindow() {
		this.modal.showPostModal({publicity: 'public'});
	}
}
