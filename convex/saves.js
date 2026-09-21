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
