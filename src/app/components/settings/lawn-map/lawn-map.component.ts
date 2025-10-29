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
  private segmentLayers = new Map<number, L.Rectangle | L.Polygon>();
  private tempLayer: L.Rectangle | L.Polygon | null = null;
  private unsavedLayers = new Map<L.Rectangle | L.Polygon, { coordinates: number[][], size: number }>();

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
          repeatMode: true,
          showArea: false,
          metric: false
        },
        polygon: {
          shapeOptions: {
            color: this.selectedColor(),
            fillOpacity: 0.3
          },
          repeatMode: true,
          showArea: false,
          allowIntersection: false
        },
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
    const layer = event.layer;
    const layerType = event.layerType;
    
    let coordinates: number[][];
    let area: number;
    
    if (layerType === 'rectangle') {
      const bounds = layer.getBounds();
      coordinates = this.boundsToCoordinates(bounds);
      area = this.calculateRectangleArea(bounds);
    } else if (layerType === 'polygon') {
      coordinates = this.polygonToCoordinates(layer);
      area = this.calculatePolygonArea(layer);
    } else {
      return;
    }

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
    layers.eachLayer((layer: any) => {
      const segmentId = this.getSegmentIdForLayer(layer);
      if (segmentId) {
        const segment = this.lawnSegments()?.find((s) => s.id === segmentId);
        if (segment) {
          if (layer.getBounds) {
            const bounds = layer.getBounds();
            segment.coordinates = [this.boundsToCoordinates(bounds)];
            segment.size = this.calculateRectangleArea(bounds);
          } else if (layer.getLatLngs) {
            segment.coordinates = [this.polygonToCoordinates(layer)];
            segment.size = this.calculatePolygonArea(layer);
          }
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
        let shape: L.Rectangle | L.Polygon;
        
        if (this.isRectangle(coords)) {
          const bounds = L.latLngBounds([
            [coords[0][1], coords[0][0]],
            [coords[2][1], coords[2][0]]
          ]);
          
          shape = L.rectangle(bounds, {
            color: segment.color || DEFAULT_LAWN_SEGMENT_COLOR,
            fillOpacity: 0.3
          });
        } else {
          const latlngs = coords.slice(0, -1).map(coord => [coord[1], coord[0]] as [number, number]);
          
          shape = L.polygon(latlngs, {
            color: segment.color || DEFAULT_LAWN_SEGMENT_COLOR,
            fillOpacity: 0.3
          });
        }

        shape.bindPopup(`
          <div style="text-align: center;">
            <strong>${segment.name}</strong><br/>
            ${segment.size.toFixed(2)} ft²
          </div>
        `);

        this.drawnItems.addLayer(shape);
        this.segmentLayers.set(segment.id, shape);
      }
    });

    if (segments.length > 0 && segments.some((s) => s.coordinates)) {
      const group = new L.FeatureGroup(
        Array.from(this.segmentLayers.values())
      );
      this.map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  private getSegmentIdForLayer(layer: L.Rectangle | L.Polygon): number | null {
    for (const [id, storedLayer] of this.segmentLayers.entries()) {
      if (storedLayer === layer) {
        return id;
      }
    }
    return null;
  }

  private isRectangle(coords: number[][]): boolean {
    return coords.length === 5 && 
           coords[0][0] === coords[3][0] &&
           coords[0][1] === coords[1][1] &&
           coords[1][0] === coords[2][0] &&
           coords[2][1] === coords[3][1];
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

  private polygonToCoordinates(polygon: L.Polygon): number[][] {
    const latlngs = polygon.getLatLngs()[0] as L.LatLng[];
    const coords = latlngs.map((latlng) => [latlng.lng, latlng.lat]);
    if (coords.length > 0) {
      coords.push([...coords[0]]);
    }
    return coords;
  }

  private calculateRectangleArea(bounds: L.LatLngBounds): number {
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

  private calculatePolygonArea(polygon: L.Polygon): number {
    const latlngs = polygon.getLatLngs()[0] as L.LatLng[];
    
    if (latlngs.length < 3) {
      return 0;
    }

    const R = 6371000;
    let area = 0;

    for (let i = 0; i < latlngs.length; i++) {
      const p1 = latlngs[i];
      const p2 = latlngs[(i + 1) % latlngs.length];
      
      const lat1 = (p1.lat * Math.PI) / 180;
      const lat2 = (p2.lat * Math.PI) / 180;
      const lng1 = (p1.lng * Math.PI) / 180;
      const lng2 = (p2.lng * Math.PI) / 180;
      
      area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }

    area = Math.abs((area * R * R) / 2);
    const areaSquareFeet = area * 10.7639;

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
