import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ProductSmallCardComponent } from '../../products/product-small-card/product-small-card.component';

@Component({
  selector: 'recent-entry',
  imports: [CardModule, ProductSmallCardComponent],
  templateUrl: './recent-entry.component.html',
  styleUrl: './recent-entry.component.scss'
})
export class RecentEntryComponent {}
