// Main modules
import { Component, OnInit, OnDestroy, Input } from "@angular/core";

// Services
import { ModalService } from "app/modals/modal.service";
import { InboxService } from "app/navigation/inbox/inbox.service";
import { UserService } from "app/user/user.service";
import { AuthService } from "app/auth/auth.service";
import { GlobalService } from "app/globals.service";
import { Subscription } from "rxjs";
import { MultiLanguageService } from "../../../language.service";

@Component({
	selector: "app-messages",
	templateUrl: "./messages.component.html"
})
export class MessagesComponent {
	constructor(
		private modal: ModalService,
		private message: InboxService,
		private user: UserService,
		private auth: AuthService,
		public global: GlobalService,
		public lang: MultiLanguageService
	) { }

	public messages: object[] = [];

	private messageOffset: number = 0;
	private skipNumber: number = 5;
	private messageSubscription: Subscription;
	private inboxSubscription: Subscription;

	loadAll() {
		this.messageOffset = 0;
		this.messages = [];
		this.load();
		this.global.sendGoogleEvent('messages', 'messages-viewed', 'messaging');
	}

	destroyAll() {
		this.messageOffset = 0;
		this.messages = [];
		if (this.messageSubscription) this.messageSubscription.unsubscribe();
		if (this.inboxSubscription) this.inboxSubscription.unsubscribe();
	}

	load() {
		this.messageSubscription = this.message
			.getMessagesInGeneral(this.messageOffset)
			.subscribe(
				data => {
					if (data.data.length == 0) {
						this.messageOffset -= this.skipNumber;
					}

					for (let item of data.data) {
						if (item.initiator.nickName === this.auth.getCookie("user")) {
							item["sender"] = item.initiator.nickName;
							item["receiver"] = item.initiated.nickName;
							item['areceiver'] = item.initiated.chatNickName;
							item['asender'] = item.initiator.chatNickName;
							item["read"] = item.initiatorRead;
							item["picture"] = item.initiated.profilePicture;
						} else {
							item["sender"] = item.initiated.nickName;
							item["receiver"] = item.initiator.nickName;
							item['areceiver'] = item.initiator.chatNickName;
							item['asender'] = item.initiated.chatNickName;
							item["read"] = item.initiatedRead;
							item["picture"] = item.initiator.profilePicture;
						}
						item['isAnonym'] = item.isAnonym;
						this.messages.push(item);
					}
				},
				error => this.modal.handleError(this.lang.text.errors.inbox, error)
			);
	}

	loadMore() {
		this.messageOffset += this.skipNumber;
		this.load();
	}

	answerAnonymChat(receiver, areceiver, asender, id) {
		this.modal.showInputModal({
			type: "anonym-chat",
			title: this.lang.text.general.anonymChat,
			receiver: receiver,
			areceiver: areceiver,
			asender: asender,
			messageId: id
		});
	}

	// Turn on the answering modal
	answerMessage(receiver, id) {
		this.modal.showInputModal({
			type: "chat",
			title: this.lang.text.general.sendMessage,
			receiver: receiver,
			messageId: id
		});

		this.inboxSubscription = this.user.markInbox(id).subscribe(
			data => { },
			error => this.modal.handleError(this.lang.text.errors.inbox, error)
		);

		// Mark it in the front end for class to disappear
		for (let message of this.messages) {
			if (message["_id"] === id) {
				message["read"] = true;
			}
		}
	}

	// Deletes it only for the rejecting person for now
	deleteMessage(id) {
		this.modal.showQuestion({
			content: this.lang.text.question.deleteMessage,
			approveFunction: () => {
				this.messageSubscription = this.message.deleteMessage(id).subscribe(
					data => {
						for (let i = 0; i < this.messages.length; i++) {
							if (this.messages[i]["_id"] === id) {
								this.messages.splice(i, 1);
							}
						}
					},
					error => this.modal.handleError(this.lang.text.errors.deletingAnswer, error)
				);
			}
		});
	}
}
