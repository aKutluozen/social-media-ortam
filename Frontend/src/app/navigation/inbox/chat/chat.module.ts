// Modules
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Components
import { ChatComponent } from './chat.component';
import { ChatPageComponent } from './chat-page/chat.page.component';

// Services
import { ChatService } from './chat.service';

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule
	],
	exports: [
		ChatComponent
	],
	declarations: [
		ChatComponent,
		ChatPageComponent
	],
	providers: [
		ChatService
	]
})
export class ChatModule { }
