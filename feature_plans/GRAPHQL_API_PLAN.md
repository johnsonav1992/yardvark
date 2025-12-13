# Adding Apollo GraphQL Server to Yardvark Backend

## Overview

This document outlines how to add an Apollo GraphQL server alongside the existing REST API in the Yardvark NestJS backend.

**Difficulty: Low-Medium**
**Estimated effort: 1-2 focused sessions**

Your architecture is ideal for GraphQL because:
- NestJS has first-class Apollo integration via `@nestjs/graphql`
- Business logic already lives in injectable services
- TypeORM entities have relationships defined (ManyToMany, OneToMany)
- Auth0 JWT auth can be adapted for GraphQL context

---

## Step 1: Install Dependencies

```bash
cd backend
npm install @nestjs/graphql @nestjs/apollo @apollo/server graphql
```

| Package | Purpose |
|---------|---------|
| `@nestjs/graphql` | NestJS GraphQL integration |
| `@nestjs/apollo` | Apollo Server adapter for NestJS |
| `@apollo/server` | Apollo Server v4 |
| `graphql` | GraphQL core library |

---

## Step 2: Create GraphQL Module Configuration

Create a new file to configure Apollo Server:

**File: `src/graphql/graphql.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: process.env.NODE_ENV !== 'production',
      context: ({ req }) => ({ req, user: req.user }),
    }),
  ],
})
export class AppGraphQLModule {}
```

**Key options:**
- `autoSchemaFile` - Generates schema from TypeScript decorators (code-first)
- `playground` - Enables GraphQL Playground UI in development
- `context` - Passes request/user to resolvers for auth

---

## Step 3: Register in AppModule

**File: `src/app.module.ts`**

Add the GraphQL module import:

```typescript
import { AppGraphQLModule } from './graphql/graphql.module';

@Module({
  imports: [
    // ... existing imports
    AppGraphQLModule,
  ],
})
export class AppModule {}
```

---

## Step 4: Create GraphQL Types

You have two approaches:

### Option A: Add Decorators to Existing Entities (Recommended for speed)

Modify entity files to add GraphQL decorators alongside TypeORM decorators:

**Example: `src/modules/entries/models/entries.model.ts`**

```typescript
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';

@ObjectType()  // Add this
@Entity('entries')
export class Entry {
  @Field(() => ID)  // Add this
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column({ type: 'date' })
  date: string;

  @Field(() => [Activity])  // For relations
  @ManyToMany(() => Activity)
  activities: Activity[];

  // ... other fields
}
```

### Option B: Separate GraphQL Types (Better separation of concerns)

Create dedicated GraphQL type files:

**File: `src/graphql/types/entry.type.ts`**

```typescript
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class EntryType {
  @Field(() => ID)
  id: number;

  @Field()
  title: string;

  @Field()
  date: string;

  @Field(() => [ActivityType])
  activities: ActivityType[];
}
```

---

## Step 5: Create Resolvers

Resolvers connect GraphQL queries/mutations to your existing services.

**File: `src/modules/entries/resolvers/entries.resolver.ts`**

```typescript
import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Entry } from '../models/entries.model';
import { EntriesService } from '../services/entries.service';
import { GqlAuthGuard } from '../../../guards/gql-auth.guard';
import { CreateEntryInput } from '../inputs/create-entry.input';

@Resolver(() => Entry)
@UseGuards(GqlAuthGuard)
export class EntriesResolver {
  constructor(private readonly entriesService: EntriesService) {}

  @Query(() => [Entry], { name: 'entries' })
  async getEntries(@Context() ctx: any) {
    return this.entriesService.getEntries(ctx.user.userId);
  }

  @Query(() => Entry, { name: 'entry' })
  async getEntry(@Args('id') id: number, @Context() ctx: any) {
    return this.entriesService.getEntryById(ctx.user.userId, id);
  }

  @Mutation(() => Entry)
  async createEntry(
    @Args('input') input: CreateEntryInput,
    @Context() ctx: any,
  ) {
    return this.entriesService.createEntry(ctx.user.userId, input);
  }

  @Mutation(() => Boolean)
  async deleteEntry(@Args('id') id: number, @Context() ctx: any) {
    await this.entriesService.deleteEntry(ctx.user.userId, id);
    return true;
  }
}
```

**Input types for mutations:**

