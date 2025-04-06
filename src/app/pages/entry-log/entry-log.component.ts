import {
  Component,
  computed,
  inject,
  linkedSignal,
  OnInit,
  signal
} from '@angular/core';
import {
  CalendarMarkerData,
  DaySelectedEvent,
  EntriesCalendarComponent
} from '../../components/entries/entries-calendar/entries-calendar.component';
import { ButtonModule } from 'primeng/button';
import { ButtonDesignTokens } from '@primeng/themes/types/button';
import { injectUserData } from '../../utils/authUtils';
import { Entry } from '../../types/entries.types';
import { getEntryIcon } from '../../utils/entriesUtils';
import { TooltipModule } from 'primeng/tooltip';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { DialogService } from 'primeng/dynamicdialog';
import { EntryDialogComponent } from '../../components/entries/entry-dialog/entry-dialog.component';
import { EntryDialogFooterComponent } from '../../components/entries/entry-dialog/entry-dialog-footer/entry-dialog-footer.component';
import { EntriesService } from '../../services/entries.service';
import { GlobalUiService } from '../../services/global-ui.service';
import { DividerModule } from 'primeng/divider';
import { isSameDay } from 'date-fns';
import { CardModule } from 'primeng/card';
import { DatePipe } from '@angular/common';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'entry-log',
  imports: [
    EntriesCalendarComponent,
    ButtonModule,
    TooltipModule,
    RouterOutlet,
    DividerModule,
    CardModule,
    DatePipe
  ],
  templateUrl: './entry-log.component.html',
  styleUrl: './entry-log.component.scss',
  providers: [DialogService]
})
export class EntryLogComponent implements OnInit {
  private _router = inject(Router);
  private _activatedRoute = inject(ActivatedRoute);
  private _dialogService = inject(DialogService);
  private _entriesService = inject(EntriesService);
  private _globalUiService = inject(GlobalUiService);

  public isCreateOnOpen = toSignal(
    this._activatedRoute.queryParams.pipe(
      map((params) => params['create'] === 'true')
    )
  );

  public isMobile = this._globalUiService.isMobile;

  public user = injectUserData();

  public currentDate = signal(new Date());
  public selectedMobileDateToView = signal<Date | null>(null);
  public selectedMobileDateEntries = linkedSignal({
    source: this.selectedMobileDateToView,
    computation: (newMobileDateToView) => {
      if (newMobileDateToView) {
        return this.entries.value()?.filter((entry) => {
          return isSameDay(new Date(entry.date), newMobileDateToView);
        });
      }

      return null;
    }
  });

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

  public entries = this._entriesService.getMonthEntriesResource(
    this.currentDate
  );

  public ngOnInit(): void {
    if (this.isCreateOnOpen()) {
      this.createEntry();
    }
  }

  public navigateToEntry(entry: Entry): void {
    this._router.navigate(['entry-log', entry.id], {
      state: { entry },
      queryParams: { date: new Date(entry.date).toISOString() }
    });
  }

  public changeMonths(newDate: Date): void {
    this.currentDate.set(newDate);
    this.selectedMobileDateToView.set(null);
  }

  public createEntry(date?: Date): void {
    const dialogRef = this._dialogService.open(EntryDialogComponent, {
      header: 'Add Entry',
      modal: true,
      focusOnShow: false,
      width: '50%',
      dismissableMask: true,
      closable: true,
      contentStyle: { overflow: 'visible' },
      inputValues: {
        date
      },
      templates: {
        footer: EntryDialogFooterComponent
      },
      breakpoints: {
        '800px': '95%'
      },
      maximizable: true
    });

    if (this.isMobile()) this._dialogService.getInstance(dialogRef).maximize();

    dialogRef.onClose.subscribe((result?: string) => {
      if (result) {
        this.changeMonths(new Date(result));

        if (this.isMobile())
          this.selectedMobileDateToView.set(new Date(result));

        this.entries.reload();
      }
    });
  }

  public selectDay(e: DaySelectedEvent): void {
    const { date, type } = e;

    if (this.isMobile() && type !== 'long-press') {
      this.selectedMobileDateToView.set(date);

      this.selectedMobileDateEntries.set(
        this.entries.value()?.filter((entry) => {
          return isSameDay(new Date(entry.date), date);
        }) || []
      );
    } else {
      this.createEntry(date);
    }
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
