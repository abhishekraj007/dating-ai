"use client";

import { useEffect, useMemo, useState } from "react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { ProtectedRoute } from "@/components/protected-route";
import { PageShell } from "@/components/admin/page-shell";
import { PageHeader } from "@/components/admin/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type NsfwPlatform = "ios" | "android" | "web";

type ConfigForm = {
  baseWebUrl: string;
  termsUrl: string;
  privacyUrl: string;
  helpCenterUrl: string;
  supportUrl: string;
  shareUrl: string;
  iosAppStoreId: string;
  androidAppId: string;
  revenueCatCreditProductIds: string;
  showMyCreationTab: boolean;
  nsfwEnabledPlatforms: Array<NsfwPlatform>;
};

const emptyForm: ConfigForm = {
  baseWebUrl: "",
  termsUrl: "",
  privacyUrl: "",
  helpCenterUrl: "",
  supportUrl: "",
  shareUrl: "",
  iosAppStoreId: "",
  androidAppId: "",
  revenueCatCreditProductIds: "[]",
  showMyCreationTab: false,
  nsfwEnabledPlatforms: [],
};

const formatStringArrayValue = (value?: Array<string>) => {
  return JSON.stringify(value ?? [], null, 2);
};

const parseStringArrayValue = (value: string, label: string) => {
  const trimmed = value.trim();

  if (!trimmed) {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error(`${label} must be a valid JSON array of strings`);
  }

  if (
    !Array.isArray(parsed) ||
    parsed.some((item) => typeof item !== "string")
  ) {
    throw new Error(`${label} must be a JSON array of strings`);
  }

  return Array.from(
    new Set(
      parsed.map((item) => item.trim()).filter((item) => item.length > 0),
    ),
  );
};

