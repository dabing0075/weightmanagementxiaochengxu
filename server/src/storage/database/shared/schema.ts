import { pgTable, serial, varchar, timestamp, numeric, text, boolean, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// 系统表（禁止删除）
export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updated_at: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 用户表
export const users = pgTable(
	"users",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		nickname: varchar("nickname", { length: 128 }).notNull(),
		gender: varchar("gender", { length: 10 }), // 'male' | 'female'
		birth_date: varchar("birth_date", { length: 10 }), // YYYY-MM-DD
		height: numeric("height", { precision: 5, scale: 1 }), // 身高(cm)
		target_weight: numeric("target_weight", { precision: 5, scale: 1 }), // 目标体重(kg)
		target_waist: numeric("target_waist", { precision: 5, scale: 1 }), // 目标腰围(cm)
		reminder_time: varchar("reminder_time", { length: 5 }), // 提醒时间 HH:mm
		avatar_url: varchar("avatar_url", { length: 512 }),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("users_created_at_idx").on(table.created_at),
	]
);

// 体重记录表
export const weightRecords = pgTable(
	"weight_records",
	{
		id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
		user_id: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
		record_date: varchar("record_date", { length: 10 }).notNull(), // YYYY-MM-DD
		weight: numeric("weight", { precision: 5, scale: 1 }).notNull(), // 体重(kg)
		waist: numeric("waist", { precision: 5, scale: 1 }), // 腰围(cm)
		note: text("note"), // 备注
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
		updated_at: timestamp("updated_at", { withTimezone: true }),
	},
	(table) => [
		index("weight_records_user_id_idx").on(table.user_id),
		index("weight_records_record_date_idx").on(table.record_date),
		index("weight_records_user_date_idx").on(table.user_id, table.record_date),
	]
);

export type User = typeof users.$inferSelect;
export type WeightRecord = typeof weightRecords.$inferSelect;
