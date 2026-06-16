import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { HomeScreen } from '../screens/home-screen';
import { ProductsScreen } from '../screens/products-screen';
import { ProductDetailScreen } from '../screens/product-detail-screen';
import { CartScreen } from '../screens/cart-screen';
import { AccountScreen } from '../screens/account-screen';
import { AuthScreen } from '../screens/auth-screen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Products') iconName = focused ? 'grid' : 'grid-outline';
          else if (route.name === 'Cart') iconName = focused ? 'cart' : 'cart-outline';
          else if (route.name === 'Account') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0B0B0B',
        tabBarInactiveTintColor: '#8A857D',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#F7F3EB',
          paddingBottom: 8,
          height: 60,
        },
        headerStyle: { backgroundColor: '#0B0B0B' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontFamily: 'Playfair Display', fontWeight: '700' },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'VELORA' }} />
      <Tab.Screen name="Products" component={ProductsScreen} options={{ title: 'Products' }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: 'Cart' }} />
      <Tab.Screen name="Account" component={AccountScreen} options={{ title: 'Account' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={HomeTabs} />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{ headerShown: true, title: '', headerBackTitle: 'Back' }}
        />
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: true, title: 'Sign In' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
