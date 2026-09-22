import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

async function me(ctx) {
  const id = await ctx.auth.getUserIdentity();
  return id ? id.subject : null;
}

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await me(ctx);
    if (!userId) return null;
    return await ctx.db.query('saves').withIndex('by_user', (q) => q.eq('userId', userId)).first();
  }
});

export const put = mutation({
  args: { data: v.any(), updatedAt: v.number() },
  handler: async (ctx, args) => {
    const userId = await me(ctx);
    if (!userId) throw new Error('no-auth');
    const ex = await ctx.db.query('saves').withIndex('by_user', (q) => q.eq('userId', userId)).first();
    if (ex) {
      if (args.updatedAt > ex.updatedAt) await ctx.db.patch(ex._id, { data: args.data, updatedAt: args.updatedAt });
      return ex._id;
    }
    return await ctx.db.insert('saves', { userId, data: args.data, updatedAt: args.updatedAt });
  }
});

export const share = mutation({
  args: { data: v.any() },
  handler: async (ctx, args) => {
    const userId = await me(ctx);
    if (!userId) throw new Error('no-auth');
    return await ctx.db.insert('shared', { userId, data: args.data, createdAt: Date.now() });
  }
});

export const view = query({
  args: { id: v.id('shared') },
  handler: async (ctx, args) => {
    const row = await ctx.db.get(args.id);
    return row ? row.data : null;
  }
});

export const wipe = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await me(ctx);
    if (!userId) throw new Error('no-auth');
    const rows = await ctx.db.query('saves').withIndex('by_user', (q) => q.eq('userId', userId)).collect();
    for (const r of rows) await ctx.db.delete(r._id);
    const sh = await ctx.db.query('shared').filter((q) => q.eq(q.field('userId'), userId)).collect();
    for (const r of sh) await ctx.db.delete(r._id);
    return rows.length + sh.length;
  }
});
