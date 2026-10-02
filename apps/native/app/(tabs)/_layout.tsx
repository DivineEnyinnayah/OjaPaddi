import { Tabs } from 'expo-router';
import { FloatingTabBar } from '../../components/ui/floating-tab-bar';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => {
        const { state, descriptors, navigation, insets } = props;
        return <FloatingTabBar state={state} navigation={navigation} descriptors={descriptors as Record<string, unknown>} insets={insets} />;
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="products" options={{ title: 'Products' }} />
      <Tabs.Screen name="sales" options={{ title: 'Sales' }} />
      <Tabs.Screen name="customers" options={{ title: 'Customers' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
    </Tabs>
  );
}
