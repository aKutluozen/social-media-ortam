import { Component, Input, Output } from '@angular/core';

@Component({
	selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
    @Input() postListRefToSidebar;
 }
