/**
 * Seed demo organization, users, customers, tickets, and knowledge articles.
 *
 * Usage (from server/):
 *   npm run seed
 *
 * Requires MONGODB_URI and JWT secrets in .env (JWT secrets validated by env.ts).
 */
import bcrypt from "bcryptjs";
import { connectDatabase, disconnectDatabase } from "../config/database.js";
import { Organization } from "../models/Organization.js";
import { User } from "../models/User.js";
import { Customer } from "../models/Customer.js";
import { Ticket } from "../models/Ticket.js";
import { Message } from "../models/Message.js";
import { KnowledgeArticle } from "../models/KnowledgeArticle.js";
import { CannedResponse } from "../models/CannedResponse.js";
import {
  Role,
  Plan,
  TicketStatus,
  TicketPriority,
  MessageType,
  ArticleStatus,
} from "../types/enums.js";

const DEMO_EMAIL = "owner@demo.voxly.app";
const DEMO_PASSWORD = "Demo1234!";
const AGENT_EMAIL = "agent@demo.voxly.app";
const CUSTOMER_EMAIL = "customer@demo.voxly.app";

async function seed() {
  await connectDatabase();

  console.log("Clearing previous demo data (by org slug demo)...");
  const existingOrg = await Organization.findOne({ slug: "demo" });
  if (existingOrg) {
    const orgId = existingOrg._id;
    await Promise.all([
      Message.deleteMany({}),
      Ticket.deleteMany({ organizationId: orgId }),
      Customer.deleteMany({ organizationId: orgId }),
      KnowledgeArticle.deleteMany({ organizationId: orgId }),
      CannedResponse.deleteMany({ organizationId: orgId }),
      User.deleteMany({ organizationId: orgId }),
      Organization.deleteOne({ _id: orgId }),
    ]);
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const org = await Organization.create({
    name: "Demo Workspace",
    slug: "demo",
    plan: Plan.PRO,
  });

  const owner = await User.create({
    name: "Demo Owner",
    email: DEMO_EMAIL,
    password: passwordHash,
    role: Role.OWNER,
    organizationId: org._id,
  });

  const agent = await User.create({
    name: "Demo Agent",
    email: AGENT_EMAIL,
    password: passwordHash,
    role: Role.AGENT,
    organizationId: org._id,
  });

  const customerUser = await User.create({
    name: "Alex Customer",
    email: CUSTOMER_EMAIL,
    password: passwordHash,
    role: Role.CUSTOMER,
    organizationId: org._id,
  });

  const customer = await Customer.create({
    organizationId: org._id,
    name: "Alex Customer",
    email: CUSTOMER_EMAIL,
    company: "Acme Corp",
    tags: ["vip"],
  });

  const customer2 = await Customer.create({
    organizationId: org._id,
    name: "Sam Buyer",
    email: "sam@example.com",
    company: "Example LLC",
  });

  const ticket1 = await Ticket.create({
    organizationId: org._id,
    customerId: customer._id,
    assignedAgentId: agent._id,
    subject: "Cannot reset password",
    description: "I clicked forgot password but never received the email.",
    status: TicketStatus.OPEN,
    priority: TicketPriority.HIGH,
    tags: ["account"],
  });

  await Message.create({
    ticketId: ticket1._id,
    senderId: customerUser._id,
    content: "I clicked forgot password but never received the email.",
    type: MessageType.CUSTOMER,
  });

  await Message.create({
    ticketId: ticket1._id,
    senderId: agent._id,
    content: "Thanks for reporting this. Checking spam filters on our side.",
    type: MessageType.AGENT,
  });

  await Ticket.create({
    organizationId: org._id,
    customerId: customer2._id,
    subject: "Invoice PDF missing",
    description: "Last month invoice download returns 404.",
    status: TicketStatus.PENDING,
    priority: TicketPriority.MEDIUM,
    tags: ["billing"],
  });

  await KnowledgeArticle.create({
    organizationId: org._id,
    authorId: owner._id,
    title: "How to reset your password",
    content:
      "Go to Login → Forgot password, enter your email, then check inbox and spam. Links expire in 60 minutes.",
    excerpt: "Steps to reset your account password.",
    category: "Account",
    tags: ["password", "login"],
    status: ArticleStatus.PUBLISHED,
    publishedAt: new Date(),
  });

  await KnowledgeArticle.create({
    organizationId: org._id,
    authorId: owner._id,
    title: "Billing and invoices",
    content:
      "Invoices are available under Billing → Invoices. If a PDF fails to download, contact support with the invoice number.",
    excerpt: "Where to find invoices and billing help.",
    category: "Billing",
    tags: ["invoice"],
    status: ArticleStatus.PUBLISHED,
    publishedAt: new Date(),
  });

  await CannedResponse.create({
    organizationId: org._id,
    authorId: owner._id,
    title: "Greeting",
    content: "Hi {{name}}, thanks for reaching out to support. How can we help today?",
    shortcut: "/hi",
    category: "General",
  });

  console.log("\n✅ Seed complete\n");
  console.log("Organization slug: demo");
  console.log(`Owner:  ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`Agent:  ${AGENT_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`Portal customer: ${CUSTOMER_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`Portal URL path: /portal/demo\n`);

  await disconnectDatabase();
}

seed().catch(async (err) => {
  console.error("Seed failed:", err);
  try {
    await disconnectDatabase();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
