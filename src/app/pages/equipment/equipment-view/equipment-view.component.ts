import {
  Component,
  computed,
  effect,
  inject,
  NgZone,
  OnDestroy,
  signal
} from '@angular/core';
import { PageContainerComponent } from '../../../components/layout/page-container/page-container.component';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { GlobalUiService } from '../../../services/global-ui.service';
import { EquipmentService } from '../../../services/equipment.service';
import { DividerDesignTokens } from '@primeuix/themes/types/divider';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { CardDesignTokens } from '@primeuix/themes/types/card';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DialogService } from 'primeng/dynamicdialog';
import { EquipmentMaintenanceAddEditModalComponent } from '../../../components/equipment/equipment-maintenance-add-edit-modal/equipment-maintenance-add-edit-modal.component';
import { EquipmentMaintenance } from '../../../types/equipment.types';
import { injectErrorToast } from '../../../utils/toastUtils';
import { ConfirmationService } from 'primeng/api';
import { ButtonDesignTokens } from '@primeuix/themes/types/button';
import { NO_IMAGE_URL } from '../../../constants/style-constants';
import { TagModule } from 'primeng/tag';
import { differenceInDays, differenceInMonths } from 'date-fns';

@Component({
  selector: 'equipment-view',
  imports: [
    PageContainerComponent,
    SkeletonModule,
    DividerModule,
    TitleCasePipe,
    DatePipe,
    CurrencyPipe,
    TableModule,
    CardModule,
    ButtonModule,
    TagModule,
    TooltipModule
  ],
  templateUrl: './equipment-view.component.html',
  styleUrl: './equipment-view.component.scss',
  providers: [DialogService]
})
export class EquipmentViewComponent implements OnDestroy {
  private _globalUiService = inject(GlobalUiService);
  private _equipmentService = inject(EquipmentService);
  private _route = inject(ActivatedRoute);
  private _dialogService = inject(DialogService);
  private _router = inject(Router);
  private _confirmationService = inject(ConfirmationService);
  private _ngZone = inject(NgZone);
  public throwErrorToast = injectErrorToast();

  public noImageUrl = NO_IMAGE_URL;
  public skeletonInfoCards = Array(3).fill(0);

  public isMobile = this._globalUiService.isMobile;

  public isAdjustingPosition = signal(false);
  public imagePosition = signal('center center');
  private isDragging = signal(false);
  private dragStartX = signal(0);
  private dragStartY = signal(0);
  private startPositionX = signal(50);
  private startPositionY = signal(50);
  private imageElement = signal<HTMLElement | null>(null);

  public equipmentId = toSignal(
    this._route.params.pipe(map((params) => parseInt(params['equipmentId'])))
  );

  public isLoading = computed(() =>
    this._equipmentService.equipment.isLoading()
  );

  public equipment = computed(() =>
    this._equipmentService.equipment
      .value()
      ?.find((equipment) => equipment.id === this.equipmentId())
  );

  constructor() {
    effect(() => {
      const eq = this.equipment();

      if (eq?.imagePosition && !this.isAdjustingPosition()) {
        this.imagePosition.set(eq.imagePosition);
      }
    });
  }

  public maintenanceStatusConfig = computed(() => {
    const eq = this.equipment();

    if (!eq) return null;

    const records = eq.maintenanceRecords;
    const createdAt = new Date(eq.createdAt);
    const now = new Date();
    const daysSinceCreation = differenceInDays(now, createdAt);

    if (daysSinceCreation <= 2) {
      return {
        label: 'Newly Added',
        severity: 'info' as const,
        icon: 'ti ti-sparkles'
      };
    }

    if (!records || records.length === 0) {
      const monthsSinceCreation = differenceInMonths(now, createdAt);

      if (monthsSinceCreation >= 1) {
        return {
          label: 'Never Serviced',
          severity: 'info' as const,
          icon: 'ti ti-help-circle'
        };
      }

      return null;
    }

    const lastMaintenance = new Date(records[0].maintenanceDate);
    const monthsSince = differenceInMonths(now, lastMaintenance);

    if (monthsSince <= 1) {
      return {
        label: 'Recently Serviced',
        severity: 'success' as const,
        icon: 'ti ti-circle-check'
      };
    }

    if (monthsSince >= 3 && monthsSince < 6) {
      return {
        label: 'Service Soon',
        severity: 'warn' as const,
        icon: 'ti ti-clock-exclamation'
      };
    }

    if (monthsSince >= 6) {
      return {
        label: 'Maintenance Due',
        severity: 'danger' as const,
        icon: 'ti ti-alert-triangle'
      };
    }

    return null;
  });

