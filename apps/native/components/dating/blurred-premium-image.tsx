import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useEffect, useRef, useState } from "react";
import { Button, Avatar, useThemeColor, Dialog } from "heroui-native";
import { X, Lock } from "lucide-react-native";
import { usePurchases } from "@/contexts/purchases-context";

interface BlurredPremiumImageProps {
  imageUrl: string;
  width: number;
  height: number;
  profileName?: string;
  profileAvatar?: string | null;
  borderRadius?: number;
}

export function BlurredPremiumImage({
  imageUrl,
  width,
  height,
  profileName = "AI",
  profileAvatar,
  borderRadius = 16,
}: BlurredPremiumImageProps) {
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const { presentPaywall } = usePurchases();
  const { width: screenWidth } = useWindowDimensions();

  const handleUnlock = () => {
    setShowUnlockModal(false);
    presentPaywall();
  };

  return (
    <>
      <Pressable
        onPress={() => setShowUnlockModal(true)}
        style={[styles.container, { width, height, borderRadius }]}
      >
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, { width, height, borderRadius }]}
          contentFit="cover"
          blurRadius={30}
          cachePolicy="disk"
        />
        <View style={[styles.overlay, { borderRadius }]}>
          <View style={styles.lockBadge}>
            <Lock size={16} color="#fff" />
          </View>
          <View style={styles.tapLabel}>
            <Text style={styles.tapText}>Tap to See Photo</Text>
          </View>
        </View>
      </Pressable>

      <Dialog isOpen={showUnlockModal} onOpenChange={setShowUnlockModal}>
        <Dialog.Portal className="flex-1 justify-center items-center">
          <Dialog.Overlay className="bg-black/70" />
          <Dialog.Content className="w-[90%] max-w-[360px] bg-[#1a1a1a] rounded-3xl overflow-hidden p-0">
            <Dialog.Close className="absolute top-4 right-4 z-10 bg-white/90 rounded-full p-2">
              <X size={24} color="#666" />
            </Dialog.Close>

            <Image
              source={{ uri: imageUrl }}
              style={[styles.modalImage, { width: screenWidth }]}
              contentFit="cover"
              blurRadius={75}
              cachePolicy="memory-disk"
            />

            <View style={styles.modalBody}>
              <Avatar size="lg" alt={profileName}>
                {profileAvatar ? (
                  <Avatar.Image source={{ uri: profileAvatar }} />
                ) : (
                  <Avatar.Fallback>{profileName[0]}</Avatar.Fallback>
                )}
              </Avatar>

              <Dialog.Title className="text-[22px] font-bold text-white mt-4 text-center">
                Get closer to {profileName}
              </Dialog.Title>
              <Dialog.Description className="text-[15px] text-[#999] text-center mt-2 leading-[22px]">
                {profileName} has sent you a photo. Get Premium and find out
                what hides beneath the blur.
              </Dialog.Description>

              <Button
                variant="primary"
                size="lg"
                onPress={handleUnlock}
                className="w-full mt-4"
              >
                <Button.Label>Unlock Unlimited Access</Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    position: "relative",
  },
  image: {
    position: "absolute",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  lockBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
  tapLabel: {
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  tapText: {
    color: "#000",
    fontWeight: "600",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#1a1a1a",
    borderRadius: 24,
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    padding: 8,
  },
  modalImage: {
    width: "100%",
    height: 280,
  },
  modalBody: {
    padding: 24,
    alignItems: "center",
    marginTop: -50,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginTop: 16,
    textAlign: "center",
  },
  modalDescription: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 22,
  },
});
