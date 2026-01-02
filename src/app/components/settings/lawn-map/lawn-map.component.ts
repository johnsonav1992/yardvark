import {
  afterNextRender,
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  signal,
  untracked
} from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-draw';
import { LawnSegment } from '../../../types/lawnSegments.types';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { GlobalUiService } from '../../../services/global-ui.service';
import { injectErrorToast } from '../../../utils/toastUtils';
import { injectSettingsService } from '../../../services/settings.service';
import { DEFAULT_LAWN_SEGMENT_COLOR } from '../../../constants/lawn-segment-constants';
import { MAP_CONSTANTS } from '../../../constants/map-constants';
import {
  createShapeFromCoordinates,
  createDrawControl,
  createLocationMarkerIcon,
  createVertexMarkerIcon,
  createMidpointMarkerIcon,
  getPolygonData,
  EditMode
} from '../../../utils/mapUtils';
import { EditableLayer, ShapeData } from '../../../types/map.types';

@Component({
  selector: 'lawn-map',
  imports: [CardModule, ButtonModule, FormsModule, TooltipModule],
  templateUrl: './lawn-map.component.html',
  styleUrl: './lawn-map.component.scss'
})
export class LawnMapComponent implements OnDestroy {
  private _globalUiService = inject(GlobalUiService);
  private _settingsService = injectSettingsService();
  private _throwErrorToast = injectErrorToast();

  public lawnSegments = input.required<LawnSegment[] | undefined>();
  public editingCanceled = output<LawnSegment>();
  public saveRequested = output<LawnSegment>();

  public isMobile = this._globalUiService.isMobile;
  public currentSettings = this._settingsService.currentSettings;
  public targetSegmentForDrawing = signal<LawnSegment | null>(null);
  public selectedColor = signal(DEFAULT_LAWN_SEGMENT_COLOR);
  public hasStartedEditing = signal(false);
  public editMode = signal<EditMode>('move');

  private _vertexMarkers = signal<L.Marker[]>([]);
  private _midpointMarkers = signal<L.Marker[]>([]);
  public hasAnySegments = computed(() => {
    const segments = this.lawnSegments();
    return segments && segments.length > 0;
  });
  public showEmptyOverlay = computed(
    () =>
      !this.hasAnySegments() &&
      !this.targetSegmentForDrawing() &&
      !this.hasStartedEditing()
  );

  public showEditToolbar = computed(() => {
    const target = this.targetSegmentForDrawing();
    return target?.coordinates != null;
  });

  public canSave = computed(() => {
    const target = this.targetSegmentForDrawing();
    return !!target?.name?.trim();
  });

  private _map = signal<L.Map | null>(null);
  private _drawnItems = signal<L.FeatureGroup>(new L.FeatureGroup());
  private _segmentLayers = signal<Map<number, EditableLayer>>(new Map());
  private _locationMarker = signal<L.Marker | null>(null);
  private _drawControl = signal<L.Control.Draw | null>(null);
  private _mapReady = signal(false);
  private _initialViewSet = false;

  _segmentsWatcher = effect(() => {
    const segments = this.lawnSegments();
    const mapReady = this._mapReady();
    const map = this._map();

    if (segments && mapReady && map) {
      untracked(() => this.renderSegments(segments));
    }
  });

  _locationWatcher = effect(() => {
    const location = this.currentSettings()?.location;
    const mapReady = this._mapReady();
    const map = this._map();

    if (location && mapReady && map) {
      untracked(() => {
        // Only set view to location if no segments exist (fitBounds handles view when segments exist)
        const hasSegmentsWithCoords = this.lawnSegments()?.some(
          (s) => s.coordinates
        );

        if (!hasSegmentsWithCoords && !this._initialViewSet) {
          map.setView([location.lat, location.long], MAP_CONSTANTS.LOCATION_ZOOM);
          this._initialViewSet = true;
        }

        this.updateLocationMarker(
          location.lat,
          location.long,
          location.address
        );
      });
    }
  });

  _drawControlWatcher = effect(() => {
    const targetSegment = this.targetSegmentForDrawing();
    const color = this.selectedColor();
    const map = this._map();

    if (!this._mapReady() || !map) return;

    untracked(() => {
      const existingControl = this._drawControl();

      if (existingControl) {
        map.removeControl(existingControl);
      }

      if (targetSegment && !targetSegment.coordinates) {
        const newControl = createDrawControl(color, this._drawnItems());

        this._drawControl.set(newControl);

        map.addControl(newControl);
      } else {
        this._drawControl.set(null);
      }
    });
  });

  public constructor() {
    afterNextRender({ write: () => this.initializeMap() });
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
  }

  public setEditMode(mode: EditMode): void {
    this.editMode.set(mode);

    const targetSegment = this.targetSegmentForDrawing();

    if (!targetSegment?.id) return;

    const layer = this._segmentLayers().get(targetSegment.id);

    if (!layer) return;

    layer.editing?.disable();

    this.clearCustomMarkers();
    this.createCustomMarkers(layer as L.Polygon);
  }

