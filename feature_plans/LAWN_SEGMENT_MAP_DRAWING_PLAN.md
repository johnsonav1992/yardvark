# Lawn Segment Map Drawing Feature - Implementation Plan

## Current State Analysis

### Backend Model
- Simple structure: `id`, `userId`, `name`, `size` (decimal)
- No geographic data stored yet
- Location: `backend/src/modules/lawn-segments/models/lawn-segments.model.ts`

### Frontend
- Table-based editing in settings
- Manual name and size entry
- Component: `src/app/components/settings/lawn-segments-table/lawn-segments-table.component.ts`

---

## Proposed Solution: Map Drawing for Lawn Segments

### Library Comparison

#### Option 1: Google Maps API
**Pros:**
- Best satellite imagery quality for yards
- Drawing tools built-in
- Accurate area calculations
- Familiar UI for users

**Cons:**
- Requires API key with billing enabled
- Can get expensive at scale
- Monthly costs can add up

#### Option 2: Leaflet + OpenStreetMap (⭐ RECOMMENDED - FREE)
**Pros:**
- 100% free and open source
- Leaflet Draw plugin for polygon drawing
- Good for residential properties
- No API keys or billing required
- Large community and documentation

**Cons:**
- Satellite imagery not as high-res as Google
- Need to use third-party tile providers (ArcGIS, Mapbox, etc.)

#### Option 3: Mapbox
**Pros:**
- Great satellite imagery
- Modern API
- Free tier (50,000 loads/month)
- Drawing tools available

**Cons:**
- Requires API key
- Can get expensive beyond free tier

---

## Recommended Implementation: Leaflet

### 1. Backend Changes

#### Database Migration
Add new columns to `lawn_segments` table:

```typescript
// lawn-segments.model.ts
@Entity('lawn_segments')
export class LawnSegment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  size: number;

  // NEW: Store polygon coordinates as JSON
  @Column({ type: 'jsonb', nullable: true })
  coordinates: { lat: number; lng: number }[] | null;

  // NEW: Optional - store center point for map display
  @Column({ type: 'jsonb', nullable: true })
  center: { lat: number; lng: number } | null;

  @ManyToMany(() => Entry, (entry) => entry.lawnSegments)
  entries: Entry[];
}
```

#### Type Updates
```typescript
// lawn-segments.types.ts
export type LawnSegmentCoordinate = {
  lat: number;
  lng: number;
};

export type LawnSegmentCreationRequest = Omit<
  InstanceType<typeof LawnSegment>,
  'id' | 'entries' | 'userId'
> & {
  coordinates?: LawnSegmentCoordinate[];
  center?: LawnSegmentCoordinate;
};
```

#### Migration File
```typescript
// Create migration: npm run migration:generate -- AddCoordinatesToLawnSegments

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCoordinatesToLawnSegments1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "lawn_segments"
      ADD COLUMN "coordinates" jsonb,
      ADD COLUMN "center" jsonb
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "lawn_segments"
      DROP COLUMN "coordinates",
      DROP COLUMN "center"
    `);
  }
}
```

---

### 2. Frontend Architecture

#### New Component Structure
```
src/app/components/settings/lawn-segment-map-drawer/
  ├── lawn-segment-map-drawer.component.ts
  ├── lawn-segment-map-drawer.component.html
  ├── lawn-segment-map-drawer.component.scss
```

#### Key Features
- ✅ Search for address to center map
- ✅ Draw polygons for lawn segments
- ✅ Auto-calculate area from polygon
- ✅ Edit existing polygons
- ✅ Delete segments
- ✅ Save multiple segments in one session
- ✅ Color-code different segments
- ✅ Mobile-friendly touch drawing

---

### 3. UI Flow

```
Settings Page
  └── Lawn Segments Section
      ├── [Table View] (current - list of segments)
      │   └── Shows both manual and map-drawn segments
      │
      └── [Draw on Map Button] → Opens Full-Screen Dialog
          └── Map Drawer Dialog
              ├── Header
              │   ├── Address Search Bar
              │   └── Close Button
              │
              ├── Map Container (Leaflet)
              │   ├── Satellite base layer
              │   ├── Drawing tools toolbar
              │   └── Drawn polygons with labels
              │
              ├── Sidebar (Collapsible on mobile)
              │   ├── Segment List
              │   │   ├── Segment 1 (editable name, calculated area)
              │   │   ├── Segment 2
              │   │   └── ...
              │   └── Drawing Instructions
              │
              └── Footer
                  ├── Save All Button
                  ├── Cancel Button
                  └── Clear All Button
