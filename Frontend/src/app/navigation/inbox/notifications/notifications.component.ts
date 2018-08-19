// Main modules
import { Component, OnInit, OnDestroy } from '@angular/core';
import * as Entities from 'html-entities';

// Services
import { ModalService } from 'app/modals/modal.service';
import { UserService } from 'app/user/user.service';
import { AuthService } from 'app/auth/auth.service';
import { GlobalService } from 'app/globals.service';
import { PostService } from 'app/posts/posts.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-notifications',
    templateUrl: './notifications.component.html'
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
    private entities = new Entities.XmlEntities();

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
        } else if (notification.action.substring(0, 6) == 'credit') {
            this.handleCredit(notification);
        } else if (notification.action == 'received') {
            this.modal.handleWarning('Tebrikler! Biriktirmeye ve harcamaya devam!');
            this.removeComplaint(notification);
        } else if (notification.action == 'lost' || notification.action == 'accepted') {
            this.removeComplaint(notification);
        } else {
            this.showPost(notification._id, notification.post._id, notification.action, notification.user._id)
        }
    }

    removeCreditRequest(notification) {
        this.removeComplaint(notification);
    }

    handleCredit(notification) {
        var actionExplanation = notification.user.nickName + ' sizden ' + notification.data + ' kredi istiyor.';
        var creditAmount = parseInt(notification.data);
        this.modal.showQuestion({
            content: actionExplanation + ' Bu islemi gerceklestirmek istediginizden emin misiniz?',
            approveFunction: () => {
                if (this.global.credit >= creditAmount) {
                    var adjustingOwnCredit = new Promise((resolve, reject) => {
                        this.user.adjustCredit(this.global.username, creditAmount, false).subscribe(
                            data => resolve('this credit adjusted'),
                            error => reject('this credit could not be adjusted')
                        );
                    });

                    var adjustingOtherCredit = new Promise((resolve, reject) => {
                        this.user.adjustCredit(notification.user.nickName, creditAmount, true).subscribe(
                            data => resolve('other credit adjusted'),
                            error => reject('other credit could not be adjusted')
                        );
                    });

                    Promise.all([adjustingOwnCredit, adjustingOtherCredit]).then(values => {
                        this.modal.handleWarning(notification.data + ' kredi verdiniz! ');
                        this.removeComplaint(notification);
                    }).catch(error => this.modal.handleError('Kredi verirken bir sorun olustu', error));
                } else {
                    this.modal.handleError('Yeterince krediniz yok. Borclu ciktiniz :) ', {});
                }
            }
        });
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
                        if (this.notifications[i]['_id'] == notification._id) {
                            this.notifications.splice(i, 1);
                        }
                    }
                },
                error => this.modal.handleError('Bildirim silinemedi!', error)
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
                        if (item.action === 'like') {
                            item.actionReadable = 'paylasimini begendi';
                        } else if (item.action === 'dislike') {
                            item.actionReadable = 'paylasimini begenmedi';
                        } else if (item.action === 'share') {
                            item.actionReadable = 'paylasimini paylasti';
                        } else if (item.action === 'comment') {
                            item.actionReadable = 'paylasimini cevapladi';
                        } else if (item.action === 'complaint') {
                            item.actionReadable = 'sikayet var!'
                            // } else if (item.action === 'credit_sending') {
                            //     item.actionReadable = 'kredi yolladi!'
                        } else if (item.action === 'credit_asking') {
                            item.actionReadable = 'kredi istedi!'
                        } else if (item.action === 'received') {
                            item.actionReadable = 'kredi aldiniz!';
                        } else if (item.action === 'lost') {
                            item.actionReadable = 'krediniz gitti';
                        } else if (item.action === 'accepted') {
                            item.actionReadable = 'arkadasiniz oldu!';
                        }

                        if (item.post != null || item.action == 'complaint' || item.action.substring(0, 6) == 'credit' || item.action == 'received' || item.action == 'lost' || item.action == 'accepted') {
                            this.notifications.push(item);
                        }
                    }
                },
                error => this.modal.handleError('Mesajlar ve istekler goruntulenirken bir sorun olustu', error)
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
                        data.data.linkContent = this.entities.decode(data.data.linkContent);
                        // data.data.linkContent = data.data.linkContent.replace(/&quot;/g, '\"');
                        data.data.linkContent = JSON.parse(data.data.linkContent);
                    }

                    this.modal.showPostViewModal(data.data);

                    // Remove it from inbox
                    this.userSubscription = this.user
                        .removeNotification(notificationId, action, user)
                        .subscribe(
                            data => {
                                for (let i = 0; i < this.notifications.length; i++) {
                                    if (this.notifications[i]['_id'] == notificationId) {
                                        this.notifications.splice(i, 1);
                                    }
                                }
                            },
                            error => this.modal.handleError('Silemedik!', error)
                        );
                },
                error => this.modal.handleError('Paylasimi gosterirken bir sorun olustu', error)
            );
        }
    }
}
