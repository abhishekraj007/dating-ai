import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { authClient } from "@/lib/auth-client";
import {
  Button,
  ButtonText,
  ButtonSpinner,
  ButtonIcon,
} from "@/components/ui/button";
import { Input, InputField, InputSlot, InputIcon } from "@/components/ui/input";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Divider } from "@/components/ui/divider";
import { Header } from "@/components/header";
import { useColorScheme } from "@/lib/use-color-scheme";
import { Container } from "../container";
import { Icon } from "../ui/icon";
import { Eye, EyeOff, Mail, Lock, Chrome, Apple } from "lucide-react-native";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDarkColorScheme } = useColorScheme();

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }

    setIsLoading(true);
    setError(null);

    await authClient.signIn.email(
      {
        email,
        password,
      },
      {
        onError: (error) => {
          setError(error.error?.message || "Failed to sign in");
          setIsLoading(false);
        },
        onSuccess: () => {
          setEmail("");
          setPassword("");
        },
        onFinished: () => {
          setIsLoading(false);
        },
      }
    );
  };

  const handleGoogleSignIn = async () => {
    const data = await authClient.signIn.social({
      provider: "google",
    });

    console.log("Google Sign-In clicked", JSON.stringify(data, null, 2));
  };

  const handleAppleSignIn = async () => {
    const data = await authClient.signIn.social({
      provider: "apple",
    });
    console.log("Apple Sign-In clicked", JSON.stringify(data, null, 2));
  };

  return (
    <Container>
      <StatusBar
        barStyle={isDarkColorScheme ? "light-content" : "dark-content"}
      />
      <Header />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 py-12 justify-center">
            <VStack space="xl" className="max-w-md w-full mx-auto">
              <VStack space="sm" className="items-center mb-4">
                <Heading size="3xl" className="text-center">
                  Welcome Back
                </Heading>
                <Text size="md" className="text-center opacity-70">
                  Sign in to continue to your account
                </Text>
              </VStack>

              {error && (
                <View className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <Text className="text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </Text>
                </View>
              )}

              <VStack space="xs">
                <Text size="sm" className="font-medium">
                  Email
                </Text>
                <Input size="lg" variant="outline" className="bg-card">
                  <InputField
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    editable={!isLoading}
                  />
                </Input>
              </VStack>

              <VStack space="xs">
                <Text size="sm" className="font-medium">
                  Password
                </Text>
                <Input size="lg" variant="outline" className="bg-card">
                  <InputField
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={setPassword}
                    type={showPassword ? "text" : "password"}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <InputSlot
                    className="pr-3"
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <InputIcon>
                      <Icon
                        as={showPassword ? EyeOff : Eye}
                        size="sm"
                        className="text-typography-500"
                      />
                    </InputIcon>
                  </InputSlot>
                </Input>
              </VStack>

              <TouchableOpacity className="self-end -mt-2">
                <Text size="sm" className="text-primary">
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              <Button
                size="lg"
                action="primary"
                onPress={handleEmailSignIn}
                isDisabled={isLoading}
                className="mt-2"
              >
                {isLoading ? (
                  <ButtonSpinner />
                ) : (
                  <ButtonText>Sign In</ButtonText>
                )}
              </Button>

              <HStack space="md" className="items-center my-4">
                <Divider className="flex-1" />
                <Text size="sm" className="opacity-70">
                  Or continue with
                </Text>
                <Divider className="flex-1" />
              </HStack>

              <VStack space="md">
                <Button
                  variant="outline"
                  size="lg"
                  onPress={handleGoogleSignIn}
                  isDisabled={isLoading}
                >
                  <Icon as={Chrome} size="sm" className="text-typography-700" />
                  <ButtonText>Continue with Google</ButtonText>
                </Button>

                {Platform.OS === "ios" && (
                  <Button
                    variant="outline"
                    size="lg"
                    onPress={handleAppleSignIn}
                    isDisabled={isLoading}
                  >
                    <Icon
                      as={Apple}
                      size="sm"
                      // className="text-typography-700"
                    />
                    <ButtonText>Continue with Apple</ButtonText>
                  </Button>
                )}
              </VStack>

              <HStack space="xs" className="justify-center mt-6">
                <Text size="sm" className="opacity-70">
                  Don't have an account?
                </Text>
                <TouchableOpacity>
                  <Text size="sm" className="text-primary font-medium">
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </HStack>
            </VStack>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
}
