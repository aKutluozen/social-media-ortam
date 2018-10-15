// Main modules
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

// Services
import { ModalService } from '../modal.service';
import { InboxService } from 'app/navigation/inbox/inbox.service';
import * as $ from 'jquery';
import { MultiLanguageService } from '../../language.service';
declare var $: any;

@Component({
	selector: 'app-questionmodal',
	templateUrl: './questionmodal.component.html'
})
export class QuestionmodalComponent implements OnInit {

	constructor(
		private modal: ModalService,
		private messageService: InboxService,
		public lang: MultiLanguageService
	) { }

	public content: string = '';

	private approveFunction;
	private dataToBeDeleted;
	private collection;
	private helperService;

	@ViewChild('modalElement') modalElement: ElementRef;

	// Initialize the question modal
	ngOnInit() {
		this.modal.questionModalActivated.subscribe((questionSetup: Object) => {
			this.content = questionSetup['content'];
			this.approveFunction = questionSetup['approveFunction'];
			this.dataToBeDeleted = questionSetup['itemToBeDeleted'];
			this.collection = questionSetup['itemCollection'];
			this.helperService = questionSetup['helperService'];

			this.modal.handleModalToggle(this.modalElement.nativeElement, () => {
				this.approveFunction = '';
				this.content = '';
				this.approveFunction = '';
				this.dataToBeDeleted = '';
				this.collection = '';
			});
		});
	}

	// Approve function needs to be passed with necessary 3 parameters 
	// (what to delete, where to delete it from, what service to use)
	approve() {
		this.approveFunction(this.dataToBeDeleted, this.collection, this.helperService);
		$(this.modalElement.nativeElement).modal('hide');
	}
}
