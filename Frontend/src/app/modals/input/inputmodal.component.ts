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
	public isFirstMessage: boolean = false;
	public isFriend: boolean = false;

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

			if (this.messageSetup['type'] === 'chat') {
				// Somehow, add the message id here if it not already there.
				var messageId;
				this.messageService.getMessageIdGivenFriend(this.messageSetup.receiver, this.global.username).subscribe(
					data => {
						this.loadMessages(data.data);
						this.isFirstMessage = false;
					},
					error => {
						this.isFirstMessage = true;
						console.error(error);
					}
				);
			}
		});
	}

	// Close the modal, stop the checking
	close(isFirst?: boolean) {
		this.message = '';

		if (!this.isFirstMessage && this.timedCheck) {
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

	// Sending a single message the first time
	sendFirstMessage() {
		if (this.message.length > 1) {
			let type = 'first';
			this.messageService.sendMessage(this.message, this.messageSetup['receiver'], type).subscribe(
				data => {
					if (type !== 'chat') {
						this.modal.handleWarning('Mesaj basariyla gonderildi!');
						if (!this.isFriend) {
							this.user.adjustCredit(this.global.username, 10, false).subscribe(data => { this.close(); }, err => console.error(err));
						}
					}
				},
				error => this.modal.handleError('Mesaj gonderilemedi.', error)
			);
		}
	}

	// Listen for enter button
	sendWithEnter(event) {
		if (this.message.length > 1 && !this.disableSending) {
			if (event.keyCode === 13) {
				if (!this.isFirstMessage) {
					this.sendChatMessage();
				} else if (this.isFriend && this.global.credit >= 10) {
					this.sendFirstMessage();
				}
			}
		}
	}

	// Send a single chat message, then clean the input
	sendChatMessage() {
		if (this.message.length > 1) {
			if (this.isFriend) {
				this.messageService.sendMessage(this.message, this.messageSetup['receiver'], 'chat').subscribe(data => {
					this.disableSending = true;
					this.message = '';
				});
			} else if (!this.isFriend && this.global.credit >= 10) {
				this.messageService.sendMessage(this.message, this.messageSetup['receiver'], 'chat').subscribe(data => {
					if (!this.isFriend) {
						this.user.adjustCredit(this.global.username, 10, false).subscribe(data => { if (this.isFirstMessage) this.close(); }, err => console.error(err));
					}
					this.disableSending = true;
					this.message = '';
				});
			}
		}
	}

	public openPopup: Function;

	setPopupAction(fn: any) {
		this.openPopup = fn;
	}

	scrollDown() {
		if (!this.isFirstMessage) {
			this.timeout = window.setTimeout(() => {
				var elem = document.getElementById('scrollMessages');
				elem.scrollBy(0, elem.scrollHeight + 100);
			}, 100);
		}
	}
}
