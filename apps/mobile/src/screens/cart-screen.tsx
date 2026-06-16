import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export function CartScreen({ navigation }: any) {
  const items: any[] = [];
  const total = 0;

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F7F3EB]" edges={['bottom']}>
        <Ionicons name="cart-outline" size={48} color="#8A857D" />
        <Text className="mt-4 text-base text-[#8A857D]">Your cart is empty</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Products')}
          className="mt-6 rounded-full bg-[#0B0B0B] px-8 py-3"
        >
          <Text className="text-xs font-medium uppercase tracking-wider text-white">
            Shop Now
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F7F3EB]" edges={['bottom']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View className="mb-4 flex-row gap-4 rounded-xl bg-white p-4">
            <View className="h-20 w-20 rounded-lg bg-[#F7F3EB] overflow-hidden">
              <Image source={{ uri: item.image }} className="h-full w-full" resizeMode="cover" />
            </View>
            <View className="flex-1 justify-between">
              <Text className="text-sm font-medium">{item.name}</Text>
              <Text className="text-sm font-semibold text-[#C8A96A]">${item.price.toLocaleString('es-CO')}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
