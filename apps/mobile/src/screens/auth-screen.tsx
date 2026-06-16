import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../services/api';

export function AuthScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
    } else {
      navigation.goBack();
    }
    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F7F3EB]" edges={['bottom']}>
      <View className="px-6 py-8">
        <Text className="text-xl font-semibold text-[#0B0B0B]">Welcome back</Text>
        <Text className="mt-1 text-sm text-[#8A857D]">Sign in to your account</Text>

        {error ? (
          <View className="mt-4 rounded-lg bg-red-50 p-3">
            <Text className="text-xs text-red-500">{error}</Text>
          </View>
        ) : null}

        <View className="mt-8 space-y-4">
          <View>
            <Text className="text-xs font-medium uppercase tracking-wider text-[#8A857D]">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              className="mt-1.5 rounded-xl border border-[#D2CDC5] bg-white px-4 py-3 text-sm"
              placeholder="your@email.com"
            />
          </View>
          <View>
            <Text className="text-xs font-medium uppercase tracking-wider text-[#8A857D]">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              className="mt-1.5 rounded-xl border border-[#D2CDC5] bg-white px-4 py-3 text-sm"
              placeholder="••••••••"
            />
          </View>
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="h-12 items-center justify-center rounded-full bg-[#0B0B0B]"
          >
            <Text className="text-sm font-medium uppercase tracking-wider text-white">
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
