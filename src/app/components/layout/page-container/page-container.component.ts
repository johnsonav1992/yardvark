import { Component, inject, input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'page-container',
  imports: [ButtonModule],
  templateUrl: './page-container.component.html',
  styleUrl: './page-container.component.scss'
})
export class PageContainerComponent {
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);

  public pageTitle = input.required<string>();
  public hideBackButton = input<boolean>(false);
  public gap = input<string>('1.5rem');

  public back() {
    this._router.navigate(['../'], {
      relativeTo: this._route,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }
}
