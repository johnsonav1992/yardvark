import { Component, computed, inject, signal } from '@angular/core';
import {
  CalendarMarkerData,
  EntriesCalendarComponent
} from '../../components/entries-calendar/entries-calendar.component';
import { ButtonModule } from 'primeng/button';
import { ButtonDesignTokens } from '@primeng/themes/types/button';
import { httpResource } from '@angular/common/http';
import { apiUrl } from '../../utils/httpUtils';
import { injectUserData } from '../../utils/authUtils';
import { endOfMonth, startOfMonth } from 'date-fns';
import { Entry } from '../../types/entries.types';
import { getEntryIcon } from '../../utils/entriesUtils';
import { TooltipModule } from 'primeng/tooltip';
import { Router, RouterOutlet } from '@angular/router';
import { DialogService } from 'primeng/dynamicdialog';
import { EntryDialogComponent } from '../../components/entry-dialog/entry-dialog.component';
import { EntryDialogFooterComponent } from '../../components/entry-dialog/entry-dialog-footer/entry-dialog-footer.component';

@Component({
  selector: 'entry-log',
  imports: [
    EntriesCalendarComponent,
    ButtonModule,
    TooltipModule,
    RouterOutlet
  ],
  templateUrl: './entry-log.component.html',
  styleUrl: './entry-log.component.scss',
  providers: [DialogService]
})
export class EntryLogComponent {
  private _router = inject(Router);
  private _dialogService = inject(DialogService);

  public user = injectUserData();

  public entries = httpResource<Entry[]>(() =>
    this.user()
      ? apiUrl('entries', {
          params: [this.user()!.sub || ''],
          queryParams: {
            startDate: startOfMonth(this.currentDate()),
            endDate: endOfMonth(this.currentDate())
          }
        })
      : undefined
  );

  public currentDate = signal(new Date());

  public dayMarkers = computed<CalendarMarkerData<Entry>[]>(() => {
    const currentMonthEntries = this.entries.value();

    return (currentMonthEntries || []).map((entry) => {
      const icon = getEntryIcon(entry);

      return {
        date: new Date(entry.date),
        icon,
        data: entry
      };
    });
  });

  public logData(entry: Entry): void {
    this._router.navigate(['entry-log', entry.id], { state: { entry } });
  }

  public changeMonths(newDate: Date): void {
    this.currentDate.set(newDate);
  }

  public createEntry(): void {
    const dialogRef = this._dialogService.open(EntryDialogComponent, {
      header: 'Add Entry',
      modal: true,
      focusOnShow: false,
      width: '50%',
      dismissableMask: true,
      closable: true,
      contentStyle: { overflow: 'visible' },
      templates: {
        footer: EntryDialogFooterComponent
      }
    });

    dialogRef.onClose.subscribe((result: 'success' | undefined) => {
      if (result === 'success') {
        this.entries.reload();
      }
    });
  }

  public markerButtonDt: ButtonDesignTokens = {
    root: {
      iconOnlyWidth: '2rem'
    },
    colorScheme: {
      light: {
        root: {
          secondary: {
            background: '{sky.200}',
            borderColor: '{sky.200}',
            hoverBackground: '{sky.300}',
            hoverBorderColor: '{sky.300}'
          }
        }
      }
    }
  };

  public addButtonDt: ButtonDesignTokens = {
    root: {
      iconOnlyWidth: '5rem',
      lg: {
        fontSize: '36px'
      }
    }
  };
}
