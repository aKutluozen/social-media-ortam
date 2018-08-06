import { Component } from '@angular/core';
import { ModalService } from 'app/modals/modal.service';

@Component({
	selector: 'app-posts',
	templateUrl: './posts.component.html'
})
export class PostsComponent {
	constructor(
		private modal: ModalService
	) { }

	openPostWindow() {
		this.modal.showPostModal({publicity: 'public'});
	}
}
