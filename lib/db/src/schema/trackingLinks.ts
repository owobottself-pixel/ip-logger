import { pgTable, text, serial, integer, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod/v4';

export const trackingLinksTable = pgTable('tracking_links', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  token: text('token').notNull().unique(),
  slug: text('slug').unique(),
  description: text('description'),
  redirectUrl: text('redirect_url'),
  visitCount: integer('visit_count').notNull().default(0),
  ogTitle: text('og_title'),
  ogDescription: text('og_description'),
  ogImage: text('og_image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const insertTrackingLinkSchema = createInsertSchema(trackingLinksTable).omit({ id: true, visitCount: true, createdAt: true });
export type InsertTrackingLink = z.infer<typeof insertTrackingLinkSchema>;
export type TrackingLink = typeof trackingLinksTable.$inferSelect;
