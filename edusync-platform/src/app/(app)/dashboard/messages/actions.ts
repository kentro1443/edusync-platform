"use server";

import { redirect } from "next/navigation";

import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import {
  CollaborationAuthorizationError,
  CollaborationNotFoundError,
  addMessageAttachment,
  createConversation,
  markConversationRead,
  sendMessage,
  validateMessageAttachment,
} from "@/lib/collaboration/collaboration-service";
import { CollaborationValidationError } from "@/lib/collaboration/collaboration-domain";

function value(formData: FormData, key: string): string {
  const entry = formData.get(key);
  return typeof entry === "string" ? entry.trim() : "";
}

function values(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function errorCode(error: unknown): string {
  if (error instanceof CollaborationAuthorizationError) return "forbidden";
  if (error instanceof CollaborationNotFoundError) return "not-found";
  if (error instanceof CollaborationValidationError) return "invalid";
  return "error";
}

export async function createConversationAction(formData: FormData): Promise<never> {
  const { actor } = await requireSchoolContext(permissions.messageConversationCreate);
  let conversationId: string;
  try {
    conversationId = await createConversation(actor, {
      title: value(formData, "title"),
      participantUserIds: values(formData, "participantUserIds"),
    });
  } catch (error) {
    redirect(`/dashboard/messages?error=${errorCode(error)}`);
  }
  redirect(`/dashboard/messages/${conversationId}?result=created`);
}

export async function sendMessageAction(formData: FormData): Promise<never> {
  const conversationId = value(formData, "conversationId");
  const { actor } = await requireSchoolContext(permissions.messageSend);
  try {
    const file = formData.get("file");
    const attachment =
      file instanceof File && file.size > 0
        ? {
            originalName: file.name,
            mimeType: file.type || "application/octet-stream",
            content: new Uint8Array(await file.arrayBuffer()),
          }
        : null;
    if (attachment) validateMessageAttachment(attachment);
    const messageId = await sendMessage(actor, conversationId, {
      body: value(formData, "body"),
      mentionUserIds: values(formData, "mentionUserIds"),
    });
    if (attachment) {
      await addMessageAttachment(actor, conversationId, messageId, attachment);
    }
  } catch (error) {
    redirect(`/dashboard/messages/${conversationId}?error=${errorCode(error)}`);
  }
  redirect(`/dashboard/messages/${conversationId}?result=sent`);
}

export async function markConversationReadAction(formData: FormData): Promise<never> {
  const conversationId = value(formData, "conversationId");
  const { actor } = await requireSchoolContext(permissions.messageConversationRead);
  try {
    await markConversationRead(actor, conversationId);
  } catch (error) {
    redirect(`/dashboard/messages/${conversationId}?error=${errorCode(error)}`);
  }
  redirect(`/dashboard/messages/${conversationId}?result=read`);
}