  public startEditing(segment: LawnSegment): void {
    this.hasStartedEditing.set(true);

    if (segment.coordinates) {
      if (this._mapReady() && this._map()) {
        this.focusOnSegment(segment.id);
        this.enableEditingForSegment(segment.id, segment);
      } else {
        this.targetSegmentForDrawing.set(segment);
      }
    } else {
      this.targetSegmentForDrawing.set(segment);
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

    this.clearCustomMarkers();
    this.editMode.set('move');
    this.targetSegmentForDrawing.set(null);
  }

  public requestSave(): void {
    const targetSegment = this.targetSegmentForDrawing();

    if (targetSegment) {
      this.saveRequested.emit(targetSegment);
    }
  }

  public updateTargetSegmentName(name: string): void {
    const target = this.targetSegmentForDrawing();

    if (target) {
      this.targetSegmentForDrawing.set({ ...target, name });
    }
  }

  public saveCurrentEdit(): (ShapeData & { color: string }) | null {
    const targetSegment = this.targetSegmentForDrawing();

    if (!targetSegment?.id) return null;

    const layer = this._segmentLayers().get(targetSegment.id);

    if (!layer) return null;

    const shapeData = getPolygonData(layer as L.Polygon);

    if (!shapeData) return null;

    this.disableLayerEditing(targetSegment.id);
    this.clearCustomMarkers();
    this.editMode.set('move');
    this.targetSegmentForDrawing.set(null);

    return { ...shapeData, color: this.selectedColor() };
  }

  private initializeMap(): void {
    const location = this.currentSettings()?.location;

    const defaultCenter: L.LatLngTuple = location
      ? [location.lat, location.long]
      : MAP_CONSTANTS.DEFAULT_US_CENTER;

    const defaultZoom = location
      ? MAP_CONSTANTS.LOCATION_ZOOM
      : MAP_CONSTANTS.OVERVIEW_ZOOM;

    const map = L.map('lawn-map', {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: true,
      maxZoom: MAP_CONSTANTS.MAX_ZOOM,
      attributionControl: false,
      // Use canvas renderer on mobile to avoid SVG rendering issues
      preferCanvas: this.isMobile()
    });

    this._map.set(map);

    const satelliteLayer = L.tileLayer(MAP_CONSTANTS.SATELLITE_TILE_URL, {
      maxZoom: MAP_CONSTANTS.MAX_ZOOM,
      maxNativeZoom: MAP_CONSTANTS.MAX_NATIVE_ZOOM
    });

    const streetLayer = L.tileLayer(MAP_CONSTANTS.STREET_TILE_URL, {
      maxZoom: MAP_CONSTANTS.MAX_ZOOM,
      maxNativeZoom: MAP_CONSTANTS.MAX_NATIVE_ZOOM
    });

    satelliteLayer.addTo(map);

    L.control
      .layers({ Satellite: satelliteLayer, Street: streetLayer })
      .addTo(map);

    map.addLayer(this._drawnItems());

    map.on(L.Draw.Event.CREATED, (e) =>
      this.onShapeCreated(e as L.DrawEvents.Created)
    );

    const currentSegments = this.lawnSegments();

    if (currentSegments?.length) {
      this.renderSegments(currentSegments);
    }

    if (location) {
      this.updateLocationMarker(location.lat, location.long, location.address);
    }

    this._mapReady.set(true);
  }

  
  private updateLocationMarker(
    lat: number,
    lng: number,
    address?: string
  ): void {
    const map = this._map();

    if (!map) return;

    const existingMarker = this._locationMarker();

    if (existingMarker) {
      map.removeLayer(existingMarker);
    }

    const marker = L.marker([lat, lng], { icon: createLocationMarkerIcon() })
      .addTo(map)
      .bindPopup(address || 'Your location');

    this._locationMarker.set(marker);
  }

  private onShapeCreated(event: L.DrawEvents.Created): void {
    const layer = event.layer as EditableLayer;
    const shapeData = getPolygonData(layer as L.Polygon);

    if (!shapeData) return;

    const targetSegment = this.targetSegmentForDrawing();

    if (!targetSegment?.id) {
      return this._throwErrorToast('Invalid segment. Please try again.');
    }

    const color = this.selectedColor();

    this.applyShapeStyle(layer, color);
    this._drawnItems().addLayer(layer);

    const layers = this._segmentLayers();

    layers.set(targetSegment.id, layer);
    this._segmentLayers.set(new Map(layers));

    this.targetSegmentForDrawing.set({
      ...targetSegment,
      coordinates: [shapeData.coordinates],
      size: shapeData.size,
      color
    });

    this.editMode.set('move');
    this.createCustomMarkers(layer as L.Polygon);
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
      const shape = createShapeFromCoordinates(coords, color);

      shape.bindPopup(
        MAP_CONSTANTS.SEGMENT_POPUP_HTML(segment.name, +segment.size)
      );

      drawnItems.addLayer(shape);
      newLayers.set(segment.id, shape);
    });