  public totalMaintenanceCost = computed(() => {
    const eq = this.equipment();

    if (!eq || !eq.maintenanceRecords) return 0;

    return eq.maintenanceRecords.reduce(
      (total, record) => total + (record.cost || 0),
      0
    );
  });

  public daysSincePurchase = computed(() => {
    const eq = this.equipment();

    if (!eq?.purchaseDate) return null;

    return differenceInDays(new Date(), new Date(eq.purchaseDate));
  });

  public ownedForDisplay = computed(() => {
    const days = this.daysSincePurchase();

    if (days === null) return null;

    const years = Math.floor(days / 365);
    const remainingDays = days % 365;

    if (years === 0) {
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    }

    if (remainingDays === 0) {
      return `${years} ${years === 1 ? 'year' : 'years'}`;
    }

    return `${years} ${years === 1 ? 'year' : 'years'}, ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`;
  });

  public daysSinceLastService = computed(() => {
    const eq = this.equipment();

    if (!eq || !eq.maintenanceRecords || eq.maintenanceRecords.length === 0) {
      return null;
    }

    const lastService = new Date(eq.maintenanceRecords[0].maintenanceDate);

    return differenceInDays(new Date(), lastService);
  });

  public openEquipmentModal(maintenanceRecord?: EquipmentMaintenance): void {
    const dialogRef = this._dialogService.open(
      EquipmentMaintenanceAddEditModalComponent,
      {
        header: `${maintenanceRecord ? 'Edit' : 'Add'} Maintenance Record`,
        modal: true,
        focusOnShow: false,
        width: '50%',
        dismissableMask: true,
        closable: true,
        contentStyle: { overflow: 'visible' },
        inputValues: {
          date: maintenanceRecord?.maintenanceDate
            ? new Date(maintenanceRecord?.maintenanceDate)
            : undefined,
          notes: maintenanceRecord?.notes,
          cost: maintenanceRecord?.cost,
          equipmentId: this.equipmentId(),
          maintenanceId: maintenanceRecord?.id
        },
        breakpoints: {
          '800px': '95%'
        },
        maximizable: true
      }
    );

    if (dialogRef && this.isMobile()) {
      const instance = this._dialogService.getInstance(dialogRef);
      if (instance) instance.maximize();
    }

    dialogRef?.onClose.subscribe((result) => {
      if (result === 'success') {
        this._equipmentService.equipment.reload();
      }
    });
  }

  public openEditEquipment(): void {
    this._router.navigate(['equipment', 'edit', this.equipmentId()]);
  }

  public openConfirmDelete(): void {
    this._confirmationService.confirm({
      message: 'Are you sure you want to delete this equipment?',
      header: 'Delete Equipment',
      icon: 'ti ti-alert-triangle',
      accept: () => {
        this.deleteEquipment();
      },
      reject: () => {}
    });
  }

  public deleteEquipment(): void {
    this._equipmentService.deleteEquipment(this.equipmentId()!).subscribe({
      next: () => {
        this._router.navigate(['/equipment']);
        this._equipmentService.equipment.reload();
      },
      error: () => {
        this.throwErrorToast('Error deleting equipment. Please try again.');
      }
    });
  }

  public deleteMaintenanceRecord(maintenanceId: number): void {
    this._equipmentService.deleteMaintenanceRecord(maintenanceId).subscribe({
      next: () => {
        this._equipmentService.equipment.reload();
      },
      error: () => {
        this.throwErrorToast(
          'Error deleting maintenance record. Please try again.'
        );
      }
    });
  }

  public dividerDt: DividerDesignTokens = {
    horizontal: {
      margin: '0'
    }
  };

  public mobileBottomDividerDt: DividerDesignTokens = {
    horizontal: {
      margin: '0 0 .75rem 0'
    }
  };

  public cardDt: CardDesignTokens = {
    root: { shadow: '0 0 2px rgba(0, 0, 0, 0.3)' },
    body: { padding: '1rem .75rem 1.5rem .75rem' }
  };

  public mobileAddMaintenanceButtonDt: ButtonDesignTokens = {
    root: {
      iconOnlyWidth: '1.75rem'
    }
  };

  public togglePositionAdjustment(): void {
    this.isAdjustingPosition.set(!this.isAdjustingPosition());
  }

  public onImageMouseDown(event: MouseEvent): void {
    if (!this.isAdjustingPosition()) return;

    event.preventDefault();
    this.isDragging.set(true);
    this.dragStartX.set(event.clientX);
    this.dragStartY.set(event.clientY);
    this.imageElement.set(event.currentTarget as HTMLElement);

    const currentPos = this.imagePosition().split(' ');
    const x = currentPos[0] === 'center' ? 50 : parseFloat(currentPos[0]);
    const y = currentPos[1] === 'center' ? 50 : parseFloat(currentPos[1]);
    this.startPositionX.set(isNaN(x) ? 50 : x);
    this.startPositionY.set(isNaN(y) ? 50 : y);

    document.addEventListener('mousemove', this.onDocumentMouseMove);
    document.addEventListener('mouseup', this.onDocumentMouseUp);
  }

