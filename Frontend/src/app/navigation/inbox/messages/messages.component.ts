// Main modules
import { Component, OnInit, OnDestroy, Input } from "@angular/core";

// Services
import { ModalService } from "app/modals/modal.service";
import { InboxService } from "app/navigation/inbox/inbox.service";
import { UserService } from "app/user/user.service";
import { AuthService } from "app/auth/auth.service";
import { GlobalService } from "app/globals.service";
import { Subscription } from "rxjs";

@Component({
	selector: "app-messages",
	templateUrl: "./messages.component.html",
	styleUrls: ["./messages.component.css"]
})
export class MessagesComponent {
	constructor(
		private modal: ModalService,
		private message: InboxService,
		private user: UserService,
		private auth: AuthService,
		public global: GlobalService
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
							item["read"] = item.initiatorRead;
							item["picture"] = item.initiated.profilePicture;
						} else {
							item["sender"] = item.initiated.nickName;
							item["receiver"] = item.initiator.nickName;
							item["read"] = item.initiatedRead;
							item["picture"] = item.initiator.profilePicture;
						}
						this.messages.push(item);
					}
				},
				error => {
					this.modal.handleError(
						"Mesajlar ve istekler goruntulenirken bir sorun olustu",
						error
					);
				}
			);
	}

	loadMore() {
		this.messageOffset += this.skipNumber;
		this.load();
	}

	// Turn on the answering modal
	answerMessage(receiver, id) {
		this.modal.showInputModal({
			type: "chat",
			title: "Mesaj gonder",
			receiver: receiver,
			messageId: id
		});

		this.inboxSubscription = this.user.markInbox(id).subscribe(
			data => { },
			error => {
				this.modal.handleError(
					"Mesajlar ve istekler goruntulenirken bir sorun olustu",
					error
				);
			}
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
			content: "Bu mesaji silmek istediginize emin misiniz?",
			itemToBeDeleted: this.message,
			itemCollection: this.messages,
			approveFunction: (message, collection) => {
				this.messageSubscription = message.deleteMessage(id).subscribe(
					data => {
						for (let i = 0; i < collection.length; i++) {
							if (collection[i]["_id"] === id) {
								collection.splice(i, 1);
							}
						}
						this.modal.handleWarning("Mesaj silindi!");
					},
					error => {
						this.modal.handleError("Mesaj silinemedi", error);
					}
				);
			}
		});
	}
}
