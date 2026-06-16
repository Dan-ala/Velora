import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../services/api';

export function ProductDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    api.get(`/products/${id}`)
      .then((res: any) => setProduct(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F7F3EB]">
        <ActivityIndicator size="large" color="#C8A96A" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F7F3EB]">
        <Text className="text-[#8A857D]">Product not found</Text>
      </View>
    );
  }

  const imageUrl = product.images?.[0]?.url;

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="aspect-[4/5] bg-[#F7F3EB]">
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="image-outline" size={48} color="#8A857D" />
          </View>
        )}
      </View>

      <View className="px-6 py-8">
        <Text className="text-xs font-semibold uppercase tracking-widest text-[#C8A96A]">
          {product.category}
        </Text>
        <Text className="mt-2 font-display text-2xl font-bold text-[#0B0B0B]">{product.name}</Text>
        <Text className="mt-3 text-xl font-semibold text-[#C8A96A]">
          ${product.price.toLocaleString('es-CO')}
        </Text>
        <Text className="mt-4 leading-6 text-[#8A857D]">{product.description}</Text>

        <View className="mt-8 flex-row items-center gap-4">
          <Text className="text-xs font-medium uppercase tracking-wider">Quantity</Text>
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              className="h-9 w-9 items-center justify-center rounded-full border"
            >
              <Ionicons name="remove" size={14} color="#0B0B0B" />
            </TouchableOpacity>
            <Text className="w-8 text-center text-sm font-medium">{quantity}</Text>
            <TouchableOpacity
              onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
              className="h-9 w-9 items-center justify-center rounded-full border"
            >
              <Ionicons name="add" size={14} color="#0B0B0B" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          disabled={product.stock === 0}
          className="mt-8 h-12 flex-row items-center justify-center gap-2 rounded-full bg-[#0B0B0B]"
        >
          <Ionicons name="cart-outline" size={18} color="white" />
          <Text className="text-sm font-medium uppercase tracking-wider text-white">
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
