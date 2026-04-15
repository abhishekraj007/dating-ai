"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@dating-ai/backend/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProtectedRoute } from "@/components/protected-route";
import { Upload, Loader2, Trash2, Image as ImageIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PageShell } from "@/components/admin/page-shell";
import { PageHeader } from "@/components/admin/page-header";
import { EmptyState } from "@/components/admin/empty-state";
import { StatChip } from "@/components/admin/stat-chip";

export default function UploadsPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploads = useQuery(api.uploads.listUserUploads, {});
  const deleteUpload = useMutation(api.uploads.deleteUpload);
  const generateUploadUrl = useMutation(api.uploads.generateUploadUrlWithUser);
  const syncMetadata = useMutation(api.uploads.syncMetadata);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      console.log(
        "Starting upload for file:",
        selectedFile.name,
        selectedFile.type
      );

      // Generate upload URL with user ID in the key
      const { url, key } = await generateUploadUrl({});

      // Upload file to R2
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

      // Sync metadata to trigger onSyncMetadata callback
      await syncMetadata({ key });

      console.log("Upload successful! Key:", key);

      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (key: string) => {
    if (confirm("Are you sure you want to delete this file?")) {
      await deleteUpload({ key });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const isImage = (contentType: string) => {
    return contentType.startsWith("image/");
  };

  return (
    <ProtectedRoute>
      <PageShell className="max-w-[1400px]">
        <PageHeader
          title="Uploads"
          subtitle="Upload and manage files in Cloudflare R2."
        />
        <div className="mb-4 flex flex-wrap gap-2">
          <StatChip label="total files" value={uploads?.length ?? 0} variant="outline" />
          {selectedFile ? (
            <StatChip label="selected" value={selectedFile.name} />
          ) : null}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Upload Card */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Upload New File</CardTitle>
              <CardDescription>
                Select a file to upload to Cloudflare R2 storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  disabled={isUploading}
                  className="flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
                />
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="sm:w-auto"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
              {selectedFile && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Selected: {selectedFile.name} (
                  {formatFileSize(selectedFile.size)})
                </p>
              )}
            </CardContent>
          </Card>

          {/* Uploads List */}
          <div className="md:col-span-2 lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Your Uploads</CardTitle>
                <CardDescription>
                  {uploads?.length || 0} file(s) uploaded
                </CardDescription>
              </CardHeader>
              <CardContent>
                {uploads === undefined ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : uploads === null ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Please sign in to view your uploads</p>
                  </div>
                ) : uploads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <EmptyState
                      title="No uploads yet"
                      description="Upload files to start using assets in your admin workflows."
                      icon={<ImageIcon className="mx-auto h-10 w-10 opacity-60" />}
                    />
                  </div>
                ) : (
                  <ScrollArea className="h-[600px]">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {uploads.map((upload) => (
                        <Card key={upload._id} className="overflow-hidden">
                          <div className="aspect-video bg-muted flex items-center justify-center">
                            {isImage(upload.contentType) && upload.url ? (
                              <img
                                src={upload.url}
                                alt="Upload"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-12 w-12 text-muted-foreground" />
                            )}
                          </div>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {upload.key.split("/").pop()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(upload.contentLength)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(
                                    upload.uploadedAt
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={!upload.url}
                                  onClick={() =>
                                    upload.url &&
                                    window.open(upload.url, "_blank")
                                  }
                                >
                                  <Upload className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(upload.key)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageShell>
    </ProtectedRoute>
  );
}
