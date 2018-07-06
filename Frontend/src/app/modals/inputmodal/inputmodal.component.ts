// Main modules
import { Component, OnInit } from '@angular/core';

// Services
import { ModalService } from '../modal.service';
import { InboxService } from 'app/navigation/inbox/inbox.service';
import { GlobalService } from '../../globals.service';
import { UserService } from '../../user/user.service';

@Component({
	selector: 'app-inputmodal',
	templateUrl: './inputmodal.component.html',
	styleUrls: ['./inputmodal.component.css']
})
export class InputmodalComponent implements OnInit {

	constructor(
		private inputService: ModalService,
		private messageService: InboxService,
		private modal: ModalService,
		private global: GlobalService,
		private user: UserService
	) { }

	public display: string = 'none';
	public message: string = '';
	public messageSetup: any = {};
	public disableSending: boolean = false;
	public isFirstMessage: boolean = false;

	private isFriend: boolean = false;
	private timedCheck: any = 0;
	private latestMessageTime: number = 0;
	private interval: number = 1500;

	// Load the chat dialog
	ngOnInit() {
		this.inputService.inputActivated.subscribe((messageSetup: any) => {
			this.messageSetup = messageSetup;
			this.display = 'block';
			// Check if friends?
			this.user.isFriend(this.messageSetup.receiver).subscribe(
				isFriend => {
					if (isFriend === 'true') {
						this.isFriend = true;
					} else {
						this.isFriend = false;
					}
					console.log('Is friend??? ', this.isFriend);
				},
				err => console.log('ERRRORRR', err)
			)

			if (this.messageSetup['type'] === 'chat') {
				this.loadMessages(this.messageSetup['messageId']);
				this.isFirstMessage = false;
			} else {
				this.isFirstMessage = true;
			}
		});
	}

	// Close the modal, stop the checking
	close(isFirst?: boolean) {
		this.message = '';
		this.display = 'none';
		if (isFirst === false) {
			this.timedCheck.unsubscribe();
		}
	}

	// Load all messages when the window is opened
	loadMessages(id) {
		this.messageService.getMessagesWithAFriend(this.messageSetup['messageId']).subscribe(
			data => {
				this.messageSetup['messages'] = data.data.messages;
				let lastPos = this.messageSetup['messages'].length - 1;
				this.latestMessageTime = this.messageSetup['messages'][lastPos].date;
				this.checkMessages(id, this.latestMessageTime, this.interval);
			}, error => {
				this.modal.handleError('Mesajlar ve istekler goruntulenirken bir sorun olustu', error);
			});
	}

	// When chat mode is on, check for the latest messages every second
	checkMessages(id, latestTime, interval) {
		this.timedCheck = this.messageService.getMessagesOnInterval(id, latestTime, interval).subscribe(data => {
			for (let newMessage of data.data) {
				this.messageSetup['messages'].push(newMessage);
			}

			// Update the latest time
			let lastPos = this.messageSetup['messages'].length - 1;
			this.latestMessageTime = this.messageSetup['messages'][lastPos].date;
			this.disableSending = false;
			this.scrollDown();

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
							this.user.adjustCredit(this.global.name, 10, false).subscribe(data => { }, err => console.log(err));
						}
					}
					this.close(true);
				},
				error => {
					this.modal.handleError('Mesaj gonderilemedi.', error);
				});
		}
	}

	// Listen for enter button
	sendWithEnter(event) {
		if (this.message.length > 1 && !this.disableSending) {
			if (event.keyCode === 13) {
				if (!this.isFirstMessage) {
					//if (this.isFriend) {
						this.sendChatMessage();
					//}
				} else {
					if (this.isFriend && this.global.credit >= 10) {
						this.sendFirstMessage();
					}
				}
			}
		}
	}

	// Send a single chat message, then clean the input
	sendChatMessage() {
		if (this.message.length > 1) {
			if (this.isFriend) {
				this.messageService.sendMessage(this.message, this.messageSetup['receiver'], 'chat').subscribe(data => {
					if (!this.isFriend) {
						this.user.adjustCredit(this.global.name, 10, false).subscribe(data => { }, err => console.log(err));
					}
					this.disableSending = true;
					this.message = '';
				});
			}
		}
	}

	scrollDown() {
		if (!this.isFirstMessage) {
			window.setTimeout(() => {
				document.getElementById("scrollThis").scrollBy(0, document.getElementById("scrollThis").scrollHeight + 100);
			}, 100);
		}
	}
}
