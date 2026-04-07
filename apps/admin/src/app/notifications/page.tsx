"use client";

import { useEffect, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { Bell, ImagePlus, Mail, Send, Upload, Users } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { PageShell } from "@/components/admin/page-shell";
import { StatChip } from "@/components/admin/stat-chip";
import { ProtectedRoute } from "@/components/protected-route";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_TITLE = "Dating AI test notification";
const DEFAULT_BODY =
  "If you see this on your device, push notifications are working.";

const TARGET_MODE = {
  single: "single",
  bulk: "bulk",
} as const;

type TargetMode = (typeof TARGET_MODE)[keyof typeof TARGET_MODE];

export default function NotificationsPage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const userData = useQuery(
    api.user.fetchUserAndProfile,
    isAuthenticated ? {} : "skip",
  );
  const canManageNotifications =
    isAuthenticated && userData?.profile?.isAdmin === true;

  const [targetMode, setTargetMode] = useState<TargetMode>(TARGET_MODE.single);
  const [email, setEmail] = useState("");
  const [debouncedEmail, setDebouncedEmail] = useState("");
  const [title, setTitle] = useState(DEFAULT_TITLE);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lastUploadedKey, setLastUploadedKey] = useState<string | null>(null);
  const [isUploadingAsset, setIsUploadingAsset] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedEmail(email.trim());
    }, 250);

    return () => clearTimeout(handle);
  }, [email]);

  const targetUser = useQuery(
    api.pushNotifications.adminLookupPushNotificationUser,
    canManageNotifications && debouncedEmail
      ? {
          email: debouncedEmail,
        }
      : "skip",
  );
  const audienceStats = useQuery(
    api.pushNotifications.adminGetPushAudienceStats,
    canManageNotifications ? {} : "skip",
  );
  const uploads = useQuery(
    api.uploads.listUserUploads,
    canManageNotifications ? { limit: 24 } : "skip",
  );
  const uploadedAsset = useQuery(
    api.uploads.getUpload,
    lastUploadedKey ? { key: lastUploadedKey } : "skip",
  );
  const sendNotification = useMutation(
    api.pushNotifications.adminSendPushNotification,
  );
  const sendBulkNotification = useMutation(
    api.pushNotifications.adminSendBulkPushNotification,
  );
  const generateUploadUrl = useMutation(api.uploads.generateUploadUrlWithUser);
  const syncMetadata = useMutation(api.uploads.syncMetadata);

  useEffect(() => {
    if (uploadedAsset?.url) {
      setImageUrl(uploadedAsset.url);
    }
  }, [uploadedAsset?.url]);

  const isGateLoading =
    authLoading || (isAuthenticated && userData === undefined);
  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();
  const trimmedImageUrl = imageUrl.trim();
  const imageUploads = (uploads ?? [])
    .filter((upload) => upload.contentType.startsWith("image/"))
    .slice(0, 8);
  const canSend =
    Boolean(trimmedTitle) &&
    Boolean(trimmedBody) &&
    (targetMode === TARGET_MODE.single
      ? Boolean(targetUser?.notificationsEnabled)
      : Boolean((audienceStats?.eligibleUsers ?? 0) > 0)) &&
    !isSending;

  const handleUploadAsset = async () => {
    if (!selectedFile) {
      toast.error("Select an image before uploading.");
      return;
    }

    setIsUploadingAsset(true);

    try {
      const { url, key } = await generateUploadUrl({});
      const uploadResponse = await fetch(url, {
        method: "PUT",
        body: selectedFile,
        headers: {
          "Content-Type": selectedFile.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      await syncMetadata({ key });
      setLastUploadedKey(key);
      toast.success(
        "Upload finished. If the image does not appear below immediately, select it from recent uploads.",
      );
      setSelectedFile(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upload notification image.",
      );
    } finally {
      setIsUploadingAsset(false);
    }
  };

  const handleSend = async () => {
    if (!trimmedTitle || !trimmedBody) {
      toast.error("Title and body are required.");
      return;
    }

    setIsSending(true);

    try {
      if (targetMode === TARGET_MODE.single) {
        if (!targetUser) {
          toast.error("Find a user before sending a notification.");
          return;
        }

        if (!targetUser.notificationsEnabled) {
          toast.error(
            "This user has not enabled app notifications on their device.",
          );
          return;
        }

        const pushId = await sendNotification({
          userId: targetUser.authUserId,
          title: trimmedTitle,
          body: trimmedBody,
          imageUrl: trimmedImageUrl || undefined,
        });

        toast.success(
          pushId
            ? `Notification queued for ${targetUser.email}`
            : `Notification request accepted for ${targetUser.email}`,
        );

        return;
      }

      const result = await sendBulkNotification({
        title: trimmedTitle,
        body: trimmedBody,
        imageUrl: trimmedImageUrl || undefined,
      });

      if (result.eligibleUsers === 0) {
        toast.error(
          "No eligible users currently have push notifications enabled.",
        );
        return;
      }

      toast.success(
        `Queued ${result.queuedNotifications} notification(s) for ${result.eligibleUsers} eligible user(s).`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send notification.",
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <ProtectedRoute>
      <PageShell>
        <PageHeader
          title="Notifications"
          subtitle="Send a push notification to one user or broadcast to all eligible users. Optional poster URLs are attached in the notification payload."
          actions={
            <Button onClick={handleSend} disabled={!canSend}>
              {isSending ? (
                <Spinner className="size-4" />
              ) : (
                <Send className="size-4" />
              )}
              {isSending
                ? "Sending..."
                : targetMode === TARGET_MODE.bulk
                  ? "Send Bulk Notification"
                  : "Send Test Notification"}
            </Button>
          }
        />

        {isGateLoading ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="space-y-4 pt-6">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <Card>
              <CardHeader>
                <CardTitle>Compose Push</CardTitle>
                <CardDescription>
                  Choose whether to target one user or broadcast to every
                  eligible user currently registered for notifications.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="target-mode">Audience</Label>
                  <Select
                    value={targetMode}
                    onValueChange={(value) =>
                      setTargetMode(value as TargetMode)
                    }
                  >
                    <SelectTrigger id="target-mode" className="w-full">
                      <SelectValue placeholder="Select audience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TARGET_MODE.single}>
                        Single user
                      </SelectItem>
                      <SelectItem value={TARGET_MODE.bulk}>
                        All eligible users
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {targetMode === TARGET_MODE.single ? (
                  <div className="space-y-2">
                    <Label htmlFor="recipient-email">Recipient Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="recipient-email"
                        type="email"
                        placeholder="user@example.com"
                        className="pl-9"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Use the same email as the signed-in mobile test user.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                    <div className="flex flex-wrap gap-2">
                      <StatChip
                        label="total users"
                        value={audienceStats?.totalUsers ?? 0}
                        variant="outline"
                      />
                      <StatChip
                        label="registered"
                        value={audienceStats?.registeredUsers ?? 0}
                      />
                      <StatChip
                        label="eligible"
                        value={audienceStats?.eligibleUsers ?? 0}
                        variant="default"
                      />
                      <StatChip
                        label="paused"
                        value={audienceStats?.pausedUsers ?? 0}
                        variant="secondary"
                      />
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Bulk sends only target users with a registered device
                      token and notifications currently enabled in the app.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="notification-title">Title</Label>
                  <Input
                    id="notification-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Notification title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notification-body">Body</Label>
                  <Textarea
                    id="notification-body"
                    rows={5}
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="Message shown on the recipient device"
                  />
                </div>

                <div className="space-y-3 rounded-xl border border-border/60 p-4">
                  <div className="space-y-1">
                    <Label htmlFor="notification-image-url">
                      Poster / Image URL
                    </Label>
                    <Input
                      id="notification-image-url"
                      value={imageUrl}
                      onChange={(event) => setImageUrl(event.target.value)}
                      placeholder="https://..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Attached in the notification payload for poster-capable
                      clients.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notification-poster-upload">
                      Upload poster
                    </Label>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        id="notification-poster-upload"
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          setSelectedFile(event.target.files?.[0] ?? null);
                        }}
                        disabled={isUploadingAsset}
                        className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleUploadAsset}
                        disabled={!selectedFile || isUploadingAsset}
                      >
                        {isUploadingAsset ? (
                          <Spinner className="size-4" />
                        ) : (
                          <Upload className="size-4" />
                        )}
                        {isUploadingAsset ? "Uploading..." : "Upload Image"}
                      </Button>
                    </div>
                  </div>

                  {trimmedImageUrl ? (
                    <div className="overflow-hidden rounded-xl border border-border/60 bg-muted/20">
                      <img
                        src={trimmedImageUrl}
                        alt="Notification poster preview"
                        className="aspect-[16/9] w-full object-cover"
                      />
                    </div>
                  ) : null}

                  {imageUploads.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ImagePlus className="size-4 text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">
                          Recent uploaded images
                        </p>
                      </div>
                      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                        {imageUploads.map((upload) => (
                          <button
                            key={upload._id}
                            type="button"
                            className={`overflow-hidden rounded-lg border transition ${
                              imageUrl === (upload.url ?? "")
                                ? "border-primary ring-2 ring-primary/20"
                                : "border-border/60 hover:border-primary/50"
                            }`}
                            onClick={() => {
                              setImageUrl(upload.url ?? "");
                            }}
                          >
                            {upload.url ? (
                              <img
                                src={upload.url}
                                alt={upload.key}
                                className="aspect-square w-full object-cover"
                              />
                            ) : (
                              <div className="flex aspect-square items-center justify-center bg-muted text-xs text-muted-foreground">
                                Unavailable
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {targetMode === TARGET_MODE.single
                    ? "Recipient Status"
                    : "Bulk Audience"}
                </CardTitle>
                <CardDescription>
                  {targetMode === TARGET_MODE.single
                    ? "The send button is enabled only when the selected user has a registered device and notifications are enabled in the app."
                    : "Preview how many users can currently receive a broadcast notification."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {targetMode === TARGET_MODE.single ? (
                  !debouncedEmail ? (
                    <EmptyState
                      icon={<Bell className="size-5" />}
                      title="No recipient selected"
                      description="Enter an email to load the recipient's push status."
                    />
                  ) : targetUser === undefined ? (
                    <div className="space-y-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-10 w-40" />
                    </div>
                  ) : targetUser === null ? (
                    <EmptyState
                      icon={<Mail className="size-5" />}
                      title="User not found"
                      description="No profile matched that email. Check the email address and try again."
                    />
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">
                              {targetUser.name || "Unnamed user"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {targetUser.email}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge
                              variant={
                                targetUser.hasRegisteredToken
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {targetUser.hasRegisteredToken
                                ? "Device registered"
                                : "No device token"}
                            </Badge>
                            <Badge
                              variant={
                                targetUser.notificationsEnabled
                                  ? "default"
                                  : targetUser.notificationsPaused
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {targetUser.notificationsEnabled
                                ? "Notifications enabled"
                                : targetUser.notificationsPaused
                                  ? "Notifications paused"
                                  : "Notifications unavailable"}
                            </Badge>
                            {targetUser.isAdmin ? (
                              <Badge variant="secondary">Admin</Badge>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 rounded-xl border border-border/60 p-4">
                        <StatusRow
                          label="Auth User ID"
                          value={targetUser.authUserId}
                          mono
                        />
                        <StatusRow
                          label="Send readiness"
                          value={
                            targetUser.notificationsEnabled
                              ? "Ready to test"
                              : targetUser.notificationsPaused
                                ? "User disabled notifications in app"
                                : "User has not registered a push-enabled device"
                          }
                        />
                      </div>
                    </div>
                  )
                ) : audienceStats === undefined ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                      <div className="flex items-start gap-3">
                        <Users className="mt-0.5 size-5 text-muted-foreground" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-foreground">
                            Broadcast audience overview
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Eligible users have a registered push device and
                            have not paused notifications in the app.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 rounded-xl border border-border/60 p-4">
                      <StatusRow
                        label="Total users"
                        value={String(audienceStats.totalUsers)}
                      />
                      <StatusRow
                        label="Registered devices"
                        value={String(audienceStats.registeredUsers)}
                      />
                      <StatusRow
                        label="Eligible recipients"
                        value={String(audienceStats.eligibleUsers)}
                      />
                      <StatusRow
                        label="Paused in app"
                        value={String(audienceStats.pausedUsers)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </PageShell>
    </ProtectedRoute>
  );
}

function StatusRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p
        className={
          mono ? "font-mono text-sm text-foreground" : "text-sm text-foreground"
        }
      >
        {value}
      </p>
    </div>
  );
}
