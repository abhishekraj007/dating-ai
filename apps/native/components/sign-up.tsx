import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { useTranslation } from "@/hooks/use-translation";
import {
	ActivityIndicator,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";

export function SignUp() {
	const { t } = useTranslation();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSignUp = async () => {
		setIsLoading(true);
		setError(null);

		await authClient.signUp.email(
			{
				name,
				email,
				password,
			},
			{
				onError: (error) => {
					setError(error.error?.message || t("signUp.failed"));
					setIsLoading(false);
				},
				onSuccess: () => {
					setName("");
					setEmail("");
					setPassword("");
				},
				onFinished: () => {
					setIsLoading(false);
				},
			},
		);
	};

	return (
		<View className="mt-6 p-4 bg-card rounded-lg border border-border">
			<Text className="text-lg font-semibold text-foreground mb-4">
				{t("signUp.createAccount")}
			</Text>

			{error && (
				<View className="mb-4 p-3 bg-destructive/10 rounded-md">
					<Text className="text-destructive text-sm">{error}</Text>
				</View>
			)}

			<TextInput
				className="mb-3 p-4 rounded-md bg-input text-foreground border border-input"
				placeholder={t("common.name")}
				value={name}
				onChangeText={setName}
				placeholderTextColor="#9CA3AF"
			/>

			<TextInput
				className="mb-3 p-4 rounded-md bg-input text-foreground border border-input"
				placeholder={t("common.email")}
				value={email}
				onChangeText={setEmail}
				placeholderTextColor="#9CA3AF"
				keyboardType="email-address"
				autoCapitalize="none"
			/>

			<TextInput
				className="mb-4 p-4 rounded-md bg-input text-foreground border border-input"
				placeholder={t("common.password")}
				value={password}
				onChangeText={setPassword}
				placeholderTextColor="#9CA3AF"
				secureTextEntry
			/>

			<TouchableOpacity
				onPress={handleSignUp}
				disabled={isLoading}
				className="bg-primary p-4 rounded-md flex-row justify-center items-center"
			>
				{isLoading ? (
					<ActivityIndicator size="small" color="#fff" />
				) : (
					<Text className="text-primary-foreground font-medium">
						{t("common.signUp")}
					</Text>
				)}
			</TouchableOpacity>
		</View>
	);
}