```

---

### 4. Technical Implementation

#### Install Dependencies
```bash
# Core Leaflet
npm install leaflet @types/leaflet

# Drawing plugin
npm install leaflet-draw @types/leaflet-draw

# Address search
npm install leaflet-geosearch

# Geometry utilities
npm install @turf/turf
```

#### Angular Configuration
Add to `angular.json` styles and scripts:
```json
{
  "styles": [
    "node_modules/leaflet/dist/leaflet.css",
    "node_modules/leaflet-draw/dist/leaflet.draw.css"
  ],
  "scripts": [
    "node_modules/leaflet/dist/leaflet.js",
    "node_modules/leaflet-draw/dist/leaflet.draw.js"
  ]
}
```

---

### 5. Component Implementation

#### TypeScript Component (Simplified)
```typescript
import { Component, AfterViewInit, OnDestroy } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-draw';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';

@Component({
  selector: 'lawn-segment-map-drawer',
  templateUrl: './lawn-segment-map-drawer.component.html',
  styleUrls: ['./lawn-segment-map-drawer.component.scss']
})
export class LawnSegmentMapDrawerComponent implements AfterViewInit, OnDestroy {
  private map: L.Map;
  private drawnItems: L.FeatureGroup;
  public segments: LawnSegment[] = [];

  ngAfterViewInit() {
    this.initMap();
    this.addDrawingControls();
    this.addSearchControl();
    this.loadExistingSegments();
  }

  initMap() {
    // Initialize map centered on user's location or default
    this.map = L.map('map', {
      center: [40.7128, -74.0060], // Default to NYC, update with user's location
      zoom: 19,
      zoomControl: true
    });

    // Add satellite tile layer (using ArcGIS - free)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 20
    }).addTo(this.map);

    // Optional: Add street labels overlay
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      pane: 'shadowPane'
    }).addTo(this.map);
  }

  addDrawingControls() {
    this.drawnItems = new L.FeatureGroup();
    this.map.addLayer(this.drawnItems);

    const drawControl = new L.Control.Draw({
      position: 'topright',
      edit: {
        featureGroup: this.drawnItems,
        remove: true
      },
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          metric: false, // Use imperial units
          feet: true
        },
        polyline: false,
        rectangle: true,
        circle: false,
        marker: false,
        circlemarker: false
      }
    });

    this.map.addControl(drawControl);

    // Handle drawing events
    this.map.on(L.Draw.Event.CREATED, (e: any) => {
      const layer = e.layer;
      const layerType = e.layerType;

      this.drawnItems.addLayer(layer);

      if (layerType === 'polygon' || layerType === 'rectangle') {
        this.createSegmentFromLayer(layer);
      }
    });

    this.map.on(L.Draw.Event.EDITED, (e: any) => {
      const layers = e.layers;
      layers.eachLayer((layer: L.Polygon) => {
        this.updateSegmentFromLayer(layer);
      });
    });

    this.map.on(L.Draw.Event.DELETED, (e: any) => {
      const layers = e.layers;
      layers.eachLayer((layer: L.Polygon) => {
        this.deleteSegmentFromLayer(layer);
      });
    });
  }

  addSearchControl() {
    const provider = new OpenStreetMapProvider();

    const searchControl = new GeoSearchControl({
      provider: provider,
      style: 'bar',
      autoComplete: true,
      autoCompleteDelay: 250,
      showMarker: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: 'Enter your address'
    });

    this.map.addControl(searchControl);
  }

  createSegmentFromLayer(layer: L.Polygon) {
    const coordinates = this.getCoordinatesFromLayer(layer);
    const area = this.calculateArea(layer);
    const center = this.calculateCenter(coordinates);

    const segment: LawnSegment = {
      id: Math.random(), // Temporary ID
      name: `Segment ${this.segments.length + 1}`,
      size: area,
      coordinates: coordinates,
      center: center,
      userId: '',
      _leafletId: layer._leafletId // Store for reference
    };

    this.segments.push(segment);
    this.addLabelToLayer(layer, segment.name);
  }

  calculateArea(layer: L.Polygon): number {
    // Use Leaflet's GeometryUtil or Turf.js for accurate area calculation
    const latlngs = layer.getLatLngs()[0] as L.LatLng[];

    // Simple area calculation (more accurate with turf.js)
    let area = 0;
    if (latlngs.length > 2) {
      area = L.GeometryUtil.geodesicArea(latlngs);
    }

    // Convert square meters to square feet
    const sqFt = area * 10.7639;
    return Math.round(sqFt);
  }

  calculateCenter(coordinates: { lat: number; lng: number }[]): { lat: number; lng: number } {
    const lats = coordinates.map(c => c.lat);
    const lngs = coordinates.map(c => c.lng);

    return {
      lat: lats.reduce((a, b) => a + b, 0) / lats.length,
      lng: lngs.reduce((a, b) => a + b, 0) / lngs.length
    };
  }

  getCoordinatesFromLayer(layer: L.Polygon): { lat: number; lng: number }[] {
    const latlngs = layer.getLatLngs()[0] as L.LatLng[];
    return latlngs.map(ll => ({ lat: ll.lat, lng: ll.lng }));
  }

  addLabelToLayer(layer: L.Polygon, name: string) {
    const center = layer.getBounds().getCenter();
    const label = L.marker(center, {
      icon: L.divIcon({
        className: 'segment-label',
        html: `<div style="background: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${name}</div>`,
        iconSize: [100, 40]
      })
    }).addTo(this.map);
  }

  loadExistingSegments() {
    // Load existing segments from service
    this.lawnSegmentsService.lawnSegments.value()?.forEach(segment => {
      if (segment.coordinates && segment.coordinates.length > 0) {
        const latlngs = segment.coordinates.map(c => [c.lat, c.lng]);
        const polygon = L.polygon(latlngs as L.LatLngExpression[]);
        this.drawnItems.addLayer(polygon);
        this.addLabelToLayer(polygon, segment.name);
      }
    });
  }

  saveSegments() {
    // Save all segments via service
    this.segments.forEach(segment => {
      if (segment.id < 1) {
        // New segment
        this.lawnSegmentsService.addLawnSegment(segment).subscribe();
      } else {
        // Existing segment
        this.lawnSegmentsService.updateLawnSegment(segment).subscribe();
      }
    });
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }
}
```

#### HTML Template
```html
<div class="map-drawer-container">
  <div class="map-header">
    <h2>Draw Lawn Segments</h2>
    <p-button icon="ti ti-x" (click)="close()" [text]="true" />
  </div>

  <div class="map-content">
    <div id="map" class="map"></div>

    <div class="segments-sidebar">
      <h3>Lawn Segments</h3>
      <div class="instructions">
        <p>Use the polygon tool to draw your lawn segments on the map.</p>
      </div>

      <div class="segments-list">
        @for (segment of segments; track segment.id) {
          <div class="segment-item">
            <input [(ngModel)]="segment.name" placeholder="Segment name" />
            <span>{{ segment.size }} sq ft</span>
            <p-button icon="ti ti-trash" severity="danger" [text]="true" (click)="deleteSegment(segment)" />
          </div>
        }
      </div>
    </div>
  </div>

  <div class="map-footer">
    <p-button label="Cancel" severity="secondary" (click)="close()" />
    <p-button label="Save All Segments" (click)="saveSegments()" />
  </div>
