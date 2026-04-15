import { useState } from "react";
import { View, Alert, Text, ScrollView } from "react-native";
import { Image } from "expo-image";
import { useMutation } from "convex/react";
import { useQuery } from "convex-helpers/react/cache";
import { api } from "@dating-ai/backend/convex/_generated/api";
import * as ImagePicker from "expo-image-picker";
import { Button, Card, Spinner } from "heroui-native";
import { Ionicons } from "@expo/vector-icons";
import { withUniwind } from "uniwind";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "@/hooks/use-translation";

const StyledIonicons = withUniwind(Ionicons);

export default function UploadsScreen() {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploads = useQuery(api.uploads.listUserUploads, {});
  const generateUploadUrl = useMutation(api.uploads.generateUploadUrlWithUser);
  const syncMetadata = useMutation(api.uploads.syncMetadata);
  const deleteUpload = useMutation(api.uploads.deleteUpload);

  const pickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert(
        t("uploads.permissionRequired"),
        t("uploads.permissionRequiredDescription"),
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const uploadImage = async () => {
    if (!selectedImage) return;

    try {
      setIsUploading(true);

      // Step 1: Generate upload URL
      const result = await generateUploadUrl({});

      // Step 2: Fetch the image as a blob
      const response = await fetch(selectedImage);
      const blob = await response.blob();

      // Step 3: Upload to R2
      const uploadResponse = await fetch(result.url, {
        method: "PUT",
        headers: {
          "Content-Type": blob.type,
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      // Step 4: Sync metadata
      await syncMetadata({ key: result.key });

      Alert.alert(t("alerts.success"), t("uploads.uploadSuccess"));
      setSelectedImage(null);
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert(t("alerts.error"), t("uploads.uploadFailed"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (key: string) => {
    Alert.alert(t("uploads.deleteFile"), t("uploads.deleteConfirm"), [
      { text: t("alerts.cancel"), style: "cancel" },
      {
        text: t("alerts.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteUpload({ key });
          } catch (error) {
            Alert.alert(t("alerts.error"), t("uploads.deleteFailed"));
          }
        },
      },
    ]);
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

  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingHorizontal: 16,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View className="py-6 gap-6">
        {/* Header */}
        <View className="gap-2">
          <Text className="text-4xl font-bold text-foreground">
            {t("uploads.title")}
          </Text>
          <Text className="text-sm text-muted">
            {t("uploads.subtitle")}
          </Text>
        </View>

        {/* Upload Card */}
        <Card>
          <Card.Body className="gap-4">
            <Card.Title>{t("uploads.uploadNewFile")}</Card.Title>

            {selectedImage && (
              <View className="rounded-xl overflow-hidden">
                <Image
                  source={{ uri: selectedImage }}
                  style={{ width: "100%", height: 192 }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                />
              </View>
            )}

            <View className="gap-3">
              <Button
                variant="secondary"
                onPress={pickImage}
                isDisabled={isUploading}
              >
                <StyledIonicons
                  name="images-outline"
                  size={18}
                  className="text-accent-soft-foreground"
                />
                <Button.Label>{t("uploads.selectImage")}</Button.Label>
              </Button>

              <Button
                variant="primary"
                onPress={uploadImage}
                isDisabled={!selectedImage || isUploading}
              >
                {isUploading ? (
                  <Spinner size="sm" color="white" />
                ) : (
                  <>
                    <StyledIonicons
                      name="cloud-upload-outline"
                      size={18}
                      className="text-accent-foreground"
                    />
                    <Button.Label>{t("common.upload")}</Button.Label>
                  </>
                )}
              </Button>
            </View>
          </Card.Body>
        </Card>

        {/* Uploads List Card */}
        <Card>
          <Card.Body className="gap-4">
            <View className="flex-row items-center justify-between">
              <Card.Title>{t("uploads.yourUploads")}</Card.Title>
              <Text className="text-sm text-muted">
                {t("uploads.filesCount", { count: uploads?.length || 0 })}
              </Text>
            </View>

            {uploads === undefined ? (
              <View className="py-8 items-center">
                <Spinner size="lg" />
              </View>
            ) : uploads === null ? (
              <View className="py-8 items-center">
                <StyledIonicons
                  name="lock-closed-outline"
                  size={48}
                  className="text-muted opacity-50 mb-2"
                />
                <Text className="text-muted text-center">
                  {t("uploads.signInToView")}
                </Text>
              </View>
            ) : uploads.length === 0 ? (
              <View className="py-8 items-center">
                <StyledIonicons
                  name="cloud-upload-outline"
                  size={48}
                  className="text-muted opacity-50 mb-2"
                />
                <Text className="text-muted text-center">
                  {t("uploads.empty")}
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {uploads.map((upload) => (
                  <Card key={upload._id} variant="secondary">
                    {isImage(upload.contentType) && upload.url ? (
                      <Image
                        source={{ uri: upload.url }}
                        style={{
                          width: "100%",
                          height: 192,
                          borderTopLeftRadius: 12,
                          borderTopRightRadius: 12,
                        }}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={200}
                      />
                    ) : (
                      <View className="w-full h-48 bg-surface-quaternary rounded-t-xl items-center justify-center">
                        <StyledIonicons
                          name="document-outline"
                          size={48}
                          className="text-muted"
                        />
                      </View>
                    )}

                    <Card.Body className="gap-2">
                      <View className="flex-row items-start justify-between gap-2">
                        <View className="flex-1 gap-1">
                          <Text
                            className="text-sm font-medium text-foreground"
                            numberOfLines={1}
                          >
                            {upload.key.split("/").pop()}
                          </Text>
                          <Text className="text-xs text-muted">
                            {formatFileSize(upload.contentLength)}
                          </Text>
                          <Text className="text-xs text-muted">
                            {new Date(upload.uploadedAt).toLocaleDateString()}
                          </Text>
                        </View>

                        <Button
                          variant="destructive-soft"
                          size="sm"
                          isIconOnly
                          onPress={() => handleDelete(upload.key)}
                        >
                          <Button.Label>
                            <StyledIonicons
                              name="trash-outline"
                              size={16}
                              className="text-danger"
                            />
                          </Button.Label>
                        </Button>
                      </View>
                    </Card.Body>
                  </Card>
                ))}
              </View>
            )}
          </Card.Body>
        </Card>
      </View>
    </ScrollView>
  );
}
