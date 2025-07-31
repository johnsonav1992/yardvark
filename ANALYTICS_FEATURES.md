# Analytics Features Implementation Guide

## Original User Feature Request

> "Add to the Analytics page Average Days between mowing, Average Days between Fertilizing on a graph by the month. Some of us spoonfeed. Also is it possible to add the lbs of N from the analytics page under the fertilizer product after selection when adding it to an entry log with lawn segments selected. That way you can dynamically see how much N is going down. Lastly total AI of a product for the year. This is helpful for herbicides and pre emergents"

## Implementation Status

### ✅ COMPLETED: Implementation #1 - Average Days Between Activities

**What was implemented:**
- Database migrations: `analytics-8-average-days-between.ts` and `analytics-9-fix-fertilizer-query.ts`
- Frontend chart component integrated into analytics page
- Shows monthly mowing vs fertilizing frequency patterns
- **Critical Fix**: Properly filters fertilizer products (not all product applications)

**Key Files Modified:**
- Backend:
  - `/backend/src/migrations/1753523279834-analytics-8-average-days-between.ts`
  - `/backend/src/migrations/1753523360245-analytics-9-fix-fertilizer-query.ts`
  - `/backend/src/modules/analytics/models/analytics.types.ts`
- Frontend:
  - `/src/app/types/analytics.types.ts`
  - `/src/app/utils/analyticsUtils.ts` (added `getAverageDaysBetweenChartConfig`)
  - `/src/app/pages/analytics/analytics.component.ts`

**Database Query Logic:**
- Mowing: Checks `activity_id = 1` 
- Fertilizing: Uses `UNION ALL` to join entries with `products.category = 'fertilizer'`
- Monthly aggregation with proper LAG() window functions
- Handles null data gracefully

**Test Results:**
```json
"averageDaysBetweenData": [
  {
    "month": "2025-03-01T00:00:00+00:00",
    "year": 2025,
    "monthNumber": 3,
    "avgMowingDays": 24.5,
    "avgFertilizingDays": 0.0
  },
  {
    "month": "2025-04-01T00:00:00+00:00", 
    "year": 2025,
    "monthNumber": 4,
    "avgMowingDays": 3.8,
    "avgFertilizingDays": 4.0
  }
]
```

---

## 🔄 PENDING: Implementation #2 - Dynamic Nitrogen Display in Entry Creation

**Goal:** Show real-time nitrogen calculations when selecting fertilizer products during entry creation.

### Frontend Implementation Plan

**1. Enhanced Product Selector Component**
File: `/src/app/components/products/products-selector/products-selector.component.ts`

Add computed property:
```typescript
public selectedProductNitrogen = computed(() => {
  const selectedProducts = this.selectedProducts();
  const selectedLawnSegmentIds = this.selectedLawnSegmentIds(); // from parent
  
  if (!selectedProducts.length || !selectedLawnSegmentIds.length) return null;
  
  return this._analyticsService.calculateNitrogenForProducts(
    selectedProducts,
    selectedLawnSegmentIds
  );
});
```

**2. Template Enhancement**
Add to product selector template:
```html
@if (selectedProductNitrogen()) {
  <div class="nitrogen-display">
    <p-message 
      severity="info" 
      [text]="'Estimated N: ' + selectedProductNitrogen() + ' lbs per 1000 sq ft'"
    />
  </div>
}
```

**3. Analytics Service Extension**
File: `/src/app/services/analytics.service.ts`

