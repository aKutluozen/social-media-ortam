import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ModalService } from '../modal.service';
import { GlobalService } from 'app/globals.service';
import { MultiLanguageService } from '../../language.service';

@Component({
	selector: 'app-imagemodal',
	templateUrl: './imagemodal.component.html'
})
export class ImagemodalComponent implements OnInit {

	constructor(
		private modal: ModalService,
		public global: GlobalService,
		public lang: MultiLanguageService
	) { }

	public imageText: string = '';
	public imageUrl: string = '';

	@ViewChild('modalElement') modalElement: ElementRef;

	// Initialize the modal
	ngOnInit() {
		this.modal.imageShowed.subscribe((imageUrl: string) => {
			this.imageUrl = imageUrl;
			
			this.modal.handleModalToggle(this.modalElement.nativeElement, () => {
				this.imageText = '';
				this.imageUrl = '';
			})
		});
	}
}
