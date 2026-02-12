// File Location: src/lib/email.ts
// Email helper functions using Resend

import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const FROM_EMAIL = 'onboarding@resend.dev'; // Change to your verified domain
const BASE_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

// ============================================================================
// TYPES
// ============================================================================

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface InvitationEmailData {
  invitedEmail: string;
  invitedFirstName: string;
  invitedLastName: string;
  ownerFirstName: string;
  ownerLastName: string;
  ownerEmail: string;
  inviteToken: string;
  expiresAt: Date;
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

function getNewUserInvitationTemplate(data: InvitationEmailData): string {
  const inviteUrl = `${BASE_URL}/sign-up?invitation=${data.inviteToken}`;
  const daysRemaining = Math.ceil(
    (data.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #2563eb; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">You're Invited!</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 24px;">
                Hi ${data.invitedFirstName},
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 24px;">
                <strong>${data.ownerFirstName} ${data.ownerLastName}</strong> has invited you to join their workspace on <strong>NumexRE</strong>.
              </p>
              
              <p style="margin: 0 0 30px; color: #666666; font-size: 14px; line-height: 22px;">
                As a team member, you'll have full access to the workspace including all property analyses, deals, and tools.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${inviteUrl}" style="display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      Accept Invitation & Sign Up
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Expiration Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px; background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px;">
                <tr>
                  <td style="color: #92400e; font-size: 14px;">
                    ⏰ This invitation expires in <strong>${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</strong>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative Link -->
              <p style="margin: 30px 0 0; color: #666666; font-size: 12px; line-height: 18px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${inviteUrl}" style="color: #2563eb; word-break: break-all;">${inviteUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This invitation was sent by ${data.ownerEmail}<br>
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function getExistingUserInvitationTemplate(data: InvitationEmailData): string {
  const loginUrl = `${BASE_URL}/sign-in`;
  const daysRemaining = Math.ceil(
    (data.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #2563eb; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Team Invitation</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 24px;">
                Hi ${data.invitedFirstName},
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 24px;">
                <strong>${data.ownerFirstName} ${data.ownerLastName}</strong> has invited you to join their workspace on <strong>NumexRE</strong>.
              </p>
              
              <p style="margin: 0 0 30px; color: #666666; font-size: 14px; line-height: 22px;">
                Log in to your NumexRE account to view and accept this invitation.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${loginUrl}" style="display: inline-block; padding: 16px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      View Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Info Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px; background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 12px; border-radius: 4px;">
                <tr>
                  <td style="color: #1e40af; font-size: 14px;">
                    ℹ️ You'll find this invitation in your notifications after logging in.
                  </td>
                </tr>
              </table>
              
              <!-- Expiration Notice -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px;">
                <tr>
                  <td style="color: #92400e; font-size: 14px;">
                    ⏰ This invitation expires in <strong>${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This invitation was sent by ${data.ownerEmail}<br>
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function getPremiumConflictInvitationTemplate(data: InvitationEmailData): string {
  const loginUrl = `${BASE_URL}/sign-in`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation - Action Required</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background-color: #dc2626; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">⚠️ Action Required</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 24px;">
                Hi ${data.invitedFirstName},
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 24px;">
                <strong>${data.ownerFirstName} ${data.ownerLastName}</strong> has invited you to join their workspace on <strong>NumexRE</strong>.
              </p>
              
              <!-- Warning Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0; background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; border-radius: 4px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 10px; color: #991b1b; font-size: 14px; font-weight: bold;">
                      Premium Subscription Conflict
                    </p>
                    <p style="margin: 0; color: #7f1d1d; font-size: 14px; line-height: 20px;">
                      You currently have an active Premium subscription. To accept this team invitation, you must cancel your Premium subscription first. As a team member, you'll have full access through your workspace owner's account.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 22px;">
                <strong>Steps to accept:</strong><br>
                1. Cancel your Premium subscription in Settings<br>
                2. Log in to NumexRE<br>
                3. Accept the invitation from your notifications
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${loginUrl}" style="display: inline-block; padding: 16px 32px; background-color: #dc2626; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                      Manage Subscription
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This invitation was sent by ${data.ownerEmail}<br>
                Questions? Reply to this email or contact support.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

// ============================================================================
// EMAIL SENDING FUNCTIONS
// ============================================================================

/**
 * Send invitation email to a new user (needs to sign up)
 */
export async function sendNewUserInvitationEmail(
  data: InvitationEmailData
): Promise<EmailResult> {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.invitedEmail,
      subject: `${data.ownerFirstName} ${data.ownerLastName} invited you to NumexRE`,
      html: getNewUserInvitationTemplate(data),
    });

    if (result.data) {
      return {
        success: true,
        messageId: result.data.id,
      };
    }

    return {
      success: false,
      error: 'Failed to send email',
    };
  } catch (error: any) {
    console.error('Error sending new user invitation email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Send invitation email to an existing user
 */
export async function sendExistingUserInvitationEmail(
  data: InvitationEmailData
): Promise<EmailResult> {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.invitedEmail,
      subject: `${data.ownerFirstName} ${data.ownerLastName} invited you to their workspace`,
      html: getExistingUserInvitationTemplate(data),
    });

    if (result.data) {
      return {
        success: true,
        messageId: result.data.id,
      };
    }

    return {
      success: false,
      error: 'Failed to send email',
    };
  } catch (error: any) {
    console.error('Error sending existing user invitation email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Send invitation email to user with Premium subscription conflict
 */
export async function sendPremiumConflictInvitationEmail(
  data: InvitationEmailData
): Promise<EmailResult> {
  try {
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.invitedEmail,
      subject: `Team Invitation - Action Required`,
      html: getPremiumConflictInvitationTemplate(data),
    });

    if (result.data) {
      return {
        success: true,
        messageId: result.data.id,
      };
    }

    return {
      success: false,
      error: 'Failed to send email',
    };
  } catch (error: any) {
    console.error('Error sending premium conflict invitation email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Send invitation reminder email (resend)
 */
export async function sendInvitationReminderEmail(
  data: InvitationEmailData,
  isNewUser: boolean
): Promise<EmailResult> {
  try {
    // Use the appropriate template based on user type
    const html = isNewUser
      ? getNewUserInvitationTemplate(data)
      : getExistingUserInvitationTemplate(data);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: data.invitedEmail,
      subject: `Reminder: ${data.ownerFirstName} ${data.ownerLastName} invited you to NumexRE`,
      html: html,
    });

    if (result.data) {
      return {
        success: true,
        messageId: result.data.id,
      };
    }

    return {
      success: false,
      error: 'Failed to send email',
    };
  } catch (error: any) {
    console.error('Error sending invitation reminder email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send email',
    };
  }
}

/**
 * Helper function to send the appropriate invitation email based on type
 */
export async function sendInvitationEmail(
  data: InvitationEmailData,
  invitationType: string
): Promise<EmailResult> {
  switch (invitationType) {
    case 'new_user':
      return sendNewUserInvitationEmail(data);
    case 'existing_user':
      return sendExistingUserInvitationEmail(data);
    case 'premium_conflict':
      return sendPremiumConflictInvitationEmail(data);
    default:
      return {
        success: false,
        error: 'Unknown invitation type',
      };
  }
}