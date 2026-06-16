import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

export function HomeScreen({ navigation }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products/featured')
      .then((res: any) => setProducts(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#F7F3EB]" edges={['bottom']}>
      <FlatList
        ListHeaderComponent={() => (
          <View>
            <View className="bg-[#0B0B0B] px-6 py-16">
              <Text className="text-xs font-semibold uppercase tracking-widest text-[#C8A96A]">
                Premium Collection
              </Text>
              <Text className="mt-3 font-display text-4xl font-bold text-white">
                Define Your{'\n'}
                <Text className="text-[#C8A96A]">Identity</Text>
              </Text>
              <Text className="mt-4 text-base text-[#8A857D]">
                Discover premium clothing that speaks to your individuality.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Products')}
                className="mt-8 self-start rounded-full bg-[#C8A96A] px-8 py-3"
              >
                <Text className="text-sm font-semibold uppercase tracking-wider text-[#0B0B0B]">
                  Shop Now
                </Text>
              </TouchableOpacity>
            </View>

            <View className="px-6 py-8">
              <Text className="text-xs font-semibold uppercase tracking-widest text-[#C8A96A]">
                Curated Selection
              </Text>
              <Text className="mt-2 font-display text-2xl font-bold text-[#0B0B0B]">
                Featured Products
              </Text>
            </View>
          </View>
        )}
        data={products}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 12, gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('ProductDetail', { id: item.id })}
            className="mb-4 flex-1"
          >
            <View className="aspect-[3/4] rounded-xl bg-[#F7F3EB] overflow-hidden">
              {item.images?.[0]?.url ? (
                <Image
                  source={{ uri: item.images[0].url }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Ionicons name="shirt-outline" size={32} color="#8A857D" />
                </View>
              )}
            </View>
            <Text className="mt-2 text-sm font-medium text-[#0B0B0B]" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="text-sm font-semibold text-[#C8A96A]">
              ${item.price.toLocaleString('es-CO')}
            </Text>
          </TouchableOpacity>
        )}
        ListFooterComponent={
          loading ? (
            <View className="py-8">
              <ActivityIndicator size="large" color="#C8A96A" />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
