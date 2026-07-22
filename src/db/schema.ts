import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  pgEnum,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "store_manager",
  "seller",
  "warehouse",
  "accountant",
]);

export const productTypeEnum = pgEnum("product_type", [
  "agricultural",
  "livestock",
]);

export const customerTypeEnum = pgEnum("customer_type", [
  "farmer",
  "gardener",
  "livestock_owner",
  "store",
  "company",
  "other",
]);

export const transactionTypeEnum = pgEnum("transaction_type", [
  "purchase",
  "sale",
  "adjustment",
  "transfer",
]);

export const expenseCategoryEnum = pgEnum("expense_category", [
  "rent",
  "electricity",
  "water",
  "salary",
  "transport",
  "repair",
  "other",
]);

export const activityTypeEnum = pgEnum("activity_type", [
  "login",
  "logout",
  "create",
  "update",
  "delete",
  "print",
  "download",
  "view",
]);

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 200 }).notNull(),
  role: userRoleEnum("role").notNull().default("seller"),
  phone: varchar("phone", { length: 20 }),
  isActive: boolean("is_active").notNull().default(true),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Categories Table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  productType: productTypeEnum("product_type").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Suppliers Table
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  email: varchar("email", { length: 200 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Products Table
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  categoryId: integer("category_id").references(() => categories.id),
  productType: productTypeEnum("product_type").notNull(),
  brand: varchar("brand", { length: 100 }),
  manufacturer: varchar("manufacturer", { length: 200 }),
  countryOfOrigin: varchar("country_of_origin", { length: 100 }),
  serialNumber: varchar("serial_number", { length: 100 }),
  barcode: varchar("barcode", { length: 100 }),
  unit: varchar("unit", { length: 50 }).notNull(),
  productionDate: date("production_date"),
  expiryDate: date("expiry_date"),
  purchasePrice: decimal("purchase_price", { precision: 12, scale: 2 }).notNull().default("0"),
  salePrice: decimal("sale_price", { precision: 12, scale: 2 }).notNull().default("0"),
  currentStock: decimal("current_stock", { precision: 12, scale: 3 }).notNull().default("0"),
  minStock: decimal("min_stock", { precision: 12, scale: 3 }).notNull().default("0"),
  storageLocation: varchar("storage_location", { length: 200 }),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Customers Table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  customerType: customerTypeEnum("customer_type").notNull().default("farmer"),
  hasPurchaseHistory: boolean("has_purchase_history").notNull().default(false),
  hasCreditHistory: boolean("has_credit_history").notNull().default(false),
  totalDebt: decimal("total_debt", { precision: 12, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Sales Table
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  finalAmount: decimal("final_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  remainingAmount: decimal("remaining_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  isCredit: boolean("is_credit").notNull().default(false),
  isPaid: boolean("is_paid").notNull().default(true),
  notes: text("notes"),
  saleDate: timestamp("sale_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Sale Items Table
export const saleItems = pgTable("sale_items", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").references(() => sales.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  discount: decimal("discount", { precision: 5, scale: 2 }).notNull().default("0"),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
});

// Purchases Table
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 50 }),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  purchaseDate: timestamp("purchase_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Purchase Items Table
export const purchaseItems = pgTable("purchase_items", {
  id: serial("id").primaryKey(),
  purchaseId: integer("purchase_id").references(() => purchases.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
});

// Credit Payments Table
export const creditPayments = pgTable("credit_payments", {
  id: serial("id").primaryKey(),
  saleId: integer("sale_id").references(() => sales.id).notNull(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
  paymentDate: timestamp("payment_date").notNull().defaultNow(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Expenses Table
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  category: expenseCategoryEnum("category").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  expenseDate: timestamp("expense_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Stock Transactions Table
export const stockTransactions = pgTable("stock_transactions", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  transactionType: transactionTypeEnum("transaction_type").notNull(),
  quantity: decimal("quantity", { precision: 12, scale: 3 }).notNull(),
  previousStock: decimal("previous_stock", { precision: 12, scale: 3 }).notNull(),
  newStock: decimal("new_stock", { precision: 12, scale: 3 }).notNull(),
  referenceId: integer("reference_id"),
  referenceType: varchar("reference_type", { length: 50 }),
  notes: text("notes"),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Activity Logs Table
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  activityType: activityTypeEnum("activity_type").notNull(),
  description: text("description").notNull(),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: integer("entity_id"),
  ipAddress: varchar("ip_address", { length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sales: many(sales),
  purchases: many(purchases),
  expenses: many(expenses),
  stockTransactions: many(stockTransactions),
  activityLogs: many(activityLogs),
  creditPayments: many(creditPayments),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  saleItems: many(saleItems),
  purchaseItems: many(purchaseItems),
  stockTransactions: many(stockTransactions),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  sales: many(sales),
  creditPayments: many(creditPayments),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  customer: one(customers, { fields: [sales.customerId], references: [customers.id] }),
  user: one(users, { fields: [sales.userId], references: [users.id] }),
  items: many(saleItems),
  creditPayments: many(creditPayments),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, { fields: [saleItems.saleId], references: [sales.id] }),
  product: one(products, { fields: [saleItems.productId], references: [products.id] }),
}));

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  supplier: one(suppliers, { fields: [purchases.supplierId], references: [suppliers.id] }),
  user: one(users, { fields: [purchases.userId], references: [users.id] }),
  items: many(purchaseItems),
}));

export const purchaseItemsRelations = relations(purchaseItems, ({ one }) => ({
  purchase: one(purchases, { fields: [purchaseItems.purchaseId], references: [purchases.id] }),
  product: one(products, { fields: [purchaseItems.productId], references: [products.id] }),
}));

export const creditPaymentsRelations = relations(creditPayments, ({ one }) => ({
  sale: one(sales, { fields: [creditPayments.saleId], references: [sales.id] }),
  customer: one(customers, { fields: [creditPayments.customerId], references: [customers.id] }),
  user: one(users, { fields: [creditPayments.userId], references: [users.id] }),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  purchases: many(purchases),
}));

export const stockTransactionsRelations = relations(stockTransactions, ({ one }) => ({
  product: one(products, { fields: [stockTransactions.productId], references: [products.id] }),
  user: one(users, { fields: [stockTransactions.userId], references: [users.id] }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, { fields: [activityLogs.userId], references: [users.id] }),
}));
