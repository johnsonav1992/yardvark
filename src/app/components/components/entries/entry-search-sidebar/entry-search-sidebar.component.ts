import { Component, model } from '@angular/core';
import { DrawerModule } from 'primeng/drawer';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'entry-search-sidebar',
  imports: [IconFieldModule, InputIconModule, InputTextModule, DrawerModule],
  templateUrl: './entry-search-sidebar.component.html',
  styleUrl: './entry-search-sidebar.component.scss'
})
export class EntrySearchSidebarComponent {
  public isOpen = model(false);
}
