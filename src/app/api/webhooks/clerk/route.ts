// File Location: src/app/api/webhooks/clerk/route.ts
// Updated Clerk webhook with team invitation support - TypeScript fixed

import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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
    const userEmail = email_addresses[0].email_address;

    // Check if this user has a pending invitation
    const pendingInvitation = await prisma.workspaceInvitation.findFirst({
      where: {
        invitedEmail: userEmail.toLowerCase(),
        status: {
          in: ['pending_signup', 'pending'],
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isAdmin: true,
            usedSeats: true,
            availableSeats: true,
          },
        },
      },
    });

    let subscriptionStatus = "trial";
    let trialEndsAt = null;
    let isTeamMember = false;
    let teamWorkspaceOwnerId = null;

    // If user has pending invitation, set them up as team member
    if (pendingInvitation) {
      subscriptionStatus = "free"; // Team members don't get trial
      isTeamMember = true;
      teamWorkspaceOwnerId = pendingInvitation.ownerId;
      
      console.log(`🎉 New user ${userEmail} has pending invitation from ${pendingInvitation.owner.email}`);
    } else {
      // Normal signup - give trial
      trialEndsAt = new Date();
      trialEndsAt.setHours(trialEndsAt.getHours() + 72);
      console.log(`🎁 New trial user: ${userEmail}, trial ends at:`, trialEndsAt);
    }

    // Create user in your database
    try {
      const newUser = await prisma.user.create({
        data: {
          clerkId: id,
          email: userEmail,
          firstName: first_name || null,
          lastName: last_name || null,
          imageUrl: image_url || null,
          subscriptionStatus: subscriptionStatus,
          trialEndsAt: trialEndsAt,
          hasUsedTrial: !isTeamMember, // Team members haven't used trial
          isTeamMember: isTeamMember,
          teamWorkspaceOwnerId: teamWorkspaceOwnerId,
        },
      });

      console.log("✅ User created in database:", id);

      // If this was an invited user, update the invitation
      if (pendingInvitation) {
        await prisma.workspaceInvitation.update({
          where: { id: pendingInvitation.id },
          data: {
            invitedUserId: newUser.id,
            // Keep status as pending_signup - accept endpoint will mark it accepted
          },
        });
        
        console.log(`📧 Updated invitation record for ${userEmail}`);
      }
      
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
        where: { clerkId: id },
      });

      console.log("✅ User deleted from database:", id);
    } catch (error) {
      console.error("Error deleting user from database:", error);
      
      // Don't return error if user doesn't exist (P2025)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          console.log("User doesn't exist in database, skipping delete");
          return new Response("Webhook received", { status: 200 });
        }
      }
      
      return new Response("Error: Database error", { status: 500 });
    }
  }

  return new Response("Webhook received", { status: 200 });
}