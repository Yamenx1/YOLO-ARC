import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// One cloud save per Clerk user — the whole game state as a JSON blob,
// synced from localStorage (local stays playable offline).
export default defineSchema({
  saves: defineTable({
    userId: v.string(),
    data: v.any(),
    updatedAt: v.number()
  }).index('by_user', ['userId']),
  shared: defineTable({
    userId: v.string(),
    data: v.any(),
    createdAt: v.number()
  }),
  board: defineTable({
    userId: v.string(),
    hero: v.string(),
    xp: v.number(),
    lvl: v.number(),
    streak: v.number(),
    updatedAt: v.number()
  }).index('by_xp', ['xp']).index('by_user', ['userId'])
});
