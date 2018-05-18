import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChatService } from './chat.service';
import { AuthService } from 'app/auth/auth.service';
import { GlobalService } from 'app/globals.service';
import { ModalService } from '../../../modals/modal.service';

@Component({
	selector: 'app-chat',
	templateUrl: './chat.component.html',
	styleUrls: ['./chat.component.css']
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
	private name: string = this.auth.getCookie('user');
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
			approveFunction: (post, collection, service) => {
				this.selectedRoom['canEnter'] = true;
				this.chatService.selectRoom(this.selectedRoom).subscribe(
					data => {
						this.messages = [];
					},
					error => {
						this.modal.handleError('Yasak!', error);
						this.selectedRoom = {};
						console.log('Error', error);
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
						date: Date.now()
					});
					this.scrollDown();
					this.message = '';

					this.messageTimeout = true;
					window.setTimeout(() => { this.messageTimeout = false; }, 2000);
				}
			} else {
				this.modal.handleError('Sohbetten kovuldunuz!', {});
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
		message.complainer = this.global.name;

		this.chatService.sendComplaint(message).subscribe(
			res => {
				// Mark it
				for (let msg of this.messages) {
					if (msg['text']['message'] == message.text.message) {
						msg['complaintStatus'] = 'Sikayet gonderildi';
					}
				}
			},
			err => { console.log(err); }
		);

		this.reason = '';
	}

	ngOnInit() {
		this.connection = this.chatService.getMessages().subscribe(message => {
			this.messages.push(message);
			this.scrollDown();
		});
		this.chatService.selectRoom(this.room).subscribe(
			data => {
			},
			error => {
				console.log(error);
			}
		);

		this.chatService.getRooms().subscribe(
			rooms => { this.rooms = rooms.rooms; console.log(this.rooms); },
			err => console.error(err)
		);

		this.chatService.getNumbers().subscribe(
			data => console.log(data),
			error => console.log(error)
		);
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
