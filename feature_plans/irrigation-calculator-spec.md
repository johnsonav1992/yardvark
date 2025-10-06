# Irrigation Calculator Specification

## Overview
Smart watering calculator that uses soil data (moisture, temperature, type) to determine optimal watering schedule and amounts.

## Core Inputs
- **Current soil moisture %** (from sensors or manual input)
- **Current soil temperature** 
- **Soil type** (clay, loam, sand - affects water retention)
- **Lawn area** (square feet)
- **Weather forecast** (optional integration for advanced predictions)

## Key Calculations

### Water Holding Capacity
Based on soil type:
- **Clay**: High water retention, slow drainage
- **Loam**: Balanced retention and drainage  
- **Sand**: Low retention, fast drainage

### Evapotranspiration (ET) Rate
Combined water loss from evaporation + plant transpiration.

**Factors affecting ET:**
- Temperature (higher = more ET)
- Humidity (lower = more ET)
- Wind speed (more = more ET)
- Solar radiation/sunlight
- Grass type (cool vs warm season)

**Typical rates:**
- Cool season grass: 0.1-0.3 inches/day
- Warm season grass: 0.15-0.25 inches/day
- Peak summer: up to 0.4 inches/day

### Core Formulas
- **Soil water deficit** = (field capacity - current moisture) × root depth
- **Daily ET rate** based on temperature/season
- **Days until next watering** = remaining moisture / daily ET rate
- **Optimal watering amount** to reach field capacity without runoff

## Outputs
- **Next watering date**
- **Recommended water amount** (gallons or inches)
- **Watering frequency** (days between waterings)
- **Current soil status** (optimal, dry, oversaturated)

## Implementation Plan
1. Create new calculator component using existing fertilizer-calculator pattern
2. Add soil science utilities to `lawnCalculatorUtils.ts`
3. Include presets for common soil types
4. Add seasonal/temperature adjustments
5. Optional: Weather API integration for enhanced predictions

## Technical Notes
- Follow existing calculator structure and styling
- Reuse input patterns and validation from fertilizer calculator
- Consider adding visual indicators for soil moisture levels
- Include help popovers explaining soil types and optimal ranges