Add methods:
```typescript
public calculateNitrogenForProducts(
  products: SelectedProduct[],
  lawnSegmentIds: number[]
): number {
  const totalSquareFeet = this.getTotalSquareFeetForSegments(lawnSegmentIds);
  
  return products.reduce((total, product) => {
    const nitrogenPercentage = this.extractNitrogenFromAnalysis(product.guaranteedAnalysis);
    const productNitrogen = this.calculateProductNitrogen(
      product.quantity,
      product.quantityUnit,
      nitrogenPercentage,
      totalSquareFeet
    );
    return total + productNitrogen;
  }, 0);
}

private getTotalSquareFeetForSegments(lawnSegmentIds: number[]): number {
  // Implementation to calculate total square footage from selected lawn segments
}

private extractNitrogenFromAnalysis(guaranteedAnalysis: string): number {
  // Parse "24-0-6" format to get nitrogen percentage (first number)
  const parts = guaranteedAnalysis.split('-');
  return parseFloat(parts[0]) || 0;
}

private calculateProductNitrogen(
  quantity: number,
  unit: string,
  nitrogenPercentage: number,
  totalSquareFeet: number
): number {
  // Convert quantity to pounds, calculate nitrogen content, normalize per 1000 sq ft
  const isLiquid = unit === 'oz' || unit === 'fl oz';
  const quantityInPounds = isLiquid ? quantity * 0.1 : quantity;
  const nitrogenInPounds = (quantityInPounds * nitrogenPercentage) / 100;
  return (nitrogenInPounds / totalSquareFeet) * 1000; // per 1000 sq ft
}
```

**Integration Points:**
- Entry creation flow: `/src/app/components/entries/entry-dialog/`
- Lawn segment selection logic
- Existing product selection workflow

---

## 🔄 PENDING: Implementation #3 - Total Active Ingredient (AI) Tracking

**Goal:** Track total active ingredient applied for herbicides and pre-emergents throughout the year.

### Frontend Implementation Plan

**1. New Chart Component**
File: `/src/app/components/analytics/total-ai-chart/total-ai-chart.component.ts`

```typescript
@Component({
  selector: 'total-ai-chart',
  imports: [ChartModule, CardModule, LoadingSpinnerComponent],
  template: `
    <p-card header="Total Active Ingredient Applied">
      @if (analyticsData.isLoading()) {
        <chart-loader />
      } @else {
        <p-chart
          type="line"
          [data]="chartData()"
          [options]="options()"
          height="400px"
        />
      }
    </p-card>
  `
})
export class TotalAiChartComponent {
  // Similar structure to existing chart components
  // Focus on cumulative AI tracking over time
}
```

**2. AI Product Selector Component**
File: `/src/app/components/analytics/ai-product-selector/ai-product-selector.component.ts`

Features:
- Dropdown to select specific herbicide/pre-emergent products
- Shows running total of AI applied throughout the year
- Tracks by product brand/type for accurate AI calculations
- Filter by product category (herbicide, pre-emergent)

**3. Chart Configuration Utility**
File: `/src/app/utils/analyticsUtils.ts`

Add function:
```typescript
export const getTotalAiChartConfig = (
  analyticsData: AnalyticsRes | undefined,
  selectedProductId: number | null,
  uiOptions: { isDarkMode: boolean; isMobile: boolean }
): AnalyticsChartConfig<'line'> => {
  // Implementation for AI tracking chart configuration
  // Line chart showing cumulative AI over time
  // Different lines for different products or categories
};
```

### Backend Implementation Plan

**1. Extend Analytics Function**
Create new migration: `analytics-10-ai-tracking.ts`

Add to existing `get_user_analytics_v2()` function:
```sql
-- Track active ingredient totals by product category
SELECT json_agg(row_to_json(ai_data)) INTO ai_tracking_data
FROM (
  SELECT 
    p.id as product_id,
    p.name as product_name,
    p.brand,
    p.guaranteed_analysis,
    p.category,
    SUM(ep.product_quantity) as total_quantity_applied,
    EXTRACT(year FROM e.date) as application_year,
    ARRAY_AGG(
      json_build_object(
        'date', e.date::DATE,
        'quantity', ep.product_quantity,
        'unit', ep.product_quantity_unit
      ) ORDER BY e.date
    ) as applications
  FROM entries e
  JOIN entry_products ep ON e.id = ep.entry_id  
  JOIN products p ON ep.product_id = p.id
  WHERE e.user_id = p_user_id
    AND p.category IN ('herbicide', 'pre-emergent')
    AND EXTRACT(year FROM e.date) = EXTRACT(year FROM CURRENT_DATE)
  GROUP BY p.id, p.name, p.brand, p.guaranteed_analysis, p.category, application_year
  ORDER BY total_quantity_applied DESC
) ai_data;
```

