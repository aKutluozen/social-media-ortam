// Main modules
import { Component, OnInit, OnDestroy } from "@angular/core";

// Services
import { ModalService } from "app/modals/modal.service";
import { UserService } from "app/user/user.service";
import { AuthService } from "app/auth/auth.service";
import { GlobalService } from "app/globals.service";
import { PostService } from "app/posts/posts.service";
import { Subscription } from "rxjs";

@Component({
    selector: "app-notifications",
    templateUrl: "./notifications.component.html",
    styleUrls: ["./notifications.component.css"]
})
export class NotificationsComponent {
    constructor(
        private modal: ModalService,
        private user: UserService,
        private auth: AuthService,
        public global: GlobalService,
        private posts: PostService
    ) { }

    public notifications: object[] = [];
    private notificationOffset: number = 0;
    private skipNumber: number = 5;
    private notificationSubscription: Subscription;
    private postSubscription: Subscription;
    private userSubscription: Subscription;

    destroyAll() {
        this.notificationOffset = 0;
        this.notifications = [];
        if (this.notificationSubscription)
            this.notificationSubscription.unsubscribe();
        if (this.postSubscription) this.postSubscription.unsubscribe();
        if (this.userSubscription) this.userSubscription.unsubscribe();
    }

    loadAll() {
        this.notificationOffset = 0;
        this.notifications = [];
        this.load();
    }

    handleNotification(notification) {
        if (notification.action == 'complaint') {
            this.handleComplaint(notification);
        } else {
            this.showPost(notification._id, notification.post._id, notification.action, notification.user._id)
        }
    }

    handleComplaint(notification) {
        notification.data.text.complainer = notification.user.nickName;
        this.modal.showComplaintModal(notification.data.text);
    }

    removeComplaint(notification) {
        this.userSubscription = this.user
            .removeNotification(notification._id, notification.action, 123)
            .subscribe(
                data => {
                    for (let i = 0; i < this.notifications.length; i++) {
                        if (this.notifications[i]["_id"] == notification._id) {
                            this.notifications.splice(i, 1);
                        }
                    }
                },
                error => {
                    this.modal.handleError('Bildirim silinemedi!', error);
                }
            );
    }

    load() {
        this.notificationSubscription = this.user
            .getNotifications(this.notificationOffset)
            .subscribe(
                data => {
                    if (data.data.length == 0) {
                        this.notificationOffset -= this.skipNumber;
                    }
                    for (let item of data.data) {
                        if (item.action === "like") {
                            item.actionReadable = "paylasimini begendi";
                        } else if (item.action === "dislike") {
                            item.actionReadable = "paylasimini begenmedi";
                        } else if (item.action === "share") {
                            item.actionReadable = "paylasimini paylasti";
                        } else if (item.action === "comment") {
                            item.actionReadable = "paylasimini cevapladi";
                        } else if (item.action === "complaint") {
                            item.actionReadable = "sikayet!"
                        }

                        if (item.post != null || item.action == 'complaint') {
                            this.notifications.push(item);
                        }
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
        this.notificationOffset += this.skipNumber;
        this.load();
    }

    showPost(notificationId, id, action, user) {
        if (action != 'complaint') {
            this.postSubscription = this.posts.getOnePost(id).subscribe(
                data => {
                    data.data.postId = data.data._id;
                    data.data.profilePicture = data.data.user.profilePicture;

                    if (data.data.linkContent) {
                        data.data.linkContent = JSON.parse(data.data.linkContent);
                    }

                    this.modal.showPostViewModal(data.data);

                    // Remove it from inbox
                    this.userSubscription = this.user
                        .removeNotification(notificationId, action, user)
                        .subscribe(
                            data => {
                                for (let i = 0; i < this.notifications.length; i++) {
                                    if (this.notifications[i]["_id"] == notificationId) {
                                        this.notifications.splice(i, 1);
                                    }
                                }
                            },
                            error => { this.modal.handleError('Silemedik!', error); }
                        );
                },
                error => {
                    this.modal.handleError("Paylasimi gosterirken bir sorun olustu", error);
                }
            );
        }
    }
}
