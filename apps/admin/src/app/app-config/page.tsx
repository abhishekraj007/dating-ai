"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
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
import { toast } from "sonner";

type ConfigForm = {
  baseWebUrl: string;
  termsUrl: string;
  privacyUrl: string;
  helpCenterUrl: string;
  supportUrl: string;
  shareUrl: string;
  iosAppStoreId: string;
  androidAppId: string;
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
};

export default function AppConfigPage() {
  const adminConfig = useQuery((api as any).features.appConfig.queries.getAdminAppConfig);
  const publicConfig = useQuery((api as any).features.appConfig.queries.getPublicAppConfig);
  const upsertConfig = useMutation((api as any).features.appConfig.mutations.upsertAppConfig);

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
    };
  }, [publicConfig]);

  const onChange = (key: keyof ConfigForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async () => {
    setIsSaving(true);

    try {
      await upsertConfig({
        baseWebUrl: form.baseWebUrl || undefined,
        termsUrl: form.termsUrl || undefined,
        privacyUrl: form.privacyUrl || undefined,
        helpCenterUrl: form.helpCenterUrl || undefined,
        supportUrl: form.supportUrl || undefined,
        shareUrl: form.shareUrl || undefined,
        iosAppStoreId: form.iosAppStoreId || undefined,
        androidAppId: form.androidAppId || undefined,
      });

      toast.success("App configuration updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update config");
    } finally {
      setIsSaving(false);
    }
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
                  Leave a field empty to use sensible defaults derived from base web URL.
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
                  placeholder="com.noosperai.quotes"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resolved Runtime Links</CardTitle>
                <CardDescription>
                  These computed values are consumed by mobile account screens.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <ResolvedRow label="Terms" value={resolved.termsUrl} />
                <ResolvedRow label="Privacy" value={resolved.privacyUrl} />
                <ResolvedRow label="Help Center" value={resolved.helpCenterUrl} />
                <ResolvedRow label="Support" value={resolved.supportUrl} />
                <ResolvedRow label="Share" value={resolved.shareUrl} />
                <Separator className="my-3" />
                <p className="text-xs text-muted-foreground">
                  Last updated: {adminConfig?.updatedAt ? new Date(adminConfig.updatedAt).toLocaleString() : "Not set"}
                </p>
              </CardContent>
            </Card>
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

function ResolvedRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-mono text-xs sm:text-sm">{value}</span>
    </div>
  );
}