**2. Update Types**
Backend: `/backend/src/modules/analytics/models/analytics.types.ts`
Frontend: `/src/app/types/analytics.types.ts`

```typescript
export type AiTrackingRowRes = {
  productId: number;
  productName: string;
  brand: string;
  guaranteedAnalysis: string;
  category: string;
  totalQuantityApplied: number;
  applicationYear: number;
  applications: Array<{
    date: string;
    quantity: number;
    unit: string;
  }>;
};

// Add to AnalyticsRes
export type AnalyticsRes = {
  // ... existing properties
  aiTrackingData: AiTrackingRowRes[];
};
```

### Integration Points

**Analytics Page Updates:**
- Add new charts to existing 2-column grid layout in `/src/app/pages/analytics/analytics.component.html`
- Follow existing card-based design patterns
- Maintain responsive behavior for mobile

**Entry Creation Flow:**
- Integrate nitrogen display into existing product selection workflow
- Use existing UI patterns (p-message, info severity)
- Leverage existing lawn segment selection logic

**Data Architecture:**
- Extend existing `AnalyticsRes` type with new data structures
- Maintain single API endpoint pattern (`/analytics`)
- Use existing `httpResource` reactive data fetching

---

## Architecture Patterns to Follow

### Frontend Patterns
- **Chart Components**: Use Chart.js with PrimeNG Chart wrapper (`primeng/chart`)
- **Data Fetching**: Angular's `httpResource` for reactive data
- **Chart Configuration**: Utility functions in `/src/app/utils/analyticsUtils.ts`
- **Responsive Design**: `isMobile()` conditions for mobile/desktop layouts
- **Theme Support**: `isDarkMode()` with `getPrimeNgHexColor()` for colors
- **Type Safety**: Strong TypeScript typing throughout

### Backend Patterns
- **Single Endpoint**: `/analytics` returns all analytics data
- **PostgreSQL Functions**: Complex queries in stored functions
- **Migration Strategy**: Incremental migrations for database changes
- **Type Consistency**: Backend types mirror frontend types

### UI/UX Patterns
- **Card Layout**: Analytics wrapped in PrimeNG cards
- **Loading States**: Skeleton loaders and spinners
- **Empty States**: "No data available" messages
- **Interactive Tooltips**: Hover/click for additional details
- **Info Popovers**: Contextual help with descriptions

---

## Product Categories Reference

From `/backend/src/modules/products/models/products.types.ts`:

```typescript
export const PRODUCT_TYPES = {
  LAWN_FERTILIZER: 'fertilizer',
  PRE_EMERGENT: 'pre-emergent',
  POST_EMERGENT: 'post-emergent', 
  BIO_STIMULANT: 'bio-stimulant',
  INSECT_CONTROL: 'insect-control',
  PLANT_FERTILIZER: 'plant-fertilizer',
  SEED: 'seed',
  FUNGUS_CONTROL: 'fungus-control',
  OTHER: 'other',
};
```

## Activity IDs Reference

From `/backend/src/constants/activities.constants.ts`:

```typescript
export const ACTIVITY_IDS = {
  MOW: 1,
  EDGE: 2,
  TRIM: 3,
  DETHATCH: 4,
  BLOW: 5,
  AERATE: 6,
  WATER: 7,
  LAWN_LEVELING: 8,
  PRODUCT_APPLICATION: 9,
};
```

---

## Testing Notes

**Migration Testing:**
```sql
-- Test updated analytics function
SELECT get_user_analytics_v2('your-user-id-here');

-- Pretty print results
SELECT jsonb_pretty(get_user_analytics_v2('your-user-id-here')::jsonb);
```

**Expected Benefits:**
1. **Consistency**: Follows established codebase patterns
2. **Performance**: Leverages existing PostgreSQL analytics architecture
3. **Type Safety**: Strong typing throughout the stack
4. **Responsive**: Works on mobile and desktop
5. **Themeable**: Automatic dark/light mode support
6. **Maintainable**: Uses existing utilities and services

---

*Last Updated: January 31, 2025*
*Implementation #1 Status: ✅ Complete and tested*
*Implementation #2 & #3 Status: 🔄 Ready for development*