**File: `src/modules/entries/inputs/create-entry.input.ts`**

```typescript
import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class CreateEntryInput {
  @Field()
  title: string;

  @Field()
  date: string;

  @Field(() => [Int], { nullable: true })
  activityIds?: number[];

  @Field(() => [Int], { nullable: true })
  lawnSegmentIds?: number[];
}
```

---

## Step 6: Create GraphQL Auth Guard

Adapt existing JWT auth for GraphQL context:

**File: `src/guards/gql-auth.guard.ts`**

```typescript
import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
```

---

## Step 7: Register Resolvers in Modules

Add resolvers to each feature module:

**File: `src/modules/entries/entries.module.ts`**

```typescript
import { EntriesResolver } from './resolvers/entries.resolver';

@Module({
  providers: [
    EntriesService,
    EntriesResolver,  // Add resolver
  ],
})
export class EntriesModule {}
```

---

## Modules to Add Resolvers For

| Module | Queries | Mutations |
|--------|---------|-----------|
| Entries | `entries`, `entry(id)` | `createEntry`, `updateEntry`, `deleteEntry` |
| Products | `products`, `product(id)` | `createProduct`, `hideProduct` |
| Equipment | `equipment`, `equipmentItem(id)` | `createEquipment`, `updateEquipment` |
| Activities | `activities` | — (read-only reference data) |
| LawnSegments | `lawnSegments` | `createLawnSegment`, `updateLawnSegment` |
| Settings | `settings` | `updateSettings` |
| GDD | `currentGdd`, `historicalGdd`, `gddForecast` | — |
| Analytics | `analytics` | — |

---

## Example GraphQL Queries After Implementation

```graphql
# Fetch entries with nested relations
query {
  entries {
    id
    title
    date
    activities {
      id
      name
    }
    products {
      name
      quantity
      quantityUnit
    }
    lawnSegments {
      name
      size
    }
  }
}

# Get GDD data
query {
  currentGdd {
    accumulatedGdd
    daysSinceLastApp
    percentageToTarget
    grassType
  }
}

# Create an entry
mutation {
  createEntry(input: {
    title: "Spring fertilizer"
    date: "2024-04-15"
    activityIds: [2]
    lawnSegmentIds: [1, 2]
  }) {
    id
    title
  }
}
```

---

## Optional Enhancements

### DataLoader for N+1 Prevention

When resolving nested fields (e.g., activities for multiple entries), DataLoader batches queries:

```bash
npm install dataloader
```

```typescript
// Create loader
const activityLoader = new DataLoader(async (entryIds: number[]) => {
  const activities = await this.repo.findByEntryIds(entryIds);
  return entryIds.map(id => activities.filter(a => a.entryId === id));
});
```

### Subscriptions (Real-time)

For real-time updates (e.g., when entries are created):

```typescript
GraphQLModule.forRoot<ApolloDriverConfig>({
  subscriptions: {
    'graphql-ws': true,
  },
})
```

---

## Files Summary

### New Files to Create:
```
src/
├── graphql/
│   └── graphql.module.ts
├── guards/
│   └── gql-auth.guard.ts
└── modules/
    ├── entries/
    │   ├── resolvers/entries.resolver.ts
    │   └── inputs/create-entry.input.ts
    ├── products/
    │   ├── resolvers/products.resolver.ts
    │   └── inputs/create-product.input.ts
    ├── equipment/
    │   └── resolvers/equipment.resolver.ts
    ├── activities/
    │   └── resolvers/activities.resolver.ts
    ├── lawn-segments/
    │   └── resolvers/lawn-segments.resolver.ts
    ├── settings/
    │   └── resolvers/settings.resolver.ts
    ├── gdd/
    │   └── resolvers/gdd.resolver.ts
    └── analytics/
        └── resolvers/analytics.resolver.ts
```

### Files to Modify:
- `src/app.module.ts` - Import GraphQL module
- `src/modules/*/models/*.ts` - Add `@ObjectType()` and `@Field()` decorators
- `src/modules/*/*.module.ts` - Register resolvers

---

## Coexistence with REST

Both APIs will work simultaneously:
- REST: `http://localhost:8080/entries`
- GraphQL: `http://localhost:8080/graphql`
- Playground: `http://localhost:8080/graphql` (in browser, dev only)

No changes needed to existing REST controllers.
