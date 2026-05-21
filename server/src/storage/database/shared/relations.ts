import { relations } from "drizzle-orm/relations";
import { users, weightRecords } from "./schema";

export const weightRecordsRelations = relations(weightRecords, ({one}) => ({
	user: one(users, {
		fields: [weightRecords.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	weightRecords: many(weightRecords),
}));