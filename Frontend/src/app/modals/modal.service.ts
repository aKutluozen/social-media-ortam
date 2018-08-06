// Main modules
import { EventEmitter, Injectable } from "@angular/core";
import { AuthService } from "app/auth/auth.service";
import * as $ from 'jquery';

declare var $: any;

@Injectable()
export class ModalService {

    constructor(private auth: AuthService) { }

    // Emitters
    public errorOccurred = new EventEmitter<string>();
    public imageShowed = new EventEmitter<string>();
    public inputActivated = new EventEmitter<Object>();
    public warningOccurred = new EventEmitter<string>();
    public userModalActivated = new EventEmitter<Object>();
    public questionModalActivated = new EventEmitter<Object>();
    public postModalActivated = new EventEmitter<Object>();
    public postModalViewActivated = new EventEmitter<Object>();
    public complaintModalActivated = new EventEmitter<Object>();

    handleModalToggle(element, closingAction) {
        // Handle showing
        $(element).modal('show');
        // Handle closing event
        $(element).on('hidden.bs.modal', (e) => {
            closingAction();
        });
    }

    // Invoking functions
    handleError(error: string, errorResponse) {
        this.errorOccurred.emit(error);

        // Logout the user if token is expired
        if (errorResponse.error) {
            if (errorResponse.error.name == 'TokenExpiredError') {
                this.auth.logout();
                location.reload();
            }
        }
        if (this.auth.getCookie('token') == '' || this.auth.getCookie('token') == 'undefined') {
            this.auth.logout();
            location.reload();
        }
    }

    showComplaintModal(complaint: Object) {
        this.complaintModalActivated.emit(complaint);
    }

    showPostModal(postSetup: Object) {
        this.postModalActivated.emit(postSetup);
    }

    showPostViewModal(postViewSetup: Object) {
        this.postModalViewActivated.emit(postViewSetup);
    }

    showImageInModal(imageUrl: string) {
        this.imageShowed.emit(imageUrl);
    }

    showInputModal(messageSetup: Object) {
        this.inputActivated.emit(messageSetup);
    }

    showQuestion(questionSetup: Object) {
        this.questionModalActivated.emit(questionSetup);
    }

    showUserModal(user: Object) {
        this.userModalActivated.emit(user);
    }

    handleWarning(message: string) {
        this.warningOccurred.emit(message);
    }
}