</div>
```

#### SCSS Styles
```scss
.map-drawer-container {
  display: flex;
  flex-direction: column;
  height: 100vh;

  .map-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--surface-border);
  }

  .map-content {
    display: flex;
    flex: 1;
    overflow: hidden;

    .map {
      flex: 1;
      height: 100%;
    }

    .segments-sidebar {
      width: 300px;
      padding: 1rem;
      border-left: 1px solid var(--surface-border);
      overflow-y: auto;

      .segment-item {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        padding: 0.5rem;
        border: 1px solid var(--surface-border);
        border-radius: 4px;
        margin-bottom: 0.5rem;
      }
    }
  }

  .map-footer {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1rem;
    border-top: 1px solid var(--surface-border);
  }

  @media (max-width: 768px) {
    .segments-sidebar {
      position: absolute;
      top: 60px;
      right: 0;
      width: 100%;
      max-width: 300px;
      background: var(--surface-ground);
      z-index: 1000;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
    }
  }
}
```

---

### 6. Integration Steps

#### Step 1: Add Button to Settings
```html
<!-- lawn-segments-table.component.html -->
<div class="table-header">
  <h3>Lawn Segments</h3>
  <div class="actions">
    <p-button label="Draw on Map" icon="ti ti-map" (click)="openMapDrawer()" />
    <p-button label="Add Row" icon="ti ti-plus" (click)="addLawnSegmentRow()" />
  </div>