    this._segmentLayers.set(newLayers);

    if (segments.some((s) => s.coordinates)) {
      const group = new L.FeatureGroup(Array.from(newLayers.values()));

      map.fitBounds(group.getBounds().pad(0.1));
    }

    // Force map redraw on mobile to ensure layers render correctly
    if (this.isMobile()) {
      setTimeout(() => map.invalidateSize(), 100);
    }
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

  private enableEditingForSegment(
    segmentId: number,
    segment: LawnSegment
  ): void {
    const layer = this._segmentLayers().get(segmentId);

    if (!layer) return;

    this.selectedColor.set(segment.color || DEFAULT_LAWN_SEGMENT_COLOR);
    this.targetSegmentForDrawing.set(segment);
    this.editMode.set('move');
    layer.closePopup();

    this.createCustomMarkers(layer as L.Polygon);
  }

  private disableLayerEditing(segmentId: number): void {
    const layer = this._segmentLayers().get(segmentId);

    layer?.editing?.disable();
  }

  private applyShapeStyle(layer: EditableLayer, color: string): void {
    layer.setStyle({ color, fillOpacity: 0.3 });
  }

  private clearCustomMarkers(): void {
    const map = this._map();
    if (!map) return;

    this._vertexMarkers().forEach((marker) => map.removeLayer(marker));
    this._midpointMarkers().forEach((marker) => map.removeLayer(marker));

    this._vertexMarkers.set([]);
    this._midpointMarkers.set([]);
  }

  private createCustomMarkers(polygon: L.Polygon): void {
    const map = this._map();
    if (!map) return;

    const latlngs = polygon.getLatLngs()[0] as L.LatLng[];
    const mode = this.editMode();

    const vertexMarkers: L.Marker[] = [];
    const midpointMarkers: L.Marker[] = [];

    latlngs.forEach((latlng, index) => {
      const marker = this.createVertexMarker(latlng, index, polygon);

      marker.addTo(map);
      vertexMarkers.push(marker);
    });

    if (mode === 'add') {
      latlngs.forEach((latlng, index) => {
        const nextIndex = (index + 1) % latlngs.length;
        const nextLatLng = latlngs[nextIndex];

        const midpoint = L.latLng(
          (latlng.lat + nextLatLng.lat) / 2,
          (latlng.lng + nextLatLng.lng) / 2
        );

        const marker = this.createMidpointMarker(midpoint, index, polygon);

        marker.addTo(map);
        midpointMarkers.push(marker);
      });
    }

    this._vertexMarkers.set(vertexMarkers);
    this._midpointMarkers.set(midpointMarkers);
  }

  private createVertexMarker(
    latlng: L.LatLng,
    index: number,
    polygon: L.Polygon
  ): L.Marker {
    const mode = this.editMode();
    const isMobile = this.isMobile();
    const latlngs = polygon.getLatLngs()[0] as L.LatLng[];
    const canRemove = latlngs.length > 3;

    const icon = createVertexMarkerIcon({ mode, isMobile, canRemove });
    const marker = L.marker(latlng, { icon, draggable: mode === 'move' });

    if (mode === 'move') {
      marker.on('drag', (e) => {
        const newLatLng = (e.target as L.Marker).getLatLng();
        latlngs[index] = newLatLng;
        polygon.setLatLngs([latlngs]);
      });
    } else if (mode === 'remove' && canRemove) {
      marker.on('click', () => this.removeVertex(index, polygon));
    }

    return marker;
  }

  private createMidpointMarker(
    latlng: L.LatLng,
    afterIndex: number,
    polygon: L.Polygon
  ): L.Marker {
    const icon = createMidpointMarkerIcon(this.isMobile());
    const marker = L.marker(latlng, { icon, draggable: false });

    marker.on('click', () => this.addVertex(afterIndex, latlng, polygon));

    return marker;
  }

  private removeVertex(index: number, polygon: L.Polygon): void {
    const latlngs = polygon.getLatLngs()[0] as L.LatLng[];

    if (latlngs.length <= 3) {
      this._throwErrorToast('A polygon must have at least 3 points');
      return;
    }

    latlngs.splice(index, 1);
    polygon.setLatLngs([latlngs]);

    this.clearCustomMarkers();
    this.createCustomMarkers(polygon);
  }

  private addVertex(
    afterIndex: number,
    latlng: L.LatLng,
    polygon: L.Polygon
  ): void {
    const latlngs = polygon.getLatLngs()[0] as L.LatLng[];

    latlngs.splice(afterIndex + 1, 0, latlng);
    polygon.setLatLngs([latlngs]);

    this.clearCustomMarkers();
    this.createCustomMarkers(polygon);
  }
}
