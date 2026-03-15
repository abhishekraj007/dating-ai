import React, { type ErrorInfo } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Text } from "./text";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  screenName?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
  componentStack: string;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    error: null,
    componentStack: "",
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      error,
      componentStack: "",
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `[ErrorBoundary:${this.props.screenName ?? "screen"}]`,
      error,
      errorInfo,
    );

    this.setState({
      error,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleRetry = () => {
    this.setState({ error: null, componentStack: "" });
  };

  render() {
    const { error, componentStack } = this.state;

    if (!error) {
      return this.props.children;
    }

    return (
      <View className="flex-1 bg-background px-5 py-8">
        <ScrollView
          contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          <Text size="2xl" weight="bold">
            {this.props.screenName ?? "Screen"} crashed
          </Text>
          <Text variant="semi-muted">
            The actual runtime error is shown below so the failure is visible in
            app instead of only in Metro.
          </Text>

          <View className="rounded-2xl border border-border bg-content2 p-4">
            <Text weight="semibold">Message</Text>
            <Text selectable style={{ marginTop: 8 }}>
              {error.name}: {error.message || "Unknown error"}
            </Text>
          </View>

          {error.stack ? (
            <View className="rounded-2xl border border-border bg-content2 p-4">
              <Text weight="semibold">Stack</Text>
              <Text selectable size="sm" style={{ marginTop: 8 }}>
                {error.stack}
              </Text>
            </View>
          ) : null}

          {componentStack ? (
            <View className="rounded-2xl border border-border bg-content2 p-4">
              <Text weight="semibold">Component Stack</Text>
              <Text selectable size="sm" style={{ marginTop: 8 }}>
                {componentStack}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={this.handleRetry}
            className="items-center rounded-2xl bg-foreground px-4 py-4"
          >
            <Text style={{ color: "#000" }} weight="semibold">
              Retry Render
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }
}
