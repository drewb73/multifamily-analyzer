import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: Missing svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "");

  let evt: WebhookEvent;

  // Verify the webhook
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error: Verification error", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    // Calculate 72 hours from now
    const trialEndsAt = new Date();
    trialEndsAt.setHours(trialEndsAt.getHours() + 72);

    // Create user in your database
    try {
      await prisma.user.create({
        data: {
          clerkId: id,
          email: email_addresses[0].email_address,
          firstName: first_name || null,
          lastName: last_name || null,
          imageUrl: image_url || null,
          subscriptionStatus: "trial", // Start on trial
          trialEndsAt: trialEndsAt, // 72 hours from now
          hasUsedTrial: true, // Mark that they've used their trial
        },
      });

      console.log("✅ User created in database:", id);
      console.log("🎁 Trial ends at:", trialEndsAt);
    } catch (error) {
      console.error("Error creating user in database:", error);
      return new Response("Error: Database error", { status: 500 });
    }
  }

  if (eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name, image_url } = evt.data;

    // Update user in your database
    try {
      await prisma.user.update({
        where: { clerkId: id },
        data: {
          email: email_addresses[0].email_address,
          firstName: first_name || null,
          lastName: last_name || null,
          imageUrl: image_url || null,
        },
      });

      console.log("✅ User updated in database:", id);
    } catch (error) {
      console.error("Error updating user in database:", error);
      return new Response("Error: Database error", { status: 500 });
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    // Delete user from your database
    try {
      await prisma.user.delete({
        where: { clerkId: id as string },
      });

      console.log("✅ User deleted from database:", id);
    } catch (error) {
      console.error("Error deleting user from database:", error);
      return new Response("Error: Database error", { status: 500 });
    }
  }

  return new Response("Webhook processed successfully", { status: 200 });
}