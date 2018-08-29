// Modules
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Components
import { ChatComponent } from './chat.component';

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
		ChatComponent
	],
	providers: [
		ChatService
	]
})
export class ChatModule { }
