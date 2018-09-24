// Main modules
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

// Services
import { ModalService } from '../modal.service';
import { InboxService } from 'app/navigation/inbox/inbox.service';
import { GlobalService } from '../../globals.service';
import { UserService } from '../../user/user.service';
import * as $ from 'jquery';
declare var $: any;
declare var SimplePeer: any;
@Component({
	selector: 'app-inputmodal',
	templateUrl: './inputmodal.component.html',
	styleUrls: ['./inputmodal.component.scss']
})
export class InputmodalComponent implements OnInit {

	constructor(
		private inputService: ModalService,
		private messageService: InboxService,
		private modal: ModalService,
		private global: GlobalService,
		private user: UserService
	) { }
	public message: string = '';
	public messageSetup: any = {};
	public disableSending: boolean = false;
	public isFriend: boolean = false;

	private isFirst: boolean = false;
	private timedCheck: any = 0;
	private timeout: any = 0;
	private latestMessageTime: number = 0;
	private interval: number = 1500;

	@ViewChild('modalElement') modalElement: ElementRef;

	// Load the chat dialog
	ngOnInit() {
		this.inputService.inputActivated.subscribe((messageSetup: any) => {
			this.messageSetup = messageSetup;
			console.log(messageSetup);
			// Limit textarea
			$('textarea').attr('maxlength', 256);

			// Check if friends?
			this.user.isFriend(this.messageSetup.receiver).subscribe(
				data => {
					if (data.data.toString() === 'true') {
						this.isFriend = true;
					} else {
						this.isFriend = false;
					}

					this.modal.handleModalToggle(this.modalElement.nativeElement, () => {
						this.close();
					})
				},
				err => this.modal.handleError('Arkadaslik kontrolunde bir sorun olustu', err)
			);

			var messageId;
			this.getMessagesID(this.messageSetup['type']);
		});
	}

	getMessagesID(messageType) {
		this.messageService.getMessageIdGivenFriend(this.messageSetup.receiver, this.global.username, messageType).subscribe(
			data => {
				this.isFirst = false;
				this.loadMessages(data.data);
			},
			error => {
				this.isFirst = true;
				console.error('NO MESSAGES YET', error);
			}
		);
	}

	// Close the modal, stop the checking
	close(isFirst?: boolean) {
		this.message = '';

		if (this.timedCheck) {
			this.timedCheck.unsubscribe();
		}

		window.clearTimeout(this.timeout);
		$(this.modalElement.nativeElement).modal('hide');
	}

	// Load all messages when the window is opened
	loadMessages(id) {
		this.messageService.getMessagesWithAFriend(this.messageSetup['messageId'] || id).subscribe(
			data => {
				this.messageSetup['messages'] = data.data.messages;
				let lastPos = this.messageSetup['messages'].length - 1;
				this.latestMessageTime = this.messageSetup['messages'][lastPos].date;
				this.checkMessages(id, this.latestMessageTime, this.interval);
				this.scrollDown();
			}, error => this.modal.handleError('Mesajlar ve istekler goruntulenirken bir sorun olustu', error)
		);
	}

	// When chat mode is on, check for the latest messages every second
	checkMessages(id, latestTime, interval) {
		this.timedCheck = this.messageService.getMessagesOnInterval(id, latestTime, interval).subscribe(data => {
			for (let newMessage of data.data) {
				this.messageSetup['messages'].push(newMessage);
				this.scrollDown();
			}

			// Update the latest time
			let lastPos = this.messageSetup['messages'].length - 1;
			this.latestMessageTime = this.messageSetup['messages'][lastPos].date;
			this.disableSending = false;

			// Stop itself and call it again with the newest parameters
			this.timedCheck.unsubscribe();
			this.checkMessages(id, this.latestMessageTime, interval);
		});
	}

	// Listen for enter button
	sendWithEnter(event) {
		if (this.message.length > 1 && !this.disableSending) {
			if (event.keyCode === 13) {
				this.sendChatMessage();
			}
		}
	}

	// Send a single chat message, then clean the input
	sendChatMessage() {
		if (this.message.length > 1) {
			this.messageService.sendMessage(this.message, this.messageSetup['receiver'], this.messageSetup['areceiver'], this.messageSetup['asender'], this.messageSetup['type']).subscribe(data => {
				this.disableSending = true;
				this.message = '';
				if (this.isFirst) {
					this.getMessagesID(this.messageSetup['type']);
				}
			});
		}
	}

	public openPopup: Function;

	setPopupAction(fn: any) {
		this.openPopup = fn;
	}

	scrollDown() {
		this.timeout = window.setTimeout(() => {
			var elem = document.getElementById('scrollMessages');
			elem.scrollBy(0, elem.scrollHeight + 100);
		}, 100);
	}
}
