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
import { injectSettingsService } from '../../../services/settings.service';
import { DEFAULT_LAWN_SEGMENT_COLOR } from '../../../constants/lawn-segment-constants';

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
  private _settingsService = injectSettingsService();
  private _throwErrorToast = injectErrorToast();
  private _throwSuccessToast = injectSuccessToast();

  public lawnSegments = model.required<LawnSegment[] | undefined>();
  public isMobile = this._globalUiService.isMobile;
  public currentSettings = this._settingsService.currentSettings;

  private map: L.Map | null = null;
  private drawnItems = new L.FeatureGroup();
  private segmentLayers = new Map<number, L.Rectangle>();
  private tempLayer: L.Rectangle | null = null;
  private unsavedLayers = new Map<L.Rectangle, { coordinates: number[][], size: number }>();

  public showSegmentDialog = signal(false);
  public currentSegment = signal<Partial<LawnSegment> | null>(null);
  public selectedColor = signal(DEFAULT_LAWN_SEGMENT_COLOR);

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
    const settings = this.currentSettings();
    const location = settings?.location;
    const defaultCenter: [number, number] = location 
      ? [location.lat, location.long]
      : [39.8283, -98.5795];
    const defaultZoom = location ? 18 : 4;

    this.map = L.map('lawn-map', {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: true
    });

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 22,
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      }
    );

    const streetLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 22,
        attribution: '© OpenStreetMap contributors'
      }
    );

    satelliteLayer.addTo(this.map);

    const baseMaps = {
      'Satellite': satelliteLayer,
      'Street': streetLayer
    };

    L.control.layers(baseMaps).addTo(this.map);

    this.map.addLayer(this.drawnItems);

    const drawControl = new L.Control.Draw({
      draw: {
        rectangle: {
          shapeOptions: {
            color: this.selectedColor(),
            fillOpacity: 0.3
          },
          repeatMode: true
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

    this.unsavedLayers.set(layer, { coordinates, size: area });

    layer.setStyle({
      color: this.selectedColor(),
      fillOpacity: 0.3,
      dashArray: '5, 5'
    });

    layer.bindPopup(
      `<div style="text-align: center;">
        <strong>Unsaved Segment</strong><br/>
        ${area.toFixed(2)} ft²<br/>
        <small>Click to name and save</small>
      </div>`
    );

    layer.on('click', () => {
      const data = this.unsavedLayers.get(layer);
      if (data) {
        this.tempLayer = layer;
        this.currentSegment.set({
          name: '',
          size: data.size,
          coordinates: [data.coordinates],
          color: this.selectedColor()
        });
        this.showSegmentDialog.set(true);
      }
    });

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
        this._lawnSegmentsService.deleteLawnSegment(segmentId).subscribe({
          next: () => {
            this._throwSuccessToast('Lawn segment deleted');
            this._lawnSegmentsService.lawnSegments.reload();
            this.segmentLayers.delete(segmentId);
          },
          error: () => {
            this._throwErrorToast('Error deleting lawn segment');
            this.renderSegments(this.lawnSegments() || []);
          }
        });
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
          color: segment.color || DEFAULT_LAWN_SEGMENT_COLOR,
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
        next: () => {
          this._throwSuccessToast('Lawn segment created');
          this._lawnSegmentsService.lawnSegments.reload();
          if (this.tempLayer) {
            this.unsavedLayers.delete(this.tempLayer);
            this.tempLayer = null;
          }
          this.showSegmentDialog.set(false);
          this.currentSegment.set(null);
        },
        error: () => {
          this._throwErrorToast('Error creating lawn segment');
          if (this.tempLayer) {
            this.drawnItems.removeLayer(this.tempLayer);
            this.unsavedLayers.delete(this.tempLayer);
            this.tempLayer = null;
          }
        }
      });
  }

  public cancelNewSegment(): void {
    if (this.tempLayer) {
      this.drawnItems.removeLayer(this.tempLayer);
      this.unsavedLayers.delete(this.tempLayer);
      this.tempLayer = null;
    }
    this.showSegmentDialog.set(false);
    this.currentSegment.set(null);
  }

  public updateSegmentColor(segment: LawnSegment): void {
    this.updateSegment(segment);
  }

  private updateSegment(segment: LawnSegment): void {
    this._lawnSegmentsService.updateLawnSegment(segment).subscribe({
      next: () => {
        this._throwSuccessToast('Lawn segment updated');
        this._lawnSegmentsService.lawnSegments.reload();
      },
      error: () => {
        this._throwErrorToast('Error updating lawn segment');
      }
    });
  }
}
