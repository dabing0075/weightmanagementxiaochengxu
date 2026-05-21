import { pgTable, index, varchar, numeric, timestamp, serial, foreignKey, text } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	nickname: varchar({ length: 128 }).notNull(),
	gender: varchar({ length: 10 }),
	birthDate: varchar("birth_date", { length: 10 }),
	height: numeric({ precision: 5, scale:  1 }),
	targetWeight: numeric("target_weight", { precision: 5, scale:  1 }),
	targetWaist: numeric("target_waist", { precision: 5, scale:  1 }),
	reminderTime: varchar("reminder_time", { length: 5 }),
	avatarUrl: varchar("avatar_url", { length: 512 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("users_created_at_idx").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
]);

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const weightRecords = pgTable("weight_records", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	recordDate: varchar("record_date", { length: 10 }).notNull(),
	weight: numeric({ precision: 5, scale:  1 }).notNull(),
	waist: numeric({ precision: 5, scale:  1 }),
	note: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("weight_records_record_date_idx").using("btree", table.recordDate.asc().nullsLast().op("text_ops")),
	index("weight_records_user_date_idx").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.recordDate.asc().nullsLast().op("text_ops")),
	index("weight_records_user_id_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "weight_records_user_id_users_id_fk"
		}).onDelete("cascade"),
]);
