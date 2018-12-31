// Modules
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from "@angular/router";
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared.module';

// Components
import { SignupComponent } from './signup/signup.component';
import { SigninComponent } from './signin/signin.component';

// Route protection
import { AuthGuard } from "./auth.guard";

// Routes
const AUTH_ROUTES: Routes = [
	{ path: '', redirectTo: 'profile/me', pathMatch: 'full' },
    { path: 'signin', component: SigninComponent },
	{ path: 'signup', component: SignupComponent }
];

@NgModule({
	imports: [
		RouterModule.forChild(AUTH_ROUTES),
		CommonModule,
		ReactiveFormsModule,
		FormsModule,
		SharedModule
	],
	exports: [
		RouterModule
	],
	declarations: [
		SignupComponent,
		SigninComponent
	],
	providers: [
		AuthGuard
	]
})
export class AuthModule { }
