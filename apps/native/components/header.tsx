import { View, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { Icon } from '@/components/ui/icon';
import { Sun, Moon } from 'lucide-react-native';
import { useColorScheme } from '@/lib/use-color-scheme';

export function Header() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className="px-4 py-3 flex-row justify-between items-center bg-card border-b border-border">
      <Text size="lg" bold className="text-foreground">
        BETTER T STACK
      </Text>
      <TouchableOpacity
        onPress={toggleColorScheme}
        className="p-2 rounded-lg bg-background"
      >
        <Icon
          as={isDark ? Sun : Moon}
          size="md"
          className={isDark ? 'text-yellow-400' : 'text-primary-600'}
        />
      </TouchableOpacity>
    </View>
  );
}
