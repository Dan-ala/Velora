import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export function AccountScreen({ navigation }: any) {
  const user: any = null;

  if (!user) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F7F3EB]" edges={['bottom']}>
        <Ionicons name="person-outline" size={48} color="#8A857D" />
        <Text className="mt-4 text-base text-[#8A857D]">Sign in to your account</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Auth')}
          className="mt-6 rounded-full bg-[#0B0B0B] px-8 py-3"
        >
          <Text className="text-xs font-medium uppercase tracking-wider text-white">Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F7F3EB]" edges={['bottom']}>
      <View className="p-6">
        <View className="items-center rounded-xl bg-white p-6">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-[#F7F3EB]">
            <Ionicons name="person" size={24} color="#8A857D" />
          </View>
          <Text className="mt-3 text-base font-medium">{user.email}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
