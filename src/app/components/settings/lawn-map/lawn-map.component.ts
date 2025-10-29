import {
  Component,
  effect,
  inject,
  model,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-draw';
import { LawnSegment } from '../../../types/lawnSegments.types';
import { LawnSegmentsService } from '../../../services/lawn-segments.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ColorPickerModule } from 'primeng/colorpicker';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { GlobalUiService } from '../../../services/global-ui.service';
import { injectErrorToast, injectSuccessToast } from '../../../utils/toastUtils';

@Component({
  selector: 'lawn-map',
  imports: [
    CardModule,
    ButtonModule,
    ColorPickerModule,
    FormsModule,
    DialogModule,
    InputTextModule
  ],
  templateUrl: './lawn-map.component.html',
  styleUrl: './lawn-map.component.scss'
})
export class LawnMapComponent implements OnInit, OnDestroy {
  private _lawnSegmentsService = inject(LawnSegmentsService);
  private _globalUiService = inject(GlobalUiService);
  private _throwErrorToast = injectErrorToast();
  private _throwSuccessToast = injectSuccessToast();

  public lawnSegments = model.required<LawnSegment[] | undefined>();
  public isMobile = this._globalUiService.isMobile;

  private map: L.Map | null = null;
  private drawnItems = new L.FeatureGroup();
  private segmentLayers = new Map<number, L.Rectangle>();

  public showSegmentDialog = signal(false);
  public currentSegment = signal<Partial<LawnSegment> | null>(null);
  public selectedColor = signal('#3388ff');

  _segmentsWatcher = effect(() => {
    const segments = this.lawnSegments();
    if (segments && this.map) {
      this.renderSegments(segments);
    }
  });

  ngOnInit(): void {
    setTimeout(() => this.initializeMap(), 100);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initializeMap(): void {
    this.map = L.map('lawn-map', {
      center: [39.8283, -98.5795],
      zoom: 4,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 22,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.map.addLayer(this.drawnItems);

    const drawControl = new L.Control.Draw({
      draw: {
        rectangle: {
          shapeOptions: {
            color: this.selectedColor(),
            fillOpacity: 0.3
          }
        },
        polygon: false,
        circle: false,
        marker: false,
        polyline: false,
        circlemarker: false
      },
      edit: {
        featureGroup: this.drawnItems
      }
    });

    this.map.addControl(drawControl);

    this.map.on(L.Draw.Event.CREATED, (event: any) => {
      this.onShapeCreated(event);
    });

    this.map.on(L.Draw.Event.EDITED, (event: any) => {
      this.onShapeEdited(event);
    });

    this.map.on(L.Draw.Event.DELETED, (event: any) => {
      this.onShapeDeleted(event);
    });

    this.renderSegments(this.lawnSegments() || []);
  }

  private onShapeCreated(event: any): void {
    const layer = event.layer as L.Rectangle;
    const bounds = layer.getBounds();
    const coordinates = this.boundsToCoordinates(bounds);
    const area = this.calculateArea(bounds);

    this.currentSegment.set({
      name: '',
      size: area,
      coordinates: [coordinates],
      color: this.selectedColor()
    });

    this.showSegmentDialog.set(true);
    this.drawnItems.addLayer(layer);
  }

  private onShapeEdited(event: any): void {
    const layers = event.layers;
    layers.eachLayer((layer: L.Rectangle) => {
      const segmentId = this.getSegmentIdForLayer(layer);
      if (segmentId) {
        const segment = this.lawnSegments()?.find((s) => s.id === segmentId);
        if (segment) {
          const bounds = layer.getBounds();
          segment.coordinates = [this.boundsToCoordinates(bounds)];
          segment.size = this.calculateArea(bounds);
          this.updateSegment(segment);
        }
      }
    });
  }

  private onShapeDeleted(event: any): void {
    const layers = event.layers;
    layers.eachLayer((layer: L.Rectangle) => {
      const segmentId = this.getSegmentIdForLayer(layer);
      if (segmentId) {
        this.segmentLayers.delete(segmentId);
      }
    });
  }

  private renderSegments(segments: LawnSegment[]): void {
    if (!this.map) return;

    this.drawnItems.clearLayers();
    this.segmentLayers.clear();

    segments.forEach((segment) => {
      if (segment.coordinates && segment.coordinates[0]) {
        const coords = segment.coordinates[0];
        const bounds = L.latLngBounds([
          [coords[0][1], coords[0][0]],
          [coords[2][1], coords[2][0]]
        ]);

        const rectangle = L.rectangle(bounds, {
          color: segment.color || '#3388ff',
          fillOpacity: 0.3
        });

        rectangle.bindPopup(`
          <div style="text-align: center;">
            <strong>${segment.name}</strong><br/>
            ${segment.size.toFixed(2)} ft²
          </div>
        `);

        this.drawnItems.addLayer(rectangle);
        this.segmentLayers.set(segment.id, rectangle);
      }
    });

    if (segments.length > 0 && segments.some((s) => s.coordinates)) {
      const group = new L.FeatureGroup(
        Array.from(this.segmentLayers.values())
      );
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  private getSegmentIdForLayer(layer: L.Rectangle): number | null {
    for (const [id, storedLayer] of this.segmentLayers.entries()) {
      if (storedLayer === layer) {
        return id;
      }
    }
    return null;
  }

  private boundsToCoordinates(bounds: L.LatLngBounds): number[][] {
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();
    return [
      [sw.lng, sw.lat],
      [ne.lng, sw.lat],
      [ne.lng, ne.lat],
      [sw.lng, ne.lat],
      [sw.lng, sw.lat]
    ];
  }

  private calculateArea(bounds: L.LatLngBounds): number {
    const sw = bounds.getSouthWest();
    const ne = bounds.getNorthEast();

    const R = 6371000;
    const lat1 = (sw.lat * Math.PI) / 180;
    const lat2 = (ne.lat * Math.PI) / 180;
    const lng1 = (sw.lng * Math.PI) / 180;
    const lng2 = (ne.lng * Math.PI) / 180;

    const x = (lng2 - lng1) * Math.cos((lat1 + lat2) / 2);
    const y = lat2 - lat1;

    const widthMeters = x * R;
    const heightMeters = y * R;

    const areaSquareMeters = Math.abs(widthMeters * heightMeters);
    const areaSquareFeet = areaSquareMeters * 10.7639;

    return Math.round(areaSquareFeet * 100) / 100;
  }

  public saveNewSegment(): void {
    const segment = this.currentSegment();
    if (!segment || !segment.name || !segment.size) {
      return;
    }

    this._lawnSegmentsService
      .addLawnSegment(segment as LawnSegment)
      .subscribe({
        next: (newSegment) => {
          this._throwSuccessToast('Lawn segment created');
          this.lawnSegments.update((prev) => [...(prev || []), newSegment]);
          this.showSegmentDialog.set(false);
          this.currentSegment.set(null);
        },
        error: () => {
          this._throwErrorToast('Error creating lawn segment');
        }
      });
  }

  public cancelNewSegment(): void {
    this.drawnItems.clearLayers();
    this.showSegmentDialog.set(false);
    this.currentSegment.set(null);
  }

  public updateSegmentColor(segment: LawnSegment): void {
    this.updateSegment(segment);
  }

  private updateSegment(segment: LawnSegment): void {
    this._lawnSegmentsService.updateLawnSegment(segment).subscribe({
      next: (updated) => {
        this._throwSuccessToast('Lawn segment updated');
        this.lawnSegments.update((prev) =>
          prev?.map((s) => (s.id === updated.id ? updated : s))
        );
      },
      error: () => {
        this._throwErrorToast('Error updating lawn segment');
      }
    });
  }
}
