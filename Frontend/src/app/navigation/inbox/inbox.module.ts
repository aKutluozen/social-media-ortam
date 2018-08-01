// Modules
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ChatModule } from './chat/chat.module';


// Components
import { MessagesComponent } from './messages/messages.component';
import { RequestsComponent } from './requests/requests.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { InboxComponent } from './inbox.component';

@NgModule({
	imports: [
		CommonModule,
		ReactiveFormsModule,
		FormsModule,
		ChatModule
	],
	exports: [
		InboxComponent,
		MessagesComponent,
		RequestsComponent,
		NotificationsComponent
	],
	declarations: [
		InboxComponent,
		MessagesComponent,
		RequestsComponent,
		NotificationsComponent
	]
})
export class InboxModule { }