</div>
```

#### Step 2: Open Dialog
```typescript
// lawn-segments-table.component.ts
openMapDrawer() {
  this.dialogService.open(LawnSegmentMapDrawerComponent, {
    header: 'Draw Lawn Segments on Map',
    width: '95vw',
    height: '95vh',
    maximizable: false,
    data: {
      existingSegments: this.lawnSegments()
    }
  });
}
```

#### Step 3: Update Service
```typescript
// lawn-segments.service.ts
addLawnSegment(segment: LawnSegmentCreationRequest): Observable<LawnSegment> {
  return postReq<LawnSegment, LawnSegmentCreationRequest>(
    apiUrl('lawn-segments'),
    segment
  );
}

updateLawnSegment(segment: Partial<LawnSegment>): Observable<LawnSegment> {
  return putReq<LawnSegment, Partial<LawnSegment>>(
    apiUrl('lawn-segments', { params: [segment.id!] }),
    segment
  );
}
```

---

### 7. Enhanced Features (Phase 2)

#### Feature 1: Show Segments on Overview Map
- Small map widget on dashboard
- Shows all segments with colors
- Click to zoom to specific segment

#### Feature 2: Segment Colors
- Auto-assign colors to segments
- User can customize colors
- Color picker in segment list

#### Feature 3: Import/Export
- Export segments as GeoJSON
- Import from GeoJSON
- Share with other users

#### Feature 4: Measurement Tools
- Measure distance between points
- Show segment perimeter
- Calculate total lawn area

#### Feature 5: Historical Overlay
- Show previous year's segments
- Compare changes over time

---

### 8. Implementation Timeline

#### Phase 1: Core Functionality (12-15 hours)
- ✅ Backend migration and types (2-3 hours)
- ✅ Basic map component with Leaflet (3-4 hours)
- ✅ Drawing and area calculation (2-3 hours)
- ✅ Integration with existing table (2-3 hours)
- ✅ Testing and bug fixes (3-4 hours)

#### Phase 2: Enhancements (8-10 hours)
- ✅ Address search optimization (2 hours)
- ✅ Segment colors and styling (2-3 hours)
- ✅ Mobile responsiveness (2-3 hours)
- ✅ Overview map widget (2-3 hours)

#### Phase 3: Advanced Features (Optional)
- ✅ Import/Export functionality (3-4 hours)
- ✅ Measurement tools (2-3 hours)
- ✅ Historical comparison (4-5 hours)

**Total Estimated Time:** 20-30 hours for complete implementation

---

### 9. Alternative: Simpler MVP Approach

If you want to start simpler and faster:

#### Quick Start Option
1. Use Google Maps Embed API (free)
2. Let users click to mark center point of segment
3. User manually enters radius or draws simple circle
4. Auto-calculate area from radius
5. **Estimated Time: 4-6 hours**

#### Why This Might Be Better Initially
- Faster to market
- Less complexity
- No polygon drawing needed
- Still provides location context
- Can upgrade to full drawing later

---

### 10. Testing Checklist

#### Functional Tests
- [ ] Draw polygon and calculate area correctly
- [ ] Edit existing polygon
- [ ] Delete polygon
- [ ] Save multiple segments
- [ ] Load existing segments on map
- [ ] Address search works
- [ ] Mobile touch drawing
- [ ] Zoom and pan work correctly

#### Edge Cases
- [ ] Overlapping segments
- [ ] Very small segments (< 100 sq ft)
- [ ] Very large segments (> 50,000 sq ft)
- [ ] Complex polygon shapes
- [ ] Undo/redo functionality
- [ ] Browser refresh during drawing

#### Browser Compatibility
- [ ] Chrome
- [ ] Firefox
- [ ] Safari (desktop & mobile)
- [ ] Edge

---

### 11. Resources & Documentation

#### Leaflet Documentation
- Official Docs: https://leafletjs.com/reference.html
- Leaflet Draw: https://github.com/Leaflet/Leaflet.draw
- Geosearch Plugin: https://github.com/smeijer/leaflet-geosearch

#### Tile Providers
- ArcGIS Satellite: https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer
- OpenStreetMap: https://tile.openstreetmap.org
- CartoDB: https://carto.com/basemaps/

#### Area Calculation
- Turf.js: https://turfjs.org/ (recommended for accurate calculations)
- Leaflet GeometryUtil: https://github.com/makinacorpus/Leaflet.GeometryUtil

---

## Next Steps

1. Review this plan and decide on scope (MVP vs Full Implementation)
2. Create backend migration for coordinate storage
3. Install required npm packages
4. Build map drawer component
5. Integrate with settings page
6. Test on various devices
7. Deploy to production

**Questions? Ping @Alex**

---

*Last Updated: 2025-10-01*
*Status: Planning*
