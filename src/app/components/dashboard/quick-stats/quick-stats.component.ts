import { Component } from '@angular/core';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'quick-stats',
  imports: [CardModule],
  templateUrl: './quick-stats.component.html',
  styleUrl: './quick-stats.component.scss'
})
export class QuickStatsComponent {}
