import { Location } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'page-container',
  imports: [ButtonModule],
  templateUrl: './page-container.component.html',
  styleUrl: './page-container.component.scss'
})
export class PageContainerComponent {
  private _location = inject(Location);

  public pageTitle = input.required<string>();
  public hideBackButton = input<boolean>(false);

  public back() {
    this._location.back();
  }
}