  public onImageTouchStart(event: TouchEvent): void {
    if (!this.isAdjustingPosition()) return;

    event.preventDefault();
    const touch = event.touches[0];
    this.isDragging.set(true);
    this.dragStartX.set(touch.clientX);
    this.dragStartY.set(touch.clientY);
    this.imageElement.set(event.currentTarget as HTMLElement);

    const currentPos = this.imagePosition().split(' ');
    const x = currentPos[0] === 'center' ? 50 : parseFloat(currentPos[0]);
    const y = currentPos[1] === 'center' ? 50 : parseFloat(currentPos[1]);
    this.startPositionX.set(isNaN(x) ? 50 : x);
    this.startPositionY.set(isNaN(y) ? 50 : y);

    document.addEventListener('touchmove', this.onDocumentTouchMove, {
      passive: false
    });
    document.addEventListener('touchend', this.onDocumentTouchEnd);
  }

  private onDocumentMouseMove = (event: MouseEvent): void => {
    if (
      !this.isAdjustingPosition() ||
      !this.isDragging() ||
      !this.imageElement()
    )
      return;

    event.preventDefault();

    this._ngZone.run(() => {
      const element = this.imageElement();

      if (!element) return;

      const rect = element.getBoundingClientRect();
      const deltaX = event.clientX - this.dragStartX();
      const deltaY = event.clientY - this.dragStartY();

      const deltaPercentX = (deltaX / rect.width) * 100;
      const deltaPercentY = (deltaY / rect.height) * 100;

      const newX = this.startPositionX() - deltaPercentX;
      const newY = this.startPositionY() - deltaPercentY;

      this.imagePosition.set(`${newX.toFixed(1)}% ${newY.toFixed(1)}%`);
    });
  };

  private onDocumentMouseUp = (): void => {
    this._ngZone.run(() => {
      this.isDragging.set(false);
      this.imageElement.set(null);
      document.removeEventListener('mousemove', this.onDocumentMouseMove);
      document.removeEventListener('mouseup', this.onDocumentMouseUp);
    });
  };

  private onDocumentTouchMove = (event: TouchEvent): void => {
    if (
      !this.isAdjustingPosition() ||
      !this.isDragging() ||
      !this.imageElement()
    )
      return;

    event.preventDefault();
    const touch = event.touches[0];

    this._ngZone.run(() => {
      const element = this.imageElement();

      if (!element) return;

      const rect = element.getBoundingClientRect();
      const deltaX = touch.clientX - this.dragStartX();
      const deltaY = touch.clientY - this.dragStartY();

      const deltaPercentX = (deltaX / rect.width) * 100;
      const deltaPercentY = (deltaY / rect.height) * 100;

      const newX = this.startPositionX() - deltaPercentX;
      const newY = this.startPositionY() - deltaPercentY;

      this.imagePosition.set(`${newX.toFixed(1)}% ${newY.toFixed(1)}%`);
    });
  };

  private onDocumentTouchEnd = (): void => {
    this._ngZone.run(() => {
      this.isDragging.set(false);
      this.imageElement.set(null);
      document.removeEventListener('touchmove', this.onDocumentTouchMove);
      document.removeEventListener('touchend', this.onDocumentTouchEnd);
    });
  };

  public ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.onDocumentMouseMove);
    document.removeEventListener('mouseup', this.onDocumentMouseUp);
    document.removeEventListener('touchmove', this.onDocumentTouchMove);
    document.removeEventListener('touchend', this.onDocumentTouchEnd);
  }

  public saveImagePosition(): void {
    const equipmentId = this.equipmentId();

    if (!equipmentId) return;

    this._equipmentService
      .updateEquipment(equipmentId, { imagePosition: this.imagePosition() })
      .subscribe({
        next: () => {
          this.isAdjustingPosition.set(false);
          this._equipmentService.equipment.reload();
        },
        error: () => {
          this.throwErrorToast(
            'Error saving image position. Please try again.'
          );
        }
      });
  }

  public cancelPositionAdjustment(): void {
    const eq = this.equipment();

    if (eq?.imagePosition) {
      this.imagePosition.set(eq.imagePosition);
    } else {
      this.imagePosition.set('center center');
    }

    this.isAdjustingPosition.set(false);
  }
}
