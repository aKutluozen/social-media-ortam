import { Component, OnInit, ViewChild, ElementRef, Input } from '@angular/core';
import { InboxService } from './inbox.service';
import { GlobalService } from '../../globals.service';
import * as $ from 'jquery';
import { MultiLanguageService } from '../../language.service';

@Component({
	selector: '[app-inbox]',
	templateUrl: './inbox.component.html',
	styleUrls: ['./inbox.component.css']
})
export class InboxComponent implements OnInit {
	public numbers: Object = {
		requests: 0,
		notifications: 0,
		messages: 0
	};

	public isChatShowing: boolean = false;

	@Input() flagObject: any;

	// Capture all the children components and elements
	@ViewChild('messagesComponentElement') messagesComponentElement: ElementRef;
	@ViewChild('messagesComponent') messagesComponent;

	@ViewChild('notificationsComponentElement') notificationsComponentElement: ElementRef;
	@ViewChild('notificationsComponent') notificationsComponent;

	@ViewChild('requestsComponentElement') requestsComponentElement: ElementRef;
	@ViewChild('requestsComponent') requestsComponent;

	@ViewChild('chatComponentElement') chatComponentElement: ElementRef;

	constructor(private inbox: InboxService, public global: GlobalService, public lang: MultiLanguageService) { }
	// Just checks if one of the dropdowns are closed
	ngOnInit() {
		window.setInterval(() => {
			// Stop actions if they are not shown
			if (!this.messagesComponentElement.nativeElement.classList.contains('show')) {
				this.messagesComponent.destroyAll();
			}

			if (!this.notificationsComponentElement.nativeElement.classList.contains('show')) {
				this.notificationsComponent.destroyAll();
			}

			if (!this.requestsComponentElement.nativeElement.classList.contains('show')) {
				this.requestsComponent.destroyAll();
			}
		}, 3000);
	}

	closeDropdown(el) {
		$(el).parent().hide();
	}

	// Tells children compoments to show fresh data
	loadMessages() {
		this.messagesComponent.loadAll();
	}

	loadNotifications() {
		this.notificationsComponent.loadAll();
	}

	loadRequests() {
		this.requestsComponent.loadAll();
	}
}
