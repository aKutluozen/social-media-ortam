import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChatService } from './chat.service';
import { AuthService } from 'app/auth/auth.service';
import { GlobalService } from 'app/globals.service';
import { ModalService } from '../../../modals/modal.service';
import * as $ from 'jquery';
import { MultiLanguageService } from '../../../language.service';

@Component({
	selector: 'app-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
	public messages: object[] = [];
	private connection: any;
	public message: any = '';
	public color: string = '';
	public room: string = '';
	public roomToBeEntered: string = '';
	public rooms: object[] = [];
	public reason: string = '';
	private chatNickName: string = this.auth.getCookie('chatNickName');
	private nickName: string = this.auth.getCookie('user');
	private selectedRoom: object = {};
	private messageTimeout: boolean = false;
	private timeout: any = 0;

	constructor(
		private chatService: ChatService,
		private auth: AuthService,
		public global: GlobalService,
		private modal: ModalService,
		public lang: MultiLanguageService
	) { }

	selectRoom(roomName) {
		for (let room of this.rooms) {
			room['canEnter'] = false; // get the user out of all the rooms
			if (room['name'] === roomName) {
				this.selectedRoom = room;
			}
			this.messages = [];
		}

		this.modal.showQuestion({
			content: this.lang.text.chat.acceptRoomRules + '<br>' + this.selectedRoom['rules'],
			approveFunction: () => {
				this.selectedRoom['canEnter'] = true;
				this.chatService.selectRoom(this.selectedRoom).subscribe(
					data => {
						window['$']('#navbarButton').click();
						window['$']('#chatMenu').click();
						this.messages = [];
						this.room = roomName;
						this.global.sendGoogleEvent('chat', 'room-selected', roomName);
					},
					error => {
						this.modal.handleError('Yasak!', error);
						this.selectedRoom = {};
					}
				)
			}
		});
	}

	sendMessage() {
		if (!this.messageTimeout) {
			if (!this.global.banned) {
				if (this.message !== '' && this.message !== ' ' && this.selectedRoom['canEnter'] == true) {
					this.chatService.sendMessage({
						message: this.message,
						color: this.color,
						nickName: this.nickName,
						chatNickName: this.chatNickName,
						room: this.selectedRoom
					});
					this.scrollDown();
					this.message = '';

					this.messageTimeout = true;
					this.timeout = window.setTimeout(() => { this.messageTimeout = false; }, 2000);
				}
			} else {
				this.modal.handleError(this.lang.text.chat.youAreBanned, { error: '', message: 'banned' });
			}
		}
	}

	sendWithEnter(event) {
		if (event.keyCode === 13 && !event.shiftKey) {
			event.preventDefault();
			this.sendMessage();
		}
	}

	startPrivateConvo(receiver, areceiver) {
		this.modal.showInputModal({
			type: 'anonym-chat',
			title: 'Mesaj gonder',
			receiver: receiver,
			areceiver: areceiver,
			asender: this.chatNickName,
			sender: this.nickName
		});
	}

	complain(message) {
		message.room = this.selectedRoom;
		message.reason = this.reason;
		message.complainer = this.global.username;

		this.chatService.sendComplaint(message).subscribe(
			res => {
				for (let msg of this.messages) {
					if (msg['text']['message'] == message.text.message) {
						msg['complaintStatus'] = this.lang.text.chat.complaintSent;
					}
				}
			},
			err => this.modal.handleError(this.lang.text.errors.sendComplaint, err)
		);

		this.reason = '';
	}

	ngOnInit() {
		// Limit textarea
		this.connection = this.chatService.getMessages().subscribe(message => {
			if (message['text']['room'].name === this.selectedRoom['name']) {
				this.messages.push(message);
				this.messages = this.messages.slice(-100); // Keep only last 100
			}
			this.scrollDown();
		});

		this.chatService.selectRoom(this.room).subscribe(
			data => $('textarea').attr('maxlength', 256),
			error => this.modal.handleError(this.lang.text.errors.enteringChatRoom, error)
		);

		this.chatService.getRooms().subscribe(
			rooms => { this.rooms = rooms.data; },
			err => console.error(err)
		);
	}

	public openPopup: Function;

	setPopupAction(fn: any) {
		this.openPopup = fn;
	}

	ngOnDestroy() {
		this.connection.unsubscribe();
		window.clearTimeout(this.timeout);
	}

	scrollDown() {
		this.timeout = window.setTimeout(() => {
			document.getElementById("scrollThis").scrollBy(0, document.getElementById("scrollThis").scrollHeight + 100);
		}, 100);
	}
}
