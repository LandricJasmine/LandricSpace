/**
 * LandricOS · 相册
 *
 * 真实读取真机相册 (expo-image-picker)，
 * 上传到后端 (POST /api/v1/photos/upload FormData)
 * 列表用后端返回的 imageUrl 直接 <Image /> 渲染。
 */
import { useCallback, useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Camera, MapPin, Trash2, Heart } from 'lucide-react-native';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/common/TopBar';
import { EmptyState } from '@/components/common/States';
import { photos, type PhotoItem } from '@/utils/api';
import { useSafeRouter } from '@/hooks/useSafeRouter';

export default function PhotosScreen() {
  const router = useSafeRouter();
  const [list, setList] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pickedLocation, setPickedLocation] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await photos.list();
      setList(r.photos);
    } catch (e: any) {
      Alert.alert('读取相册失败', e?.message ?? '');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const pickFromLibrary = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('需要相册权限', '请在系统设置中允许访问相册');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;
    await uploadOne(result.assets[0].uri, result.assets[0].fileName ?? 'image.jpg', pickedLocation);
  }, [pickedLocation]);

  const uploadOne = useCallback(async (uri: string, name: string, location: string) => {
    setUploading(true);
    try {
      const fd = new FormData();
      // RN FormData: { uri, name, type }
      fd.append('image', { uri, name, type: 'image/jpeg' } as any);
      if (location) fd.append('location', location);
      await photos.upload(fd);
      await load();
    } catch (e: any) {
      Alert.alert('上传失败', e?.message ?? '');
    } finally {
      setUploading(false);
    }
  }, [load]);

  const remove = useCallback(async (id: number) => {
    try {
      await photos.remove(id);
      setList(prev => prev.filter(x => x.id !== id));
    } catch (e: any) {
      Alert.alert('删除失败', e?.message ?? '');
    }
  }, []);

  const renderItem = useCallback(({ item }: { item: PhotoItem }) => (
    <View className="mb-3 mr-2 w-[48%]">
      <View className="relative overflow-hidden rounded-lg border border-default">
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={{ width: '100%', aspectRatio: 0.85 }} resizeMode="cover" />
        ) : (
          <View className="w-full" style={{ aspectRatio: 0.85, backgroundColor: '#E8DFCC' }} />
        )}
        {item.isFavorite ? (
          <View className="absolute right-2 top-2 rounded-full bg-accent p-1">
            <Heart size={12} color="#FAF5E8" fill="#FAF5E8" />
          </View>
        ) : null}
      </View>
      <View className="mt-1 flex-row items-center justify-between px-1">
        <View className="flex-1 flex-row items-center">
          <MapPin size={10} color="#8A7560" />
          <Text className="ml-1 flex-1 text-xs text-muted" numberOfLines={1}>
            {item.location || '无地标'}
          </Text>
        </View>
        <Pressable onPress={() => remove(item.id)} hitSlop={8}>
          <Trash2 size={14} color="#A89070" />
        </Pressable>
      </View>
    </View>
  ), [remove]);

  return (
    <Screen>
      <TopBar title="相册" onBack={() => router.back()} />

      {/* 上传控制条 */}
      <View className="border-b border-default bg-surface px-5 py-3">
        <View className="flex-row items-center gap-2">
          <MapPin size={14} color="#8A7560" />
          <Pressable
            onPress={() => {
              Alert.prompt?.('拍摄地', '给这一批照片打个地标', text => setPickedLocation(text || ''));
            }}
            className="flex-1 rounded-md bg-default px-3 py-2"
          >
            <Text className="text-sm text-muted" numberOfLines={1}>
              {pickedLocation || '轻点设置地标（可选）'}
            </Text>
          </Pressable>
          <Pressable
            onPress={pickFromLibrary}
            disabled={uploading}
            className="flex-row items-center gap-1.5 rounded-md bg-accent px-3 py-2"
          >
            {uploading ? <ActivityIndicator size="small" color="#FAF5E8" /> : <Camera size={14} color="#FAF5E8" />}
            <Text className="text-sm font-medium text-accent-foreground">
              {uploading ? '上传中' : '从相册选'}
            </Text>
          </Pressable>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#B89460" />
        </View>
      ) : list.length === 0 ? (
        <EmptyState title="相册还空" hint={'点上方「从相册选」，上传你的照片'} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
        />
      )}
    </Screen>
  );
}
