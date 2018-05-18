// Main modules
import { Component, OnInit } from '@angular/core';

// Services
import { ModalService } from '../modal.service';
import { InboxService } from 'app/navigation/inbox/inbox.service';

@Component({
	selector: 'app-questionmodal',
	templateUrl: './questionmodal.component.html',
	styleUrls: ['./questionmodal.component.css']
})
export class QuestionmodalComponent implements OnInit {

	constructor(
		private modal: ModalService,
		private messageService: InboxService
	) { }

	public display: string = 'none';
	public content: string = '';

	private approveFunction;
	private dataToBeDeleted;
	private collection;
	private helperService;

	// Initialize the question modal
	ngOnInit() {
		this.modal.questionModalActivated.subscribe((questionSetup: Object) => {
			this.display = 'block';
			this.content = questionSetup['content'];
			this.approveFunction = questionSetup['approveFunction'];
			this.dataToBeDeleted = questionSetup['itemToBeDeleted'];
			this.collection = questionSetup['itemCollection'];
			this.helperService = questionSetup['helperService'];
		});
	}

	// Close it
	close() {
		this.approveFunction = '';
		this.display = 'none';
	}

	// Approve function needs to be passed with necessary 3 parameters 
	// (what to delete, where to delete it from, what service to use)
	approve() {
		this.approveFunction(this.dataToBeDeleted, this.collection, this.helperService);
		this.close();
	}
}
