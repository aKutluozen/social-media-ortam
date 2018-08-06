import { Component, Input, Output } from '@angular/core';

@Component({
	selector: 'app-sidebar',
    templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
    @Input() postListRefToSidebar;
 }
