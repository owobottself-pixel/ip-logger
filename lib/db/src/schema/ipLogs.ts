import { pgTable, text, serial, integer, timestamp, real, boolean } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod/v4';
import { trackingLinksTable } from './trackingLinks';

export const ipLogsTable = pgTable('ip_logs', {
  id: serial('id').primaryKey(),
  linkId: integer('link_id').notNull().references(() => trackingLinksTable.id, { onDelete: 'cascade' }),
  ip: text('ip').notNull(),
  userAgent: text('user_agent'),
  country: text('country'),
  region: text('region'),
  city: text('city'),
  zip: text('zip'),
  lat: real('lat'),
  lon: real('lon'),
  gpsAccuracy: real('gps_accuracy'),
  timezone: text('timezone'),
  isp: text('isp'),
  org: text('org'),
  asn: text('asn'),
  mobile: boolean('mobile'),
  proxy: boolean('proxy'),
  hosting: boolean('hosting'),
  referrer: text('referrer'),
  photo: text('photo'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const insertIpLogSchema = createInsertSchema(ipLogsTable).omit({ id: true, createdAt: true });
export type InsertIpLog = z.infer<typeof insertIpLogSchema>;
export type IpLog = typeof ipLogsTable.$inferSelect;
