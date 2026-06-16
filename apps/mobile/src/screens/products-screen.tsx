import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../services/api';

export function ProductsScreen({ navigation }: any) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');

  const categories = [
    { label: 'All', value: '' },
    { label: 'Shirts', value: 'shirts' },
    { label: 'Hoodies', value: 'hoodies' },
    { label: 'Shoes', value: 'shoes' },
  ];

  useEffect(() => {
    setLoading(true);
    const params = category ? `?category=${category}&limit=50` : '?limit=50';
    api.get(`/products${params}`)
      .then((res: any) => setProducts(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <SafeAreaView className="flex-1 bg-[#F7F3EB]" edges={['bottom']}>
      <View className="px-6 py-4">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setCategory(item.value)}
              className={`mr-2 rounded-full px-5 py-2 ${
                category === item.value ? 'bg-[#0B0B0B]' : 'bg-white'
              }`}
            >
              <Text
                className={`text-xs font-medium uppercase tracking-wider ${
                  category === item.value ? 'text-white' : 'text-[#8A857D]'
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#C8A96A" />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ paddingHorizontal: 12, gap: 12 }}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => navigation.navigate('ProductDetail', { id: item.id })}
              className="mb-4 flex-1"
            >
              <View className="aspect-[3/4] rounded-xl bg-white overflow-hidden">
                {item.images?.[0]?.url ? (
                  <Image
                    source={{ uri: item.images[0].url }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <Text className="text-[#8A857D]">No image</Text>
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
        />
      )}
    </SafeAreaView>
  );
}
