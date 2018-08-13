import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChatService } from './chat.service';
import { AuthService } from 'app/auth/auth.service';
import { GlobalService } from 'app/globals.service';
import { ModalService } from '../../../modals/modal.service';
import * as $ from 'jquery';

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
	public room: string = 'genel';
	public rooms: object[] = [];
	public reason: string = '';
	public isExpanded: boolean = false;
	private name: string = this.auth.getCookie('chatNickName');
	private picture: string = this.global.profilePicture;
	private selectedRoom: object = {};
	private messageTimeout: boolean = false;

	constructor(
		private chatService: ChatService,
		private auth: AuthService,
		public global: GlobalService,
		private modal: ModalService
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
			content: 'Bu odaya girmeden once asagidaki kurallari kabul etmelisiniz: <br>' + this.selectedRoom['rules'],
			approveFunction: () => {
				this.selectedRoom['canEnter'] = true;
				this.chatService.selectRoom(this.selectedRoom).subscribe(
					data => {
						window['$']('#navbarButton').click();
						window['$']('#chatMenu').click();
						this.messages = [];
					},
					error => {
						this.modal.handleError('Yasak!', error);
						this.selectedRoom = {};
					}
				)
			}
		});
	}

	expandChat() {
		this.isExpanded = !this.isExpanded;
	}

	sendMessage() {
		if (!this.messageTimeout) {
			if (!this.global.banned) {
				if (this.message !== '' && this.message !== ' ' && this.selectedRoom['canEnter'] == true) {
					this.chatService.sendMessage({
						message: this.message,
						color: this.color,
						name: this.name,
						picture: this.global.profilePicture,
						date: Date.now(),
						room: this.selectedRoom
					});
					this.scrollDown();
					this.message = '';

					this.messageTimeout = true;
					window.setTimeout(() => { this.messageTimeout = false; }, 2000);
				}
			} else {
				this.modal.handleError('Sohbetten kovuldunuz!', { error: '', message: 'banned' });
			}
		}
	}

	sendWithEnter(event) {
		if (event.keyCode === 13 && !event.shiftKey) {
			event.preventDefault();
			this.sendMessage();
		}
	}

	complain(message) {
		message.room = this.selectedRoom;
		message.reason = this.reason;
		message.complainer = this.global.username;

		this.chatService.sendComplaint(message).subscribe(
			res => {
				for (let msg of this.messages) {
					if (msg['text']['message'] == message.text.message) {
						msg['complaintStatus'] = 'Sikayet gonderildi';
					}
				}
			},
			err => this.modal.handleError('Sikayet gonderilirken bir sorun olustu', err)
		);

		this.reason = '';
	}

	ngOnInit() {
		// Limit textarea
		this.connection = this.chatService.getMessages().subscribe(message => {
			if (message['text']['room'].name === this.selectedRoom['name']) {
				this.messages.push(message);
			}
			this.scrollDown();
		});

		this.chatService.selectRoom(this.room).subscribe(
			data => $('textarea').attr('maxlength', 256),
			error => this.modal.handleError('Odaya girilirken bir sorun olustu', error)
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
	}

	scrollDown() {
		window.setTimeout(() => {
			document.getElementById("scrollThis").scrollBy(0, document.getElementById("scrollThis").scrollHeight + 100);
		}, 100);
	}
}
