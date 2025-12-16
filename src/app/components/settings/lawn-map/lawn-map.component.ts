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
import { GlobalUiService } from '../../../services/global-ui.service';
import { injectErrorToast } from '../../../utils/toastUtils';
import { injectSettingsService } from '../../../services/settings.service';
import { DEFAULT_LAWN_SEGMENT_COLOR } from '../../../constants/lawn-segment-constants';
import { MAP_CONSTANTS } from '../../../constants/map-constants';
import {
  polygonToCoordinates,
  calculatePolygonArea,
  isRectangleCoordinates
} from '../../../utils/mapUtils';
import { EditableLayer, ShapeData } from '../../../types/map.types';

@Component({
  selector: 'lawn-map',
  imports: [CardModule, ButtonModule, FormsModule],
  templateUrl: './lawn-map.component.html',
  styleUrl: './lawn-map.component.scss'
})
export class LawnMapComponent implements OnDestroy {
  private _globalUiService = inject(GlobalUiService);
  private _settingsService = injectSettingsService();
  private _throwErrorToast = injectErrorToast();

  public lawnSegments = input.required<LawnSegment[] | undefined>();
  public editingCanceled = output<LawnSegment>();

  public isMobile = this._globalUiService.isMobile;
  public currentSettings = this._settingsService.currentSettings;
  public targetSegmentForDrawing = signal<LawnSegment | null>(null);
  public selectedColor = signal(DEFAULT_LAWN_SEGMENT_COLOR);
  public hasStartedEditing = signal(false);
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

  private _map = signal<L.Map | null>(null);
  private _drawnItems = signal<L.FeatureGroup>(new L.FeatureGroup());
  private _segmentLayers = signal<Map<number, EditableLayer>>(new Map());
  private _locationMarker = signal<L.Marker | null>(null);
  private _drawControl = signal<L.Control.Draw | null>(null);
  private _mapReady = signal(false);

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
        map.setView([location.lat, location.long], MAP_CONSTANTS.LOCATION_ZOOM);

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
        const newControl = this.createDrawControl(color);

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

    this.targetSegmentForDrawing.set(null);
  }

  public saveCurrentEdit(): (ShapeData & { color: string }) | null {
    const targetSegment = this.targetSegmentForDrawing();
    this.targetSegmentForDrawing.set(null);

    if (!targetSegment?.id) return null;

    const layer = this._segmentLayers().get(targetSegment.id);

    if (!layer) return null;

    const shapeData = this.getPolygonData(layer as L.Polygon);

    if (!shapeData) return null;

    this.disableLayerEditing(targetSegment.id);

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
      attributionControl: false
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
    const shapeData = this.getPolygonData(layer as L.Polygon);

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

    layer.editing?.enable();

    this.targetSegmentForDrawing.set({
      ...targetSegment,
      coordinates: [shapeData.coordinates],
      size: shapeData.size,
      color
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
  }

  private createShapeFromCoordinates(
    coords: number[][],
    color: string
  ): EditableLayer {
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

  private enableEditingForSegment(
    segmentId: number,
    segment: LawnSegment
  ): void {
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

  private applyShapeStyle(layer: EditableLayer, color: string): void {
    layer.setStyle({ color, fillOpacity: 0.3 });
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
