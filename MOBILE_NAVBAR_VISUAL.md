# Mobile Bottom Navbar - Visual Guide

## Mobile View Layout

```
┌─────────────────────────────────────┐
│           HEADER                     │
│  [Logo]              [Avatar]        │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│                                      │
│                                      │
│         MAIN CONTENT AREA            │
│                                      │
│                                      │
│                                      │
│                                      │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│ BOTTOM NAVIGATION BAR (Fixed)        │
├──────────┬──────────┬──────────┬────┤
│    📊    │    📅    │    📦    │  ☰ │
│ Dashboard│Entry Log │ Products │More│
└──────────┴──────────┴──────────┴────┘
```

## Bottom Navbar Components

### Primary Navigation Items (4 customizable slots)
```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│   Icon   │  │   Icon   │  │   Icon   │  │   Icon   │
│  Label   │  │  Label   │  │  Label   │  │  Label   │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

### "More" Menu (Drawer from Bottom)
```
┌─────────────────────────────────────┐
│  More Options                    [×] │
├─────────────────────────────────────┤
│  🔧 Equipment                        │
│  🧪 Soil data                        │
│  🧮 Calculators                      │
├─────────────────────────────────────┤
│  ⚙️  Customize navbar                │
│  💬 Give feedback                    │
│  🌙 Dark Mode          [toggle]      │
└─────────────────────────────────────┘
```

## Customization Dialog

```
┌─────────────────────────────────────┐
│  Customize Navigation Bar        [×] │
├─────────────────────────────────────┤
│ Select exactly 4 items to display    │
│ in your bottom navigation bar.       │
│                                      │
│ Selected: 4 / 4                      │
├─────────────────────────────────────┤
│  ┌────────┐  ┌────────┐             │
│  │   📊   │  │   📅   │             │
│  │Dashbo..│  │Entry..│             │
│  │   ✓    │  │   ✓    │             │
│  └────────┘  └────────┘             │
│  ┌────────┐  ┌────────┐             │
│  │   🧪   │  │   📦   │             │
│  │Soil... │  │Product │             │
│  │        │  │   ✓    │             │
│  └────────┘  └────────┘             │
│  ┌────────┐  ┌────────┐             │
│  │   🔧   │  │   📈   │             │
│  │Equipm..│  │Analyt..│             │
│  │        │  │   ✓    │             │
│  └────────┘  └────────┘             │
│  ┌────────┐                          │
│  │   🧮   │                          │
│  │Calcul..│                          │
│  │        │                          │
│  └────────┘                          │
├─────────────────────────────────────┤
│              [Cancel]  [Save]        │
└─────────────────────────────────────┘
```

## Visual States

### Normal State
- Icons: Gray color
- Labels: Small, gray text
- Background: Surface color

### Active/Selected State
- Icons: Primary color (blue)
- Labels: Primary color (blue)
- Visual indicator showing current route

### Hover/Touch State
- Slight color change to primary color
- Smooth transition animation

### Dark Mode
- Background: Dark surface color
- Icons/Labels: Light gray
- Active items: Light primary color
- Shadows: Darker and more prominent

## Responsive Behavior

### Mobile Portrait (< 900px width)
✅ Shows bottom navbar
✅ Hides sidebar
✅ Adds bottom padding to content

### Mobile Landscape (< 900px width)
✅ Shows bottom navbar
✅ Same behavior as portrait

### Tablet/Desktop (>= 900px width)
❌ Hides bottom navbar
✅ Shows traditional sidebar
❌ No bottom padding

## Safe Areas (Notched Devices)

The bottom navbar automatically handles safe areas:
- iPhone notches
- Android gesture bars
- Home indicators

```
┌─────────────────────────────────────┐
│    📊      📅      📦      ☰        │
│ Dashboard EntryLog Products More    │
├─────────────────────────────────────┤
│  ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■  │ ← Safe area padding
└─────────────────────────────────────┘
```

## Animation & Transitions

### Opening More Menu
- Drawer slides up from bottom
- Smooth 300ms transition
- Overlay darkens background

### Switching Navigation Items
- Instant route change
- Active indicator moves smoothly
- Content transitions normally

### Customization Changes
- Items update immediately
- No page reload required
- Smooth state transition

## Accessibility

- ✅ Touch-friendly 60px height
- ✅ Minimum 44px touch targets
- ✅ Clear visual feedback
- ✅ Semantic HTML structure
- ✅ Keyboard navigation support (desktop)
- ✅ Screen reader friendly labels
