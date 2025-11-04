# Growing Degree Days (GDD) Feature Plan for Yardvark

**Created:** November 4, 2025
**Status:** Planning Phase
**User Request:** "Are you able to add a page with GDD values for PGR similar to the soil data page? Maybe even the quick stats could be updated to have Days or GDD since last PGR app that could be controlled in the settings."

---

## Table of Contents
1. [GDD Education & Background](#gdd-education--background)
2. [Current State Analysis](#current-state-analysis)
3. [Feature Requirements](#feature-requirements)
4. [Technical Implementation Plan](#technical-implementation-plan)
5. [User Experience Design](#user-experience-design)
6. [Implementation Phases](#implementation-phases)
7. [Resources & References](#resources--references)

---

## GDD Education & Background

### What Are Growing Degree Days?

**Growing Degree Days (GDD)** are a measurement of heat accumulation used to predict plant development rates. Instead of tracking time using a calendar, GDD tracks the actual heat energy that drives plant growth.

Think of it like this: Plants don't care what day of the month it is. They respond to temperature. A warm spring week might accumulate the same "growing energy" as three cool weeks. GDD captures this reality.

### Why GDD Matters for Lawn Care

**The Problem with Calendar-Based Scheduling:**
- "Apply PGR every 28 days" sounds simple, but it's inefficient
- In hot weather, grass grows faster → PGR wears off sooner
- In cool weather, grass grows slower → you waste product with frequent applications
- Calendar intervals lead to either "rebound growth" (waited too long) or over-regulation (applied too soon)

**The GDD Solution:**
- Tracks actual heat accumulation that drives growth
- Applications timed to biological reality, not arbitrary dates
- More consistent turf quality with fewer applications
- Better product efficacy and cost savings

### How GDD Calculation Works

**Basic Formula:**
```
Daily GDD = ((Max Temp + Min Temp) / 2) - Base Temperature

If result is negative, GDD = 0
```

**Important Notes:**
- Base temperature is the minimum temperature at which growth occurs
- Any temperature below base temp is set to base temp before averaging
- GDD accumulates day by day throughout the growing season

**Example Calculation:**
```
Settings:
- Base Temperature: 50°F (cool-season grass)

Day 1:
- High: 75°F
- Low: 55°F
- Average: (75 + 55) / 2 = 65°F
- GDD: 65 - 50 = 15 GDD

Day 2:
- High: 68°F
- Low: 45°F (below base, use 50°F instead)
- Average: (68 + 50) / 2 = 59°F
- GDD: 59 - 50 = 9 GDD

Accumulated GDD after 2 days: 15 + 9 = 24 GDD
```

### Base Temperatures by Grass Type

**Cool-Season Grasses:** (Kentucky bluegrass, perennial ryegrass, tall fescue, bentgrass)
- **Base Temperature:** 32°F (0°C) for PGR models
- **Growth Range:** 50°F - 75°F optimal
- **Common Base:** Some models use 50°F (10°C) for general growth tracking

**Warm-Season Grasses:** (Bermudagrass, zoysiagrass, St. Augustine, centipede)
- **Base Temperature:** 50°F (10°C) for PGR models
- **Growth Range:** 75°F - 95°F optimal
- **Common Base:** Some models use 60°F (15.5°C) for general growth tracking

### PGR Application Intervals (Research-Based)

#### Trinexapac-ethyl (TE) - Most Common PGR
**Brand Names:** Primo Maxx, T-Nex, Envoy Plus

**Application Intervals:**
- **Cool-season putting greens:** 200-230 GDD (base 32°F/0°C)
- **Cool-season fairways:** 300 GDD (base 32°F/0°C)
- **Kentucky bluegrass lawns:** 250 GDD (base 32°F/0°C)
- **Warm-season ultradwarf greens:** 220 GDD (base 50°F/10°C)

**Why These Intervals?**
- 50% of TE breaks down by 100 GDD
- After 200 GDD, only 25% remains active in the plant
- Re-application before 200 GDD maintains consistent suppression

#### Paclobutrazol
**Brand Names:** Trimmit, Legacy

**Application Intervals:**
- **Cool-season greens:** 270-310 GDD (base 32°F/0°C)
- **Generally:** ~300 GDD (base 32°F/0°C)

**Characteristics:**
- Lasts longer than trinexapac-ethyl
- Different mode of action (gibberellin inhibitor)

#### Tank Mixes
When mixing PGRs (e.g., TE + paclobutrazol):
- Use the interval of the **longer-lasting** product
- Typical interval: ~300 GDD

### Benefits of GDD-Based Timing

**Research Findings:**
- **Improved turf quality:** More consistent color and density
- **Better plant health:** Reduces over-regulation stress
- **Cost savings:** Fewer applications needed (typically 2-3 fewer per season)
- **Better performance:** Eliminates "rebound" growth surge between applications
- **Predictability:** Can forecast next application date based on weather forecast

**University Research:**
- University of Wisconsin-Madison: 200 GDD intervals optimal for bentgrass
- Purdue University: GDD-based timing superior to calendar intervals
- Cornell University: Recommends GDD for all turfgrass PGR programs

---

## Current State Analysis

### What Yardvark Already Has

#### 1. Weather & Temperature Infrastructure

**Soil Temperature Service** (`src/app/services/soil-temperature.service.ts`)
- Uses Open-Meteo API (free, reliable)
- Provides hourly temperature data at 6cm and 18cm depths
- Historical data available
- Already calculates daily averages

**Weather Service** (`src/app/services/weather-service.ts`)
- Uses Weather.gov (National Weather Service)
- 7-day forecast with high/low temperatures
- US-only coverage

**Temperature Data Available:**
- Current soil temperature
- Historical soil temperature (any date range)
- 7-day weather forecast
- User's selected temperature unit (Celsius/Fahrenheit)
- User's location (lat/long)

#### 2. GDD Calculation Already Exists!

**File:** `src/app/utils/lawnCalculatorUtils.ts`

```typescript
export const getDailyGDDCalculation = ({
  baseTemperature,
  maxTemperature,
  minTemperature
}: {
  baseTemperature: number;
  maxTemperature: number;
  minTemperature: number;
}): number => {
  const averageTemp = (maxTemperature + minTemperature) / 2;
  return Math.max(0, averageTemp - baseTemperature);
};
```

**This function is ready to use!** We just need to:
- Feed it daily temperature data
- Accumulate GDD over time
- Display the results

#### 3. Product & Entry Tracking System

**Entry Model** (`backend/src/modules/entries/models/entries.model.ts`)
- Tracks all lawn care activities with timestamps
- Links to products via `EntryProduct` junction table
- Stores product quantity, unit, and application details

**Product Model** (`backend/src/modules/products/models/products.model.ts`)
- Product categories: fertilizer, pre-emergent, post-emergent, bio-stimulant, insect-control, fungus-control, other
- **Note:** No dedicated "PGR" category yet
- Stores application rate, coverage, method

**Activity Tracking:**
- Activity ID 9: `PRODUCT_APPLICATION`
- Backend endpoint: `/entries/last-product-app` (already exists!)
- Returns date of most recent product application

#### 4. Quick Stats Widget

**Location:** `src/app/components/dashboard/quick-stats/quick-stats.component.ts`

**Currently Displays:**
- Days since last entry
- Days since last mow
- Days since last product app
- Season progress (percentage based on soil temp + latitude)

**Perfect Integration Point:** Already shows "days since last product app" - we can enhance this to show GDD!

#### 5. Soil Data Page

**Location:** `src/app/pages/soil-data/soil-data.component.ts`

**Currently Shows:**
- 7-day soil temperature chart (6cm and 18cm depths)
- 7-day soil moisture chart

**Template Structure:**
- Uses card-based layout
- Contains graph components
- Clean, mobile-friendly design

**Perfect Template:** We can create a similar page for GDD!

#### 6. Settings System

**Current Settings Data Type:**
```typescript
export type SettingsData = {
  temperatureUnit: 'celsius' | 'fahrenheit';
  grassType: 'warm' | 'cool';
  lawnSize: number;  // square feet
  location: {
    address: string;
    lat: number;
    long: number;
  };
  entryView: 'calendar' | 'list';
  hideSystemProducts: boolean;
  hiddenWidgets: string[];
  widgetOrder: string[];
  mobileNavbarItems: string[];
};
```

**Great Foundation:** Grass type already tracked! This determines base temperature.

---

## Feature Requirements

### Core User Stories

1. **As a lawn care enthusiast**, I want to track GDD accumulation since my last PGR application, so I know when it's biologically time to reapply.

2. **As a user**, I want to see GDD values displayed on a dedicated page with charts, similar to the soil data page.

3. **As a user**, I want the quick stats widget to show "GDD since last PGR app" in addition to or instead of calendar days.

4. **As a user**, I want to configure my preferred GDD settings (base temperature, target interval) in the settings page.

5. **As a user**, I want to see historical GDD data at the time I made each PGR application, so I can analyze my patterns.

6. **As a user**, I want to be notified (or see a visual indicator) when I'm approaching my target GDD threshold.

### Functional Requirements

#### Must Have (MVP)
- [ ] Calculate daily GDD based on actual weather data (high/low temps)
- [ ] Track GDD accumulation since last PGR application
- [ ] Display "GDD since last PGR app" in quick stats widget
- [ ] Settings to configure:
  - Base temperature (or auto-set based on grass type)
  - Target GDD interval (e.g., 200 GDD)
- [ ] Dedicated GDD page showing:
  - Current GDD accumulation
  - Daily GDD bar/line chart (last 30 days)
  - Date of last PGR application
  - Projected date for next application (based on 7-day forecast)
- [ ] Add "PGR" as a distinct product category

#### Should Have (Phase 2)
- [ ] Store GDD value at time of each PGR application (historical tracking)
- [ ] Analytics chart: PGR applications overlaid on GDD accumulation timeline
- [ ] Multiple GDD tracking (different base temps for different purposes)
- [ ] GDD "reset" when user logs a PGR application
- [ ] Comparison: actual interval between apps vs. recommended interval
- [ ] Settings option to choose between "days" or "GDD" display in quick stats

#### Could Have (Future)
- [ ] Push notifications when approaching target GDD
- [ ] GDD tracking for other purposes:
  - Pre-emergent timing (crabgrass germination ~50 GDD base 50°F)
  - Grub control timing
  - Disease pressure models
- [ ] Historical GDD patterns (year-over-year comparison)
- [ ] "Smart recommendations" based on grass type and mowing height
- [ ] GDD export to CSV
- [ ] Integration with product labels (auto-fill recommended GDD from product database)

---

## Technical Implementation Plan

### Phase 1: Backend Infrastructure

#### 1.1 Database Changes

**Add PGR Product Category:**
```typescript
// backend/src/modules/products/models/products.types.ts
export const PRODUCT_TYPES = {
  LAWN_FERTILIZER: 'fertilizer',
  PRE_EMERGENT: 'pre-emergent',
  POST_EMERGENT: 'post-emergent',
  BIO_STIMULANT: 'bio-stimulant',
  INSECT_CONTROL: 'insect-control',
  PLANT_FERTILIZER: 'plant-fertilizer',
  SEED: 'seed',
  FUNGUS_CONTROL: 'fungus-control',
  PGR: 'pgr',  // NEW
  OTHER: 'other',
}
```

**Extend Settings Type:**
```typescript
// backend/src/modules/settings/models/settings.types.ts
export type SettingsData = {
  // ... existing fields ...

  gddSettings?: {
    enabled: boolean;
    baseTemperature: number;  // Fahrenheit
    targetGddInterval: number;  // e.g., 200
    customBaseTemp?: number;  // Override auto-calculated base temp
    displayPreference: 'days' | 'gdd' | 'both';
  };
};
```

**Extend Entry Model (Optional - for historical tracking):**
```typescript
// backend/src/modules/entries/models/entries.model.ts
@Entity('entries')
export class Entry {
  // ... existing fields ...

  @Column('decimal', { nullable: true })
  gddAtApplication?: number;  // GDD accumulated at time of this PGR app

  @Column('decimal', { nullable: true })
  gddSinceLastApp?: number;  // GDD since previous PGR app
}
```

#### 1.2 New API Endpoints

**GET `/api/gdd/current`**
```typescript
// Returns current GDD accumulation since last PGR app
Response: {
  accumulatedGdd: number;
  lastPgrAppDate: Date | null;
  daysSinceLastApp: number;
  baseTemperature: number;
  targetGdd: number;
  percentageToTarget: number;
}
```

**GET `/api/gdd/historical?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`**
```typescript
// Returns daily GDD values for date range
Response: {
  dailyGdd: Array<{
    date: string;
    gdd: number;
    highTemp: number;
    lowTemp: number;
  }>;
  totalGdd: number;
}
```

**GET `/api/gdd/forecast`**
```typescript
// Returns projected GDD for next 7 days + estimated next app date
Response: {
  forecastedGdd: Array<{
    date: string;
    estimatedGdd: number;
  }>;
  projectedNextAppDate: string | null;
  currentGdd: number;
  targetGdd: number;
}
```

**GET `/api/entries/last-pgr-app`**
```typescript
// Similar to existing /last-mow and /last-product-app
Response: {
  lastPgrAppDate: Date | null;
  gddAtApplication?: number;
}
```

#### 1.3 Backend Service Logic

**GDD Service** (new file: `backend/src/modules/gdd/gdd.service.ts`)

Key responsibilities:
1. Fetch weather data from Open-Meteo (high/low temps)
2. Calculate daily GDD using base temperature from user settings
3. Query last PGR application date from entries
4. Accumulate GDD from last app date to present
5. Project future GDD based on weather forecast
6. Calculate next recommended application date

**Integration Points:**
- Use existing `WeatherService` or create weather data utility
- Query `EntriesService` for last PGR app
- Query `SettingsService` for user's GDD preferences
- Leverage existing location data

### Phase 2: Frontend Infrastructure

#### 2.1 GDD Service (Frontend)

**File:** `src/app/services/gdd.service.ts`

```typescript
@Injectable({
  providedIn: 'root'
})
export class GDDService {
  private _settingsService = inject(SettingsService);
  private _locationService = inject(LocationService);
  private _weatherService = inject(WeatherService);

  // Current GDD accumulation
  public currentGdd = httpResource<CurrentGddResponse>(() =>
    apiUrl('gdd/current')
  );

  // Historical GDD data
  public getHistoricalGdd = (
    startDate: Signal<Date>,
    endDate: Signal<Date>
  ) => {
    return httpResource<HistoricalGddResponse>(() => {
      return apiUrl('gdd/historical', {
        queryParams: {
          startDate: formatDate(startDate(), 'yyyy-MM-dd', 'en-US'),
          endDate: formatDate(endDate(), 'yyyy-MM-dd', 'en-US')
        }
      });
    });
  };

  // GDD forecast
  public gddForecast = httpResource<GddForecastResponse>(() =>
    apiUrl('gdd/forecast')
  );

  // Calculate GDD between two dates (local calculation)
  public calculateGddForDateRange(
    tempData: Array<{date: Date, high: number, low: number}>,
    baseTemp: number
  ): number {
    return tempData.reduce((total, day) => {
      const dailyGdd = getDailyGDDCalculation({
        baseTemperature: baseTemp,
        maxTemperature: day.high,
        minTemperature: day.low
      });
      return total + dailyGdd;
    }, 0);
  }

  // Get base temperature based on grass type
  public getDefaultBaseTemperature(): number {
    const grassType = this._settingsService.settings()?.grassType;
    const tempUnit = this._settingsService.settings()?.temperatureUnit;

    // Standard PGR base temps
    if (grassType === 'cool') {
      return tempUnit === 'fahrenheit' ? 32 : 0;
    } else {
      return tempUnit === 'fahrenheit' ? 50 : 10;
    }
  }
}
```

#### 2.2 GDD Page Component

**File:** `src/app/pages/gdd-data/gdd-data.component.ts`

**Template Structure:**
```html
<div class="gdd-page">
  <h1>Growing Degree Days (GDD)</h1>

  <!-- Current Stats Card -->
  <div class="gdd-current-card">
    <h2>Current Accumulation</h2>
    <div class="gdd-stat-large">
      {{ currentGdd()?.accumulatedGdd | number:'1.0-0' }} GDD
    </div>
    <div class="gdd-meta">
      <p>Since last PGR app: {{ lastPgrAppDate() | date:'MMM d, yyyy' }}</p>
      <p>Target: {{ targetGdd() }} GDD</p>
      <p-progressbar [value]="percentageToTarget()" />
    </div>
  </div>

  <!-- Daily GDD Chart -->
  <div class="chart-card">
    <h3>Daily GDD (Last 30 Days)</h3>
    <app-gdd-accumulation-chart
      [gddData]="historicalGdd()"
      [lastPgrAppDate]="lastPgrAppDate()"
    />
  </div>

  <!-- Forecast Card -->
  <div class="forecast-card">
    <h3>7-Day Forecast</h3>
    <app-gdd-forecast-chart [forecastData]="gddForecast()" />
    @if (projectedNextAppDate()) {
      <p class="next-app-date">
        Projected next application: {{ projectedNextAppDate() | date:'MMM d, yyyy' }}
      </p>
    }
  </div>

  <!-- Settings Link -->
  <div class="settings-link">
    <a routerLink="/settings">Configure GDD Settings</a>
  </div>
</div>
```

**Chart Components:**
- `gdd-accumulation-chart.component.ts` - Bar or line chart showing daily GDD
- `gdd-forecast-chart.component.ts` - Projected GDD with visual marker for target

**Styling:**
- Follow existing soil-data page style
- Card-based layout
- Mobile-responsive
- Use PrimeNG progressbar and chart components

#### 2.3 Quick Stats Enhancement

**File:** `src/app/components/dashboard/quick-stats/quick-stats.component.ts`

**Changes:**
```typescript
export class QuickStatsComponent {
  // ... existing code ...

  private _gddService = inject(GDDService);

  // New signals
  public currentGdd = this._gddService.currentGdd;
  public gddSettings = computed(() =>
    this._settingsService.settings()?.gddSettings
  );

  // Computed display value
  public pgrAppDisplay = computed(() => {
    const displayPref = this.gddSettings()?.displayPreference || 'days';
    const days = this.daysSinceLastProductApplication();
    const gdd = this.currentGdd.value()?.accumulatedGdd;

    if (displayPref === 'gdd' && gdd !== undefined) {
      return `${Math.round(gdd)} GDD`;
    } else if (displayPref === 'both' && gdd !== undefined) {
      return `${days} days (${Math.round(gdd)} GDD)`;
    } else {
      return `${days} days`;
    }
  });
}
```

**Template Update:**
```html
<p class="stat">
  Since last PGR app: <b>{{ pgrAppDisplay() }}</b>
</p>

@if (gddSettings()?.enabled && currentGdd.value()) {
  <div class="gdd-progress">
    <p class="stat">GDD Progress:</p>
    <p-progressbar [value]="currentGdd.value()!.percentageToTarget" />
    <p class="stat-small">
      {{ currentGdd.value()!.accumulatedGdd | number:'1.0-0' }} /
      {{ currentGdd.value()!.targetGdd }} GDD
    </p>
  </div>
}
```

#### 2.4 Settings Page Enhancement

**File:** `src/app/pages/settings/settings.component.ts`

**Add GDD Settings Section:**
```html
<div class="settings-section">
  <h2>GDD Tracking</h2>

  <div class="form-field">
    <label>Enable GDD Tracking</label>
    <p-inputSwitch [(ngModel)]="gddSettings.enabled" />
  </div>

  @if (gddSettings.enabled) {
    <div class="form-field">
      <label>Base Temperature</label>
      <p-dropdown
        [(ngModel)]="gddSettings.baseTemperature"
        [options]="baseTemperatureOptions()"
        optionLabel="label"
        optionValue="value"
      />
      <small>Auto-selected based on grass type: {{ autoBaseTemp() }}°F</small>
    </div>

    <div class="form-field">
      <label>Target GDD Between PGR Applications</label>
      <p-inputNumber
        [(ngModel)]="gddSettings.targetGddInterval"
        [min]="100"
        [max]="400"
        [step]="10"
        suffix=" GDD"
      />
      <small>Typical: 200-250 GDD for cool-season, 220 GDD for warm-season</small>
    </div>

    <div class="form-field">
      <label>Display Preference in Quick Stats</label>
      <p-selectButton
        [(ngModel)]="gddSettings.displayPreference"
        [options]="[
          {label: 'Days', value: 'days'},
          {label: 'GDD', value: 'gdd'},
          {label: 'Both', value: 'both'}
        ]"
        optionLabel="label"
        optionValue="value"
      />
    </div>
  }
</div>
```

### Phase 3: Navigation & Routing

**Add GDD Page to Routes:**
```typescript
// src/app/app.routes.ts
{
  path: 'gdd-data',
  component: GDDDataComponent,
  title: 'GDD Tracking'
}
```

**Add to Mobile Navigation:**
```typescript
// Default mobile navbar items
public defaultMobileNavbarItems = [
  'dashboard',
  'entries',
  'soil-data',
  'gdd-data',  // NEW
  'analytics'
];
```

**Add to Main Menu:**
- Desktop: Add to sidebar or top navigation
- Mobile: Add to bottom navbar (configurable in settings)

---

## User Experience Design

### User Journey: First-Time Setup

1. **User navigates to Settings**
2. **Sees new "GDD Tracking" section**
   - Toggle switch: "Enable GDD Tracking"
   - Explanation text: "Track growing degree days to optimize PGR application timing"
   - Link: "Learn more about GDD"
3. **User enables GDD tracking**
   - Base temperature auto-filled based on grass type
   - Suggested target interval shown (200 GDD for cool-season)
   - User can customize if desired
4. **User logs a PGR application**
   - Creates entry with Activity: "Product Application"
   - Selects product with category "PGR"
   - System notes the date and begins GDD accumulation
5. **User views Quick Stats**
   - Now shows "GDD since last PGR app: 45 GDD"
   - Progress bar shows 45/200 (22.5%)
6. **User taps GDD stat → navigates to GDD Data page**
   - Sees detailed GDD chart
   - Sees forecast and projected next app date
   - Understands their lawn's growth pattern

### User Journey: Ongoing Use

1. **Daily: Check Quick Stats widget**
   - Glance at accumulated GDD
   - See progress toward target
2. **Weekly: View GDD Data page**
   - Check forecast
   - Plan next application
   - Review accumulation trend
3. **At ~180 GDD: System shows visual cue**
   - Progress bar turns yellow (approaching target)
   - Consider weather forecast
4. **At ~200 GDD: User applies PGR**
   - Logs entry with PGR product
   - System resets GDD counter
   - Historical GDD at application recorded
5. **Monthly: Review Analytics**
   - See all PGR applications
   - Compare actual intervals to targets
   - Adjust strategy if needed

### Visual Design Guidelines

**GDD Data Page:**
- Hero stat: Large, bold GDD number
- Color coding:
  - Green: 0-149 GDD (early)
  - Yellow: 150-199 GDD (approaching)
  - Orange: 200-249 GDD (ready)
  - Red: 250+ GDD (overdue)
- Chart: Clean, minimalist bars or lines
- Annotations: Mark PGR application dates on chart

**Quick Stats Widget:**
- Compact display
- Progress bar with color gradient
- Tappable to navigate to full page

**Settings:**
- Clear explanations for each option
- "Learn more" links to educational content
- Smart defaults based on grass type
- Visual preview of what user will see

---

## Implementation Phases

### Phase 1: MVP (Core Functionality)
**Estimated Effort:** 2-3 weeks

**Backend:**
- [ ] Add PGR product category constant
- [ ] Extend settings type with `gddSettings`
- [ ] Create GDD service with core calculation logic
- [ ] Build `/gdd/current` endpoint
- [ ] Build `/gdd/historical` endpoint
- [ ] Build `/entries/last-pgr-app` endpoint

**Frontend:**
- [ ] Create GDD service
- [ ] Create GDD data page component
- [ ] Create basic GDD chart component
- [ ] Add GDD section to settings page
- [ ] Update quick stats to show GDD
- [ ] Add routing and navigation

**Testing:**
- [ ] Unit tests for GDD calculation function
- [ ] Integration tests for GDD service
- [ ] E2E tests for GDD page and settings
- [ ] Manual testing with various grass types and locations

**Deliverables:**
- Users can enable GDD tracking
- Users can view GDD since last PGR app
- Users can see GDD on dedicated page
- Settings allow customization

### Phase 2: Enhanced Features
**Estimated Effort:** 1-2 weeks

**Backend:**
- [ ] Build `/gdd/forecast` endpoint
- [ ] Add `gddAtApplication` field to Entry model (migration)
- [ ] Store GDD value when PGR entry is created
- [ ] Create analytics endpoint for PGR timeline

**Frontend:**
- [ ] Create GDD forecast chart component
- [ ] Add projected next application date display
- [ ] Show historical GDD values on entry details
- [ ] Add "display preference" toggle in settings
- [ ] Create PGR analytics chart (GDD timeline with applications)
- [ ] Add tooltips and help text throughout

**Testing:**
- [ ] Test forecast accuracy
- [ ] Test historical data storage
- [ ] Test analytics visualizations

**Deliverables:**
- Users see projected next app date
- Historical GDD tracking
- Advanced analytics

### Phase 3: Polish & Optimization
**Estimated Effort:** 1 week

**Features:**
- [ ] Add visual alerts (color coding) when approaching target
- [ ] Improve mobile responsiveness
- [ ] Add loading states and error handling
- [ ] Add onboarding tour for first-time users
- [ ] Create "Learn about GDD" modal or page
- [ ] Optimize API calls and caching
- [ ] Add GDD export functionality

**Documentation:**
- [ ] User guide for GDD feature
- [ ] FAQ section
- [ ] Developer documentation
- [ ] API documentation

**Testing:**
- [ ] Performance testing
- [ ] Cross-browser testing
- [ ] Accessibility audit
- [ ] User acceptance testing

### Phase 4: Future Enhancements
**When Ready:**

**Advanced GDD Models:**
- [ ] Multiple concurrent GDD trackers
- [ ] Pre-emergent timing (50 GDD base 50°F for crabgrass)
- [ ] Disease pressure models
- [ ] Insect lifecycle models
- [ ] Weed germination prediction

**Smart Features:**
- [ ] Push notifications at 180 GDD, 200 GDD
- [ ] Email digest with weekly GDD summary
- [ ] AI recommendations based on historical patterns
- [ ] Weather-aware suggestions (e.g., "rain expected, apply before Thursday")

**Social Features:**
- [ ] Compare GDD progress with other users in same region
- [ ] Share GDD tracking on lawn journal
- [ ] Community insights (average intervals by grass type)

**Integrations:**
- [ ] Import GDD targets from product labels
- [ ] Link to PGR product database with recommended intervals
- [ ] Export data to CSV/PDF
- [ ] API for third-party integrations

---

## Technical Considerations

### Weather Data Accuracy

**Challenge:** Need accurate high/low temps for GDD calculation

**Current Options:**
1. **Open-Meteo API** (currently used for soil temps)
   - Pros: Reliable, historical data, free
   - Cons: Not specialized for turf management

2. **Weather.gov** (currently used for forecasts)
   - Pros: Official NOAA data, accurate
   - Cons: US-only

**Recommendation:**
- Use Open-Meteo for historical daily high/low temps
- API call: `https://api.open-meteo.com/v1/forecast`
- Parameters: `latitude`, `longitude`, `daily=temperature_2m_max,temperature_2m_min`
- Cache aggressively (historical data doesn't change)

### GDD Reset Logic

**When does GDD reset to 0?**

**Option 1: Reset on any PGR application**
- Pros: Simple, clear
- Cons: Different PGRs have different lifespans

**Option 2: Reset only on specific PGR products**
- Pros: More accurate for tank mixes
- Cons: Complex, user needs to configure which products reset counter

**Option 3: Manual reset option**
- Pros: Ultimate flexibility
- Cons: User might forget or misuse

**Recommendation: Option 1 for MVP, Option 2 for Phase 2**
- Start simple: any entry with PGR product resets counter
- Later: add product-specific GDD tracking

### Base Temperature Selection

**Auto vs. Manual:**

**Auto-selection based on grass type:**
- Cool-season → 32°F (0°C)
- Warm-season → 50°F (10°C)

**Manual override:**
- Advanced users might want 50°F base for general growth tracking
- Some users follow specific university extension recommendations

**Recommendation:**
- Default to auto-selection
- Allow manual override in settings
- Display both auto and manual values for clarity

### Performance Optimization

**Caching Strategy:**
- Cache historical GDD calculations (immutable)
- Refresh current GDD once per day
- Store calculated GDD values in database for analytics

**API Rate Limiting:**
- Open-Meteo: 10,000 calls/day (generous)
- Cache weather data per location per day
- Batch requests when possible

### Database Performance

**Query Optimization:**
- Index on `entries.date` and `entryProducts.productId`
- Filter PGR entries: JOIN with products WHERE category = 'pgr'
- Consider materialized view for GDD analytics

### Error Handling

**Missing Data Scenarios:**
- User hasn't set location → Prompt to configure
- Weather API unavailable → Show last known GDD, disable forecast
- No PGR applications logged → Show "Log your first PGR app to start tracking"
- Invalid settings → Use defaults, show warning

---

## Resources & References

### Research Papers & University Extensions

1. **Purdue University:** "Use Growing Degree Days to Better Time Your Applications"
   - https://turf.purdue.edu/use-growing-degree-days-to-better-time-your-applications/

2. **Cornell Turfgrass Program:** "Plant Growth Regulators"
   - https://turf.cals.cornell.edu/pests-and-weeds/plant-growth-regulators/

3. **University of Wisconsin-Madison:** GDD-based PGR application research
   - 200 GDD intervals for bentgrass putting greens

4. **Sportsfield Management:** "PGRs and Growing Degree Days"
   - https://sportsfieldmanagementonline.com/2017/01/10/pgrs-and-growing-degree-days/

5. **Syngenta:** "Growing Degree Days for Turf Management Explained"
   - https://www.syngentaturf.co.uk/news/productivity/growing-degree-days-turf-management-explained

### Existing GDD Tools (Competitive Analysis)

1. **GDD Tracker (Michigan State University)**
   - https://gddtracker.msu.edu/
   - Tracks multiple models: pre-emergent timing, PGR, disease pressure
   - Base temps vary by model
   - Regional focus: Midwest

2. **GreenKeeper App**
   - https://www.greenkeeperapp.com/
   - 600+ PGR GDD models
   - Automatic tracking from application date
   - Projects next application based on forecast
   - **Target audience:** Golf course superintendents
   - **Note:** Web-only, not mobile app

3. **Syngenta GDD Worksheet**
   - Excel-based manual tracking
   - User inputs daily temps
   - Calculates accumulated GDD

4. **GreenCast (Syngenta)**
   - https://www.greencastonline.com/growing-degree-days/
   - Commercial tool for turf professionals
   - Multiple location tracking

### Weather APIs

1. **Open-Meteo**
   - https://open-meteo.com/
   - Currently used in Yardvark
   - Endpoints: `/v1/forecast`, `/v1/historical`
   - Parameters: `daily=temperature_2m_max,temperature_2m_min`

2. **Weather.gov (NOAA)**
   - https://www.weather.gov/documentation/services-web-api
   - Currently used in Yardvark
   - US-only, highly accurate

### PGR Product Information

**Common PGRs for Homeowners:**
1. **Trinexapac-ethyl (TE)**
   - Brands: Primo Maxx, T-Nex, Envoy Plus
   - Interval: 200-250 GDD
   - Mode: Inhibits gibberellic acid

2. **Paclobutrazol**
   - Brands: Trimmit, Legacy
   - Interval: 270-310 GDD
   - Mode: Triazole, systemic

3. **Flurprimidol**
   - Brand: Cutless
   - Less common for homeowner use

### Technical References

1. **Growing Degree Day Calculation (Wikipedia)**
   - https://en.wikipedia.org/wiki/Growing_degree-day
   - Mathematical formulas and variations

2. **Climate Smart Farming GDD Calculator**
   - https://climatesmartfarming.org/tools/csf-growing-degree-day-calculator/
   - Example implementation

### Yardvark-Specific Files

**Key files to reference during implementation:**

1. **Existing GDD Function:**
   - `src/app/utils/lawnCalculatorUtils.ts` - Line 58-80

2. **Similar Pages (Templates):**
   - `src/app/pages/soil-data/soil-data.component.ts`
   - `src/app/pages/analytics/analytics.component.ts`

3. **Settings Structure:**
   - `backend/src/modules/settings/models/settings.types.ts`
   - `src/app/pages/settings/settings.component.ts`

4. **Quick Stats Widget:**
   - `src/app/components/dashboard/quick-stats/quick-stats.component.ts`

5. **Weather Services:**
   - `src/app/services/weather-service.ts`
   - `src/app/services/soil-temperature.service.ts`

6. **Entry Tracking:**
   - `backend/src/modules/entries/models/entries.model.ts`
   - `src/app/services/entries.service.ts`

---

## Summary & Next Steps

### What We Learned

1. **GDD is scientifically validated** for PGR timing in turf management
2. **Yardvark already has 90% of the infrastructure** needed for this feature
3. **User request is well-aligned** with industry best practices
4. **Implementation is straightforward** - mostly connecting existing pieces

### Why This Feature Makes Sense

1. **Educational value:** Teaches users about plant physiology
2. **Cost savings:** Fewer applications, better results
3. **Differentiation:** Few consumer lawn apps track GDD
4. **Professional-grade:** Brings golf course management techniques to homeowners
5. **Extensible:** Foundation for future pest/disease/weed models

### Recommended Approach

**Start with Phase 1 MVP:**
- Focus on core GDD tracking and display
- Leverage existing infrastructure
- Get user feedback early

**Key Success Metrics:**
- % of users who enable GDD tracking
- Engagement with GDD data page
- Reduction in "days since last product app" vs. "GDD since last app"
- User satisfaction surveys

**Potential Challenges:**
- User education (what is GDD?)
- Weather data accuracy
- Handling edge cases (missed applications, location changes)

### Development Checklist

Before starting implementation:
- [ ] Review this plan with team
- [ ] Confirm weather API strategy
- [ ] Design mockups for GDD page and settings
- [ ] Prioritize Phase 1 features
- [ ] Set up testing environment
- [ ] Create user education content (tooltips, help text)

---

## Appendix: FAQ

### For Users

**Q: What if I don't use PGRs?**
A: GDD tracking is optional. If you don't apply PGRs, you can ignore this feature or use it to track general grass growth patterns.

**Q: Can I track GDD for multiple purposes?**
A: Phase 1 focuses on PGR timing. Future versions may support multiple GDD trackers for different applications (pre-emergent, disease, etc.).

**Q: What if I miss an application?**
A: The system continues accumulating GDD. When you apply later, it records the actual GDD interval. You can review your history to adjust future timing.

**Q: How accurate is this?**
A: GDD is based on weather data from Open-Meteo and Weather.gov, which are highly accurate. However, microclimates (e.g., shaded areas) may vary. Use GDD as a guide, not an absolute rule.

### For Developers

**Q: Why not use soil temperature for GDD?**
A: PGR efficacy is based on air temperature and plant metabolism, not soil temperature. Soil temp is used for germination models.

**Q: Should we support Celsius and Fahrenheit?**
A: Yes. Base temperatures need to be converted based on user's preference. Store in database in one unit (recommend Fahrenheit for consistency with research), convert for display.

**Q: What about different GDD models (e.g., Baskerville-Emin)?**
A: Phase 1 uses the simple average method, which is industry-standard for PGRs. Advanced models can be added in future phases if user demand exists.

**Q: How do we handle users in Southern Hemisphere?**
A: Growing season dates will be different (winter in June-August). Ensure date calculations are season-agnostic. Consider adding "active season" detection.

**Q: What if weather API is down?**
A: Cache last known GDD value. Show warning that data is stale. Provide manual entry option as backup.

---

**End of Document**

This feature plan is a living document. Update as requirements evolve and user feedback is gathered.