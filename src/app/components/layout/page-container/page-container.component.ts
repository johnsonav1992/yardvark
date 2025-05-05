import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  contentChild,
  inject,
  input,
  TemplateRef
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'page-container',
  imports: [ButtonModule, NgTemplateOutlet],
  templateUrl: './page-container.component.html',
  styleUrl: './page-container.component.scss'
})
export class PageContainerComponent {
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);

  public pageTitle = input.required<string>();
  public hideBackButton = input<boolean>(false);
  public gap = input<string>('1.5rem');

  public action1 = contentChild<TemplateRef<any> | null>('action1');
  public action2 = contentChild<TemplateRef<any> | null>('action2');

  public back() {
    this._router.navigate(['../'], {
      relativeTo: this._route,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }
}
