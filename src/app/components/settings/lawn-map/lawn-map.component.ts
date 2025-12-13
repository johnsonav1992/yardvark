import {
  Component,
  effect,
  inject,
  model,
  OnDestroy,
  OnInit,
  output,
  signal
} from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-draw';
import { LawnSegment } from '../../../types/lawnSegments.types';
import { LawnSegmentsService } from '../../../services/lawn-segments.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { GlobalUiService } from '../../../services/global-ui.service';
import {
  injectErrorToast,
  injectSuccessToast
} from '../../../utils/toastUtils';
import { injectSettingsService } from '../../../services/settings.service';
import { DEFAULT_LAWN_SEGMENT_COLOR } from '../../../constants/lawn-segment-constants';
import { MAP_CONSTANTS } from '../../../constants/map-constants';
import {
  boundsToCoordinates,
  polygonToCoordinates,
  calculateRectangleArea,
  calculatePolygonArea,
  isRectangleCoordinates
} from '../../../utils/mapUtils';
import { EditableLayer, ShapeData } from '../../../types/map.types';

@Component({
  selector: 'lawn-map',
  imports: [
    CardModule,
    ButtonModule,
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
  public segmentToFocus = model<LawnSegment | null>(null);
  public editingCanceled = output<LawnSegment>();

  public isMobile = this._globalUiService.isMobile;
  public currentSettings = this._settingsService.currentSettings;
  public targetSegmentForDrawing = signal<LawnSegment | null>(null);
  public showSegmentDialog = signal(false);
  public currentSegment = signal<Partial<LawnSegment> | null>(null);
  public selectedColor = signal(DEFAULT_LAWN_SEGMENT_COLOR);

  private _map = signal<L.Map | null>(null);
  private _drawnItems = signal<L.FeatureGroup>(new L.FeatureGroup());
  private _segmentLayers = signal<Map<number, EditableLayer>>(new Map());
  private _tempLayer = signal<EditableLayer | null>(null);
  private _locationMarker = signal<L.Marker | null>(null);
  private _drawControl = signal<L.Control.Draw | null>(null);
  private _mapReady = signal(false);

  _segmentsWatcher = effect(() => {
    const segments = this.lawnSegments();
    if (segments && this._mapReady() && this._map()) {
      this.renderSegments(segments);
    }
  });

  _locationWatcher = effect(() => {
    const location = this.currentSettings()?.location;
    if (location && this._mapReady() && this._map()) {
      this._map()!.setView([location.lat, location.long], MAP_CONSTANTS.LOCATION_ZOOM);
      this.updateLocationMarker(location.lat, location.long, location.address);
    }
  });

  _segmentFocusWatcher = effect(() => {
    const segment = this.segmentToFocus();
    if (segment && this._mapReady() && this._map()) {
      if (segment.coordinates) {
        this.focusOnSegment(segment.id);
        this.enableEditingForSegment(segment.id, segment);
      } else {
        this.targetSegmentForDrawing.set(segment);
      }
      this.segmentToFocus.set(null);
    }
  });

  _drawControlWatcher = effect(() => {
    const targetSegment = this.targetSegmentForDrawing();
    const color = this.selectedColor();
    const map = this._map();

    if (!this._mapReady() || !map) return;

    const existingControl = this._drawControl();
    if (existingControl) {
      map.removeControl(existingControl);
      this._drawControl.set(null);
    }

    if (targetSegment && !targetSegment.coordinates) {
      const newControl = this.createDrawControl(color);
      this._drawControl.set(newControl);
      map.addControl(newControl);
    }
  });

  ngOnInit(): void {
    setTimeout(() => this.initializeMap(), 100);
  }

  ngOnDestroy(): void {
    const map = this._map();
    if (map) {
      map.remove();
      this._map.set(null);
    }
  }

  public onColorChange(color: string): void {
    this.selectedColor.set(color);

    const targetSegment = this.targetSegmentForDrawing();
    if (targetSegment?.id != null) {
      const layer = this._segmentLayers().get(targetSegment.id);
      if (layer) {
        layer.setStyle({ color, fillOpacity: 0.3 });
      }
    }

    const tempLayer = this._tempLayer();
    if (tempLayer) {
      tempLayer.setStyle({ color, fillOpacity: 0.3, dashArray: '5, 5' });
    }
  }

  public cancelEditing(emitEvent = true): void {
    const targetSegment = this.targetSegmentForDrawing();
    if (targetSegment) {
      if (targetSegment.id) {
        this.disableLayerEditing(targetSegment.id);
      }
      if (emitEvent) {
        this.editingCanceled.emit(targetSegment);
      }
    }
    this.targetSegmentForDrawing.set(null);
  }

  public saveCurrentEdit(): ShapeData & { color: string } | null {
    const targetSegment = this.targetSegmentForDrawing();
    if (!targetSegment?.id) return null;

    const layer = this._segmentLayers().get(targetSegment.id);
    if (!layer) return null;

    const shapeData = this.getPolygonData(layer as L.Polygon);
    if (!shapeData) return null;

    this.disableLayerEditing(targetSegment.id);

    const color = this.selectedColor();
    this.targetSegmentForDrawing.set(null);

    return { ...shapeData, color };
  }

  public updateNewSegmentColor(color: string): void {
    const segment = this.currentSegment();
    if (!segment) return;

    this.currentSegment.set({ ...segment, color });

    const tempLayer = this._tempLayer();
    if (tempLayer) {
      tempLayer.setStyle({ color, fillOpacity: 0.3, dashArray: '5, 5' });
    }
  }

  public saveNewSegment(): void {
    const segment = this.currentSegment();
    if (!segment?.name || !segment?.size) return;

    this._lawnSegmentsService.addLawnSegment(segment as LawnSegment).subscribe({
      next: () => {
        this._throwSuccessToast('Lawn segment created');
        this.cleanupTempLayer();
        this._lawnSegmentsService.lawnSegments.reload();
        this.showSegmentDialog.set(false);
        this.currentSegment.set(null);
      },
      error: () => {
        this._throwErrorToast('Error creating lawn segment');
        this.cleanupTempLayer();
      }
    });
  }

  public cancelNewSegment(): void {
    this.cleanupTempLayer();
    this.showSegmentDialog.set(false);
    this.currentSegment.set(null);
  }

  private initializeMap(): void {
    const location = this.currentSettings()?.location;
    const defaultCenter: L.LatLngTuple = location
      ? [location.lat, location.long]
      : MAP_CONSTANTS.DEFAULT_US_CENTER;
    const defaultZoom = location ? MAP_CONSTANTS.LOCATION_ZOOM : MAP_CONSTANTS.OVERVIEW_ZOOM;

    const map = L.map('lawn-map', {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: true,
      maxZoom: MAP_CONSTANTS.LOCATION_ZOOM,
      attributionControl: false
    });

    this._map.set(map);

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: MAP_CONSTANTS.LOCATION_ZOOM }
    );

    const streetLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { maxZoom: MAP_CONSTANTS.LOCATION_ZOOM }
    );

    satelliteLayer.addTo(map);
    L.control.layers({ Satellite: satelliteLayer, Street: streetLayer }).addTo(map);

    map.addLayer(this._drawnItems());

    map.on(L.Draw.Event.CREATED, (e) => this.onShapeCreated(e as L.DrawEvents.Created));
    map.on(L.Draw.Event.EDITED, (e) => this.onShapeEdited(e as L.DrawEvents.Edited));
    map.on(L.Draw.Event.DELETED, (e) => this.onShapeDeleted(e as L.DrawEvents.Deleted));

    const currentSegments = this.lawnSegments();
    if (currentSegments?.length) {
      this.renderSegments(currentSegments);
    }

    if (location) {
      this.updateLocationMarker(location.lat, location.long, location.address);
    }

    this._mapReady.set(true);
  }

  private createDrawControl(color: string): L.Control.Draw {
    return new L.Control.Draw({
      draw: {
        rectangle: false,
        polygon: {
          shapeOptions: { color, fillOpacity: 0.3 },
          repeatMode: false,
          showArea: false,
          allowIntersection: false,
          drawError: { color: '#e74c3c', message: 'Polygon edges cannot cross' }
        },
        circle: false,
        marker: false,
        polyline: false,
        circlemarker: false
      },
      edit: {
        featureGroup: this._drawnItems(),
        edit: false,
        remove: false
      }
    });
  }

  private updateLocationMarker(lat: number, lng: number, address?: string): void {
    const map = this._map();
    if (!map) return;

    const existingMarker = this._locationMarker();
    if (existingMarker) {
      map.removeLayer(existingMarker);
    }

    const markerIcon = L.divIcon({
      className: 'location-marker',
      html: MAP_CONSTANTS.LOCATION_MARKER_SVG,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    const marker = L.marker([lat, lng], { icon: markerIcon })
      .addTo(map)
      .bindPopup(address || 'Your location');

    this._locationMarker.set(marker);
  }

  private onShapeCreated(event: L.DrawEvents.Created): void {
    const layer = event.layer as EditableLayer;
    const layerType = event.layerType;

    const shapeData = layerType === 'rectangle'
      ? this.getRectangleData(layer as L.Rectangle)
      : layerType === 'polygon'
        ? this.getPolygonData(layer as L.Polygon)
        : null;

    if (!shapeData) return;

    const targetSegment = this.targetSegmentForDrawing();

    if (targetSegment) {
      if (!targetSegment.id) {
        this._throwErrorToast('Invalid segment. Please try again.');
        return;
      }

      const color = this.selectedColor();
      this.applyShapeStyle(layer, color);
      this._drawnItems().addLayer(layer);

      const layers = this._segmentLayers();
      layers.set(targetSegment.id, layer);
      this._segmentLayers.set(new Map(layers));

      layer.editing?.enable();

      this.targetSegmentForDrawing.set({
        ...targetSegment,
        coordinates: [shapeData.coordinates],
        size: shapeData.size,
        color
      });
    } else {
      this.applyShapeStyle(layer, this.selectedColor(), true);
      this._drawnItems().addLayer(layer);
      this._tempLayer.set(layer);

      this.currentSegment.set({
        name: '',
        size: shapeData.size,
        coordinates: [shapeData.coordinates],
        color: this.selectedColor()
      });
      this.showSegmentDialog.set(true);
    }
  }

  private onShapeEdited(event: L.DrawEvents.Edited): void {
    event.layers.eachLayer((layer: L.Layer) => {
      const editableLayer = layer as EditableLayer;
      const segmentId = this.getSegmentIdForLayer(editableLayer);
      if (!segmentId) return;

      const segment = this.lawnSegments()?.find((s) => s.id === segmentId);
      if (!segment) return;

      const shapeData = this.getPolygonData(editableLayer as L.Polygon);
      if (!shapeData) return;

      segment.coordinates = [shapeData.coordinates];
      segment.size = shapeData.size;

      this.updateSegment(segment);
      editableLayer.editing?.disable();
      this.targetSegmentForDrawing.set(null);
    });
  }

  private onShapeDeleted(event: L.DrawEvents.Deleted): void {
    event.layers.eachLayer((layer: L.Layer) => {
      const segmentId = this.getSegmentIdForLayer(layer as EditableLayer);
      if (!segmentId) return;

      this._lawnSegmentsService.deleteLawnSegment(segmentId).subscribe({
        next: () => {
          this._throwSuccessToast('Lawn segment deleted');
          this._lawnSegmentsService.lawnSegments.reload();
          const layers = this._segmentLayers();
          layers.delete(segmentId);
          this._segmentLayers.set(new Map(layers));
        },
        error: () => {
          this._throwErrorToast('Error deleting lawn segment');
          this.renderSegments(this.lawnSegments() || []);
        }
      });
    });
  }

  private renderSegments(segments: LawnSegment[]): void {
    const map = this._map();
    if (!map) return;

    const targetSegment = this.targetSegmentForDrawing();
    if (targetSegment?.coordinates) return;

    const drawnItems = this._drawnItems();
    const currentLayers = this._segmentLayers();

    currentLayers.forEach((layer) => drawnItems.removeLayer(layer));
    const newLayers = new Map<number, EditableLayer>();

    segments.forEach((segment) => {
      if (!segment.coordinates?.[0]) return;

      const coords = segment.coordinates[0];
      const color = segment.color || DEFAULT_LAWN_SEGMENT_COLOR;
      const shape = this.createShapeFromCoordinates(coords, color);

      shape.bindPopup(`
        <div style="text-align: center;">
          <strong>${segment.name}</strong><br/>
          ${(+segment.size).toFixed(2)} ft²
        </div>
      `);

      drawnItems.addLayer(shape);
      newLayers.set(segment.id, shape);
    });

    this._segmentLayers.set(newLayers);

    if (segments.some((s) => s.coordinates)) {
      const group = new L.FeatureGroup(Array.from(newLayers.values()));
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  private createShapeFromCoordinates(coords: number[][], color: string): EditableLayer {
    if (isRectangleCoordinates(coords)) {
      const bounds = L.latLngBounds(
        [coords[0][1], coords[0][0]],
        [coords[2][1], coords[2][0]]
      );
      return L.rectangle(bounds, { color, fillOpacity: 0.3 }) as EditableLayer;
    }

    const latlngs = coords
      .slice(0, -1)
      .map((coord): L.LatLngTuple => [coord[1], coord[0]]);

    return L.polygon(latlngs, { color, fillOpacity: 0.3 }) as EditableLayer;
  }

  private focusOnSegment(segmentId: number): void {
    const layer = this._segmentLayers().get(segmentId);
    const map = this._map();

    if (layer && map) {
      map.fitBounds(layer.getBounds().pad(0.2));
      layer.openPopup();
    } else {
      const segment = this.lawnSegments()?.find((s) => s.id === segmentId);
      if (segment && !segment.coordinates) {
        this._throwErrorToast(
          'This segment has not been mapped yet. Draw it on the map to add coordinates.'
        );
      }
    }
  }

  private enableEditingForSegment(segmentId: number, segment: LawnSegment): void {
    const layer = this._segmentLayers().get(segmentId);
    if (!layer?.editing) return;

    layer.editing.enable();
    this.selectedColor.set(segment.color || DEFAULT_LAWN_SEGMENT_COLOR);
    this.targetSegmentForDrawing.set(segment);
    layer.closePopup();
  }

  private disableLayerEditing(segmentId: number): void {
    const layer = this._segmentLayers().get(segmentId);
    layer?.editing?.disable();
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

  private cleanupTempLayer(): void {
    const tempLayer = this._tempLayer();
    if (tempLayer) {
      this._drawnItems().removeLayer(tempLayer);
      this._tempLayer.set(null);
    }
  }

  private applyShapeStyle(layer: EditableLayer, color: string, isDashed = false): void {
    layer.setStyle({
      color,
      fillOpacity: 0.3,
      ...(isDashed && { dashArray: '5, 5' })
    });
  }

  private getSegmentIdForLayer(layer: EditableLayer): number | null {
    for (const [id, storedLayer] of this._segmentLayers().entries()) {
      if (storedLayer === layer) return id;
    }
    return null;
  }

  private getRectangleData(rectangle: L.Rectangle): ShapeData {
    const bounds = rectangle.getBounds();
    return {
      coordinates: boundsToCoordinates(bounds),
      size: calculateRectangleArea(bounds)
    };
  }

  private getPolygonData(polygon: L.Polygon): ShapeData | null {
    const latlngs = polygon.getLatLngs()[0] as L.LatLng[];
    if (latlngs.length < 3) return null;

    return {
      coordinates: polygonToCoordinates(polygon),
      size: calculatePolygonArea(polygon)
    };
  }
}