export default function AppConfigPage() {
  const { isAuthenticated } = useConvexAuth();
  const adminConfig = useQuery(
    (api as any).features.appConfig.queries.getAdminAppConfig,
    isAuthenticated ? {} : "skip",
  );
  const publicConfig = useQuery(
    (api as any).features.appConfig.queries.getPublicAppConfig,
    isAuthenticated ? {} : "skip",
  );
  const upsertConfig = useMutation(
    (api as any).features.appConfig.mutations.upsertAppConfig,
  );

  const [form, setForm] = useState<ConfigForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

  useEffect(() => {
    if (!adminConfig || hasLoadedInitial) {
      return;
    }

    setForm({
      baseWebUrl: adminConfig.baseWebUrl ?? "",
      termsUrl: adminConfig.termsUrl ?? "",
      privacyUrl: adminConfig.privacyUrl ?? "",
      helpCenterUrl: adminConfig.helpCenterUrl ?? "",
      supportUrl: adminConfig.supportUrl ?? "",
      shareUrl: adminConfig.shareUrl ?? "",
      iosAppStoreId: adminConfig.iosAppStoreId ?? "",
      androidAppId: adminConfig.androidAppId ?? "",
      revenueCatCreditProductIds: formatStringArrayValue(
        adminConfig.revenueCatCreditProductIds,
      ),
      showMyCreationTab: adminConfig.showMyCreationTab ?? false,
      nsfwEnabledPlatforms: (adminConfig.nsfwEnabledPlatforms ??
        []) as Array<NsfwPlatform>,
    });
    setHasLoadedInitial(true);
  }, [adminConfig, hasLoadedInitial]);

  const resolved = useMemo(() => {
    return {
      termsUrl: publicConfig?.termsUrl ?? "-",
      privacyUrl: publicConfig?.privacyUrl ?? "-",
      helpCenterUrl: publicConfig?.helpCenterUrl ?? "-",
      supportUrl: publicConfig?.supportUrl ?? "-",
      shareUrl: publicConfig?.shareUrl ?? "-",
      revenueCatCreditProductIds:
        publicConfig?.revenueCatCreditProductIds?.join(", ") ?? "-",
    };
  }, [publicConfig]);

  const onChange = (key: keyof ConfigForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const buildConfigPayload = (nextForm: ConfigForm) => ({
    baseWebUrl: nextForm.baseWebUrl || undefined,
    termsUrl: nextForm.termsUrl || undefined,
    privacyUrl: nextForm.privacyUrl || undefined,
    helpCenterUrl: nextForm.helpCenterUrl || undefined,
    supportUrl: nextForm.supportUrl || undefined,
    shareUrl: nextForm.shareUrl || undefined,
    iosAppStoreId: nextForm.iosAppStoreId || undefined,
    androidAppId: nextForm.androidAppId || undefined,
    revenueCatCreditProductIds: parseStringArrayValue(
      nextForm.revenueCatCreditProductIds,
      "RevenueCat credit product IDs",
    ),
    showMyCreationTab: nextForm.showMyCreationTab,
    nsfwEnabledPlatforms: nextForm.nsfwEnabledPlatforms,
  });

  const saveConfig = async (
    nextForm: ConfigForm,
    successMessage: string,
    previousForm?: ConfigForm,
  ) => {
    setIsSaving(true);

    try {
      await upsertConfig(buildConfigPayload(nextForm));
      toast.success(successMessage);
      return true;
    } catch (error) {
      if (previousForm) {
        setForm(previousForm);
      }

      toast.error(
        error instanceof Error ? error.message : "Failed to update config",
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const onToggleShowMyCreationTab = (checked: boolean) => {
    const previousForm = form;
    const nextForm = {
      ...form,
      showMyCreationTab: checked,
    };

    setForm(nextForm);
    void saveConfig(nextForm, "Feature flags updated", previousForm);
  };

  const onToggleNsfwPlatform = (platform: NsfwPlatform, checked: boolean) => {
    const previousForm = form;
    const nextForm = {
      ...form,
      nsfwEnabledPlatforms: checked
        ? Array.from(new Set([...form.nsfwEnabledPlatforms, platform]))
        : form.nsfwEnabledPlatforms.filter((item) => item !== platform),
    };

    setForm(nextForm);
    void saveConfig(nextForm, "NSFW config updated", previousForm);
  };

  const onSave = async () => {
    await saveConfig(form, "App configuration updated");
  };

  const isLoading = adminConfig === undefined;

  return (
    <ProtectedRoute>
      <PageShell>
        <PageHeader
          title="App Configuration"
          subtitle="Manage runtime app URLs and identifiers without shipping a new mobile release."
          actions={
            <Button onClick={onSave} disabled={isSaving || isLoading}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          }
        />

        {isLoading ? (
          <Card>
            <CardContent className="space-y-4 pt-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Managed Values</CardTitle>
                <CardDescription>
                  Leave a field empty to use sensible defaults derived from base
                  web URL.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field
                  id="baseWebUrl"
                  label="Base Web URL"
                  value={form.baseWebUrl}
                  onChange={(value) => onChange("baseWebUrl", value)}
                  placeholder="https://your-domain.com"
                />

                <Separator />

                <Field
                  id="termsUrl"
                  label="Terms URL"
                  value={form.termsUrl}
                  onChange={(value) => onChange("termsUrl", value)}
                  placeholder="https://your-domain.com/terms"
                />

                <Field
                  id="privacyUrl"
                  label="Privacy URL"
                  value={form.privacyUrl}
                  onChange={(value) => onChange("privacyUrl", value)}
                  placeholder="https://your-domain.com/privacy"
                />

                <Field
                  id="helpCenterUrl"
                  label="Help Center URL"
                  value={form.helpCenterUrl}
                  onChange={(value) => onChange("helpCenterUrl", value)}
                  placeholder="https://your-domain.com/help"
                />

                <Field
                  id="supportUrl"
                  label="Support URL"
                  value={form.supportUrl}
                  onChange={(value) => onChange("supportUrl", value)}
                  placeholder="https://your-domain.com/support"
                />

                <Field
                  id="shareUrl"
                  label="Share URL"
                  value={form.shareUrl}
                  onChange={(value) => onChange("shareUrl", value)}
                  placeholder="https://your-domain.com"
                />

                <Separator />

                <Field
                  id="iosAppStoreId"
                  label="iOS App Store ID"
                  value={form.iosAppStoreId}
                  onChange={(value) => onChange("iosAppStoreId", value)}
                  placeholder="1234567890"
                />

                <Field
                  id="androidAppId"
                  label="Android App ID"
                  value={form.androidAppId}
                  onChange={(value) => onChange("androidAppId", value)}
                  placeholder="com.noosperai.feelchat"
                />

                <Separator />

                <ArrayField
                  id="revenueCatCreditProductIds"
                  label="RevenueCat Credit Product IDs"
                  value={form.revenueCatCreditProductIds}
                  onChange={(value) =>
                    onChange("revenueCatCreditProductIds", value)
                  }
                  placeholder={`[
  "feelchat.rc_credit_1999",
  "feelchat.rc_credit_3900",
  "feelchat.rc_credit_4999",
  "feelchat.rc_credit_8999"
]`}
                />
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Feature Flags</CardTitle>
                  <CardDescription>
                    Toggle features on or off for all app users.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="showMyCreationTab">My Creation Tab</Label>
                      <p className="text-xs text-muted-foreground">
                        Show the "My Creation" tab in the bottom navigation bar.
                      </p>
                    </div>
                    <Switch
                      id="showMyCreationTab"
                      checked={form.showMyCreationTab}
                      disabled={isSaving}
                      onCheckedChange={onToggleShowMyCreationTab}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>NSFW Config</CardTitle>
                  <CardDescription>
                    Control which platforms are allowed to send and receive NSFW
                    content. Disabled platforms receive SFW-only agent
                    responses.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(
                    [
                      {
                        id: "nsfw-ios",
                        platform: "ios" as NsfwPlatform,
                        label: "iOS",
                        description: "Allow NSFW content on iOS devices.",
                      },
                      {
                        id: "nsfw-android",
                        platform: "android" as NsfwPlatform,
                        label: "Android",
                        description: "Allow NSFW content on Android devices.",
                      },
                      {
                        id: "nsfw-web",
                        platform: "web" as NsfwPlatform,
                        label: "Web",
                        description: "Allow NSFW content on web browsers.",
                      },
                    ] as const
                  ).map(({ id, platform, label, description }) => (
                    <div key={id} className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor={id}>{label}</Label>
                        <p className="text-xs text-muted-foreground">
                          {description}
                        </p>
                      </div>
                      <Switch
                        id={id}
                        checked={form.nsfwEnabledPlatforms.includes(platform)}
                        disabled={isSaving}
                        onCheckedChange={(checked) =>
                          onToggleNsfwPlatform(platform, checked)
                        }
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resolved Runtime Links</CardTitle>
                  <CardDescription>
                    These computed values are consumed by mobile account
                    screens.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <ResolvedRow label="Terms" value={resolved.termsUrl} />
                  <ResolvedRow label="Privacy" value={resolved.privacyUrl} />
                  <ResolvedRow
                    label="Help Center"
                    value={resolved.helpCenterUrl}
                  />
                  <ResolvedRow label="Support" value={resolved.supportUrl} />
                  <ResolvedRow label="Share" value={resolved.shareUrl} />
                  <ResolvedRow
                    label="Credit IDs"
                    value={resolved.revenueCatCreditProductIds}
                  />
                  <Separator className="my-3" />
                  <p className="text-xs text-muted-foreground">
                    Last updated:{" "}
                    {adminConfig?.updatedAt
                      ? new Date(adminConfig.updatedAt).toLocaleString()
                      : "Not set"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </PageShell>
    </ProtectedRoute>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function ArrayField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-36 font-mono text-xs sm:text-sm"
      />
    </div>
  );
}

function ResolvedRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-mono text-xs sm:text-sm">{value}</span>
    </div>
  );
}
