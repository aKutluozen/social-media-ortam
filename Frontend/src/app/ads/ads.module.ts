// Modules
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Routes, RouterModule } from "@angular/router";

// Components
import { AdsComponent } from './ads.component';

// Routes
const POST_ROUTES: Routes = [
	{ pathMatch: 'full', path: 'all', component: AdsComponent } // FIX THIS SO EVERY PAGE IS ACCESSIBLE
];

@NgModule({
	imports: [
		CommonModule,
		FormsModule,
		ReactiveFormsModule,
		RouterModule.forChild(POST_ROUTES)
	],
	exports: [
		RouterModule,
		AdsComponent
	],
	declarations: [
		AdsComponent
	],
	providers: [
		
	]
})
export class AdsModule { }
