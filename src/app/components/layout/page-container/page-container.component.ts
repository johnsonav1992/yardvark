import { Component, input } from '@angular/core';

@Component({
  selector: 'page-container',
  imports: [],
  templateUrl: './page-container.component.html',
  styleUrl: './page-container.component.scss'
})
export class PageContainerComponent {
  public pageTitle = input.required<string>();
}
