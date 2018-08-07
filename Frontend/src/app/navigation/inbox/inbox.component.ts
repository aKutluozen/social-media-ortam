import {
	Component,
	OnInit,
	OnDestroy,
	ViewChild,
	ElementRef,
	Input
} from '@angular/core';
import { UserService } from 'app/user/user.service';
import { InboxService } from './inbox.service';
import { Subscription } from 'rxjs/Subscription';
import { GlobalService } from '../../globals.service';
import * as $ from 'jquery';

@Component({
	selector: '[app-inbox]',
	templateUrl: './inbox.component.html',
	styleUrls: ['./inbox.component.css']
})
export class InboxComponent implements OnInit, OnDestroy {
	public numbers: Object = {
		requests: 0,
		notifications: 0,
		messages: 0
	};

	private checkInterval: any = {};
	private subscription: Subscription;

	public isChatShowing: boolean = false;

	@Input() flagObject: any;

	// Capture all the children components and elements
	@ViewChild('messagesComponentElement') messagesComponentElement: ElementRef;
	@ViewChild('messagesComponent') messagesComponent;

	@ViewChild('notificationsComponentElement')
	notificationsComponentElement: ElementRef;
	@ViewChild('notificationsComponent') notificationsComponent;

	@ViewChild('requestsComponentElement') requestsComponentElement: ElementRef;
	@ViewChild('requestsComponent') requestsComponent;

	@ViewChild('chatComponentElement') chatComponentElement: ElementRef;

	constructor(private inbox: InboxService, private global: GlobalService) { }
	// Constantly checks for the numbers
	ngOnInit() {
		this.checkInterval = window.setInterval(() => {
			this.global.credit = this.flagObject.numbers.credit;

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
		}, 5000);
	}

	closeDropdown(el) {
		$(el).parent().hide();
	}

	// THERE IS NO DESTROY !!! - Replace with hasClass show not!
	ngOnDestroy() {
		if (this.subscription) { this.subscription.unsubscribe(); }
		window.clearInterval(this.checkInterval);
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
