// Main modules
import { EventEmitter, Injectable } from "@angular/core";
import { AuthService } from "app/auth/auth.service";
import * as $ from 'jquery';

declare var $: any;

@Injectable()
export class ModalService {

    constructor(private auth: AuthService) { 
        // Handle modal on modal
		$(document).on('show.bs.modal', '.modal', function (event) {
			var zIndex = 1040 + (10 * $('.modal:visible').length);
			$(this).css('z-index', zIndex);
			setTimeout(function () {
				$('.modal-backdrop').not('.modal-stack').css('z-index', zIndex - 1).addClass('modal-stack');
			}, 0);
		});
    }

    // Emitters
    public errorOccurred = new EventEmitter<Object>();
    public imageShowed = new EventEmitter<string>();
    public inputActivated = new EventEmitter<Object>();
    public warningOccurred = new EventEmitter<string>();
    public userModalActivated = new EventEmitter<Object>();
    public questionModalActivated = new EventEmitter<Object>();
    public postModalActivated = new EventEmitter<Object>();
    public postModalViewActivated = new EventEmitter<Object>();
    public complaintModalActivated = new EventEmitter<Object>();
    public creditModalActivated = new EventEmitter<Object>();

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
        var errorObj = {
            message: error,
            error: errorResponse
        }
        
        this.errorOccurred.emit(errorObj);

        // Logout the user if token is expired
        if (errorResponse.error) {
            if (errorResponse.error.name == 'TokenExpiredError' || errorResponse.error.name == 'JsonWebTokenError') {
                this.auth.logout();
                // location.reload();
            }
        }
        
        if (this.auth.getCookie('token') == '' || this.auth.getCookie('token') == 'undefined') {
            this.auth.logout();
            // location.reload();
        }
    }

    showComplaintModal(complaint: Object) {
        this.complaintModalActivated.emit(complaint);
    }

    showCreditModal(creditInfo: Object) {
        this.creditModalActivated.emit(creditInfo);
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