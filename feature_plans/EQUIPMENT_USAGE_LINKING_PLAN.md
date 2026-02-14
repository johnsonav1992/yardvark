# Equipment Usage Linking Feature Plan

**Created:** December 13, 2025
**Status:** Planned
**Priority:** Medium

---

## Table of Contents

1. [Overview](#1-overview)
2. [User Stories](#2-user-stories)
3. [Feature Requirements](#3-feature-requirements)
4. [Technical Implementation](#4-technical-implementation)
5. [UI/UX Design](#5-uiux-design)
6. [Implementation Phases](#6-implementation-phases)
7. [Future Considerations](#7-future-considerations)

---

## 1. Overview

### Background

Currently, the entry log system and equipment system are completely separate. Users can log lawn care activities (mowing, edging, product application, etc.) and they can manage their equipment with maintenance records, but there's no way to connect the two.

### Feature Summary

Add the ability to optionally link equipment to entry logs, allowing users to track which equipment they used for each lawn care session. This creates a usage history per piece of equipment without the overhead of tracking hours.

### What This Feature Is NOT

- **Not hours tracking** - We're tracking usage count (number of entries), not time spent
- **Not equipment maintenance as an activity** - Maintenance records stay separate on the equipment page
- **Not required** - Equipment linking is completely optional on entries

---

## 2. User Stories

| Priority    | User Story                                                                                                                                     |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Must Have   | As a user, I want to select which equipment I used when creating an entry, so I can track my equipment usage over time                         |
| Must Have   | As a user, I want to see how many times I've used each piece of equipment, so I can understand usage patterns                                  |
| Must Have   | As a user, I want to view the usage history for a piece of equipment, so I can see when and how it was used                                    |
| Should Have | As a user, I want to link multiple pieces of equipment to a single entry, so I can accurately record a session where I used my mower and edger |
| Should Have | As a user, I want to edit equipment links on existing entries, so I can correct or add equipment retroactively                                 |

---

## 3. Feature Requirements

### Functional Requirements

| ID   | Requirement                                                             | Priority    |
| ---- | ----------------------------------------------------------------------- | ----------- |
| FR-1 | Add optional "Equipment Used" multi-select field to entry creation form | Must Have   |
| FR-2 | Store many-to-many relationship between entries and equipment           | Must Have   |
| FR-3 | Display linked equipment on entry view page                             | Must Have   |
| FR-4 | Allow editing equipment links on existing entries                       | Must Have   |
| FR-5 | Display usage count on equipment preview cards                          | Must Have   |
| FR-6 | Display usage history table on equipment detail page                    | Must Have   |
| FR-7 | Link from usage history to entry view page                              | Should Have |

### Non-Functional Requirements

- Equipment selection should not add significant friction to entry creation
- Usage count should be accurate (exclude soft-deleted entries)
- Performance should not degrade with large usage histories (paginate if needed)

---

## 4. Technical Implementation

### 4.1 Database Schema

**New Junction Table: `entry_equipment`**

```sql
CREATE TABLE entry_equipment (
  entry_id INTEGER NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  PRIMARY KEY (entry_id, equipment_id)
);

CREATE INDEX idx_entry_equipment_entry_id ON entry_equipment(entry_id);
CREATE INDEX idx_entry_equipment_equipment_id ON entry_equipment(equipment_id);
```

### 4.2 Backend Changes

#### Models

**Entry Model** (`/backend/src/modules/entries/models/entries.model.ts`)

Add ManyToMany relationship:

```typescript
@ManyToMany(() => Equipment, (equipment) => equipment.entries)
@JoinTable({
  name: 'entry_equipment',
  joinColumn: { name: 'entry_id', referencedColumnName: 'id' },
  inverseJoinColumn: { name: 'equipment_id', referencedColumnName: 'id' },
})
equipment: Equipment[];
```

**Equipment Model** (`/backend/src/modules/equipment/models/equipment.model.ts`)

Add inverse relationship:

```typescript
@ManyToMany(() => Entry, (entry) => entry.equipment)
entries: Entry[];
```

#### Services

**Entries Service** - Update to:

- Include `equipment: true` in all find relations
- Accept `equipmentIds` in create/update methods
- Map equipment IDs to relations on save

**Equipment Service** - Add:

- `usageCount` computed field when fetching equipment list
- `getEquipmentUsageHistory(equipmentId)` method

#### API Endpoints

| Method | Endpoint                       | Change                                       |
| ------ | ------------------------------ | -------------------------------------------- |
| POST   | `/entries`                     | Accept `equipmentIds` array                  |
| POST   | `/entries/batch`               | Accept `equipmentIds` array per entry        |
| PUT    | `/entries/:id`                 | Accept `equipmentIds` array                  |
| GET    | `/entries/*`                   | Return `equipment` array                     |
| GET    | `/equipment`                   | Return `usageCount` per equipment            |
| GET    | `/equipment/:id/usage-history` | **NEW** - Return entries linked to equipment |

### 4.3 Frontend Changes

#### Types

**Entry Types** (`/src/app/types/entries.types.ts`)

```typescript
export type Entry = {
  // ... existing fields ...
  equipment: Pick<Equipment, "id" | "name" | "brand" | "imageUrl">[];
};

export type EntryCreationRequest = {
  // ... existing fields ...
  equipmentIds: number[];
};
```

**Equipment Types** (`/src/app/types/equipment.types.ts`)

```typescript
export type Equipment = {
  // ... existing fields ...
  usageCount?: number;
};
```

#### Components

| Component              | File                                                    | Changes                          |
| ---------------------- | ------------------------------------------------------- | -------------------------------- |
| Add Entry              | `/src/app/pages/entry-log/add-entry/`                   | Add equipment multi-select field |
| Entry View             | `/src/app/pages/entry-log/entry-view/`                  | Display equipment, allow editing |
| Equipment Preview Card | `/src/app/components/equipment/equipment-preview-card/` | Show usage count                 |
| Equipment View         | `/src/app/pages/equipment/equipment-view/`              | Add usage history table          |

---

## 5. UI/UX Design

### Add Entry Form

Add "Equipment Used (optional)" multi-select after lawn segments:

- Uses PrimeNG MultiSelect component
- Shows equipment as "Brand Name" (e.g., "Honda HRX217")
- Optional field - can be left empty
- Consistent with existing multi-select styling

### Entry View Page

Add "Equipment Used" section:

- Read mode: List equipment names, or "N/A" if none
- Edit mode: Multi-select dropdown (same as add form)

### Equipment Preview Card

Add usage count below last maintenance:

- Format: "Usage Count: X entries"
- Shows 0 if never used

### Equipment View Page

Add "Usage History" section after maintenance history:

- Paginated table (5 rows per page)
- Columns: Date, Title, Activities, View button
- Empty state: "This equipment has not been used in any entries yet."
- View button links to entry detail page

---

## 6. Implementation Phases

### Phase 1: Backend Foundation

1. Create database migration for `entry_equipment` table
2. Update Entry model with ManyToMany relationship
3. Update Equipment model with inverse relationship
4. Update EntryCreationRequest types

### Phase 2: Backend Integration

5. Update EntriesService (create, update, fetch methods)
6. Update EquipmentService (add usageCount, usage history)
7. Add usage history endpoint to EquipmentController
8. Update entry response mapping utility

### Phase 3: Frontend - Entry Side

9. Update frontend Entry types
10. Update Add Entry form with equipment multi-select
11. Update Entry View with equipment display/edit

### Phase 4: Frontend - Equipment Side

12. Update frontend Equipment types
13. Update Equipment Preview Card with usage count
14. Update Equipment View with usage history table
15. Add equipment service method for usage history

### Phase 5: Testing & Polish

16. Test cascade deletion behavior
17. Verify soft-deleted entries excluded from counts
18. Test editing equipment on existing entries
19. Verify batch entry creation works with equipment

---

## 7. Future Considerations

These are explicitly **out of scope** for this feature but may be considered later:

| Idea                            | Notes                                                             |
| ------------------------------- | ----------------------------------------------------------------- |
| Hours/duration tracking         | Add optional hours field per equipment per entry                  |
| Equipment suggestions           | Suggest equipment based on selected activities (mower for mowing) |
| Equipment maintenance reminders | "You've used this mower 50 times since last maintenance"          |
| Link maintenance to entries     | "I did this maintenance after entry X"                            |
| Equipment filtering on entries  | Search entries by equipment used                                  |

---

## Critical Files Reference

### Backend

- `/backend/src/modules/entries/models/entries.model.ts`
- `/backend/src/modules/equipment/models/equipment.model.ts`
- `/backend/src/modules/entries/services/entries.service.ts`
- `/backend/src/modules/equipment/services/equipment.service.ts`
- `/backend/src/modules/equipment/controllers/equipment.controller.ts`
- `/backend/src/modules/entries/utils/entryUtils.ts`

### Frontend

- `/src/app/types/entries.types.ts`
- `/src/app/types/equipment.types.ts`
- `/src/app/services/equipment.service.ts`
- `/src/app/pages/entry-log/add-entry/add-entry.component.ts`
- `/src/app/pages/entry-log/add-entry/add-entry.component.html`
- `/src/app/pages/entry-log/entry-view/entry-view.component.ts`
- `/src/app/pages/entry-log/entry-view/entry-view.component.html`
- `/src/app/components/equipment/equipment-preview-card/equipment-preview-card.component.html`
- `/src/app/pages/equipment/equipment-view/equipment-view.component.ts`
- `/src/app/pages/equipment/equipment-view/equipment-view.component.html`
