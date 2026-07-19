import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { CloseCircle, SearchNormal1, Star1, Eye, MagicStar, Scissor, Heart, Like1, User, DocumentText, Link2, Copy, Share as ShareIcon, TickSquare } from 'iconsax-react-native';
import { colors } from '@/lib/theme';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useAnamnesisStore, AnamnesisTemplate } from '@/lib/state/anamnesis-store';
import { useAuthStore } from '@/lib/state/auth-store';

const getTemplateIcon = (iconName: string, size: number = 24, color: string = colors.primary) => {
  switch (iconName) {
    case 'eyebrow':
      return <View><Text style={{ fontSize: size * 0.9 }}>✍️</Text></View>;
    case 'eye':
      return <Eye size={size} color={color}  variant="Outline" />;
    case 'eyelash':
      return <View><Text style={{ fontSize: size * 0.9 }}>👁️</Text></View>;
    case 'nail':
      return <View><Text style={{ fontSize: size * 0.9 }}>💅</Text></View>;
    case 'wax':
      return <MagicStar size={size} color={color}  variant="Outline" />;
    case 'hair':
      return <Scissor size={size} color={color}  variant="Outline" />;
    case 'massage':
      return <Like1 size={size} color={color} />;
    case 'face':
      return <View><Text style={{ fontSize: size * 0.9 }}>🧖</Text></View>;
    case 'foot':
      return <Star1 size={size} color={color} />;
    case 'barber':
      return <Scissor size={size} color={color}  variant="Outline" />;
    default:
      return <DocumentText size={size} color={color}  variant="Outline" />;
  }
};

export default function AnamnesisTemplatesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ clientId?: string; clientName?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLinkTemplate, setSelectedLinkTemplate] = useState<AnamnesisTemplate | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const { templates, toggleFavorite } = useAnamnesisStore();
  const establishmentId = useAuthStore(s => s.establishmentId);

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const favoriteTemplates = filteredTemplates.filter((t) => t.isFavorite);
  const otherTemplates = filteredTemplates.filter((t) => !t.isFavorite);

  const generateLink = (template: AnamnesisTemplate) => {
    const estSlug = establishmentId || 'demo';
    return `https://appbello.com.br/anamnese/${template.id}?est=${estSlug}`;
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleToggleFavorite = (templateId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    toggleFavorite(templateId);
  };

  const handleSelectTemplate = (template: AnamnesisTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/admin/anamnesis-form',
      params: {
        templateId: template.id,
        clientId: params.clientId,
        clientName: params.clientName,
      },
    });
  };

  const handleGenerateLink = (template: AnamnesisTemplate) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedLinkTemplate(template);
  };

  const handleCopyLink = async () => {
    if (!selectedLinkTemplate) return;
    await Clipboard.setStringAsync(generateLink(selectedLinkTemplate));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const handleShareLink = async () => {
    if (!selectedLinkTemplate) return;
    const link = generateLink(selectedLinkTemplate);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Preencha sua ficha de ${selectedLinkTemplate.name} antes do atendimento:\n\n${link}`,
        title: `Ficha de ${selectedLinkTemplate.name}`,
      });
    } catch {}
  };

  const TemplateCard = ({ template, index }: { template: AnamnesisTemplate; index: number }) => (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 50)}>
      <View
        className="flex-row items-center mb-3 rounded-2xl overflow-hidden"
        style={{
          backgroundColor: colors.backgroundCard,
          borderWidth: 1,
          borderColor: colors.primary + '30',
        }}
      >
        <Pressable
          onPress={() => handleSelectTemplate(template)}
          className="flex-1 flex-row items-center p-4"
        >
          <View
            className="w-14 h-14 rounded-xl items-center justify-center mr-4"
            style={{ backgroundColor: colors.primary + '15' }}
          >
            {getTemplateIcon(template.icon, 26, colors.primary)}
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold" style={{ color: colors.primary }}>
              {template.name}
            </Text>
            <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>
              {template.description}
            </Text>
          </View>
        </Pressable>

        {/* Gerar Link button */}
        <Pressable
          onPress={() => handleGenerateLink(template)}
          className="px-3 py-4 items-center justify-center"
          hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
        >
          <View
            className="w-8 h-8 rounded-lg items-center justify-center"
            style={{ backgroundColor: colors.secondary + '15' }}
          >
            <Link2 size={16} color={colors.secondary}  variant="Outline" />
          </View>
        </Pressable>

        {/* Favorite button */}
        <Pressable
          onPress={() => handleToggleFavorite(template.id)}
          className="px-4 py-4"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Star1
            size={22}
            color={template.isFavorite ? '#FFB547' : colors.warning}
            fill={template.isFavorite ? '#FFB547' : 'transparent'}
           variant="Outline" />
        </Pressable>
      </View>
    </Animated.View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.primary + '20', colors.background]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200 }}
      />

      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        {/* Header */}
        <View className="px-5 py-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-gray-900 font-bold text-xl">Selecione uma ficha</Text>
            <Pressable
              onPress={handleClose}
              className="w-10 h-10 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.surface }}
            >
              <CloseCircle size={20} color={colors.textPrimary}  variant="Outline" />
            </Pressable>
          </View>

          {params.clientName && (
            <View className="flex-row items-center mb-4">
              <User size={14} color={colors.secondary}  variant="Outline" />
              <Text className="text-gray-600 text-sm ml-2">
                Para: <Text className="font-semibold" style={{ color: colors.secondary }}>{params.clientName}</Text>
              </Text>
            </View>
          )}

          <View
            className="flex-row items-center p-3 rounded-xl mb-2"
            style={{ backgroundColor: colors.secondary + '12' }}
          >
            <Link2 size={14} color={colors.secondary}  variant="Outline" />
            <Text className="text-xs ml-2 flex-1" style={{ color: colors.secondary }}>
              Toque no ícone <Text className="font-bold">🔗</Text> para gerar um link e enviar a ficha ao cliente preencher.
            </Text>
          </View>
        </View>

        {/* Search */}
        <View className="px-5 mb-4">
          <View
            className="flex-row items-center px-4 py-3 rounded-xl"
            style={{ backgroundColor: colors.backgroundCard }}
          >
            <SearchNormal1 size={20} color={colors.textMuted}  variant="Outline" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Buscar ficha..."
              placeholderTextColor={colors.textMuted}
              className="flex-1 ml-3 text-gray-900"
            />
          </View>
        </View>

        <ScrollView
          className="flex-1 px-5"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Favoritos */}
          {favoriteTemplates.length > 0 && (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Star1 size={16} color="#FFB547" fill="#FFB547"  variant="Outline" />
                <Text className="text-gray-500 text-xs uppercase tracking-wide ml-2">
                  Favoritos
                </Text>
              </View>
              {favoriteTemplates.map((template, index) => (
                <TemplateCard key={template.id} template={template} index={index} />
              ))}
            </View>
          )}

          {/* Fichas Padrões */}
          <View className="mb-4">
            <View
              className="flex-row items-center justify-between py-2 px-3 rounded-lg mb-3"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-gray-600 text-sm">Fichas Padrões</Text>
              <Text className="text-xs" style={{ color: colors.primary }}>
                (Toque na estrela para favoritar)
              </Text>
            </View>

            {otherTemplates.map((template, index) => (
              <TemplateCard
                key={template.id}
                template={template}
                index={favoriteTemplates.length + index}
              />
            ))}
          </View>

          {filteredTemplates.length === 0 && (
            <View className="items-center py-10">
              <DocumentText size={48} color={colors.textMuted}  variant="Outline" />
              <Text className="text-gray-500 text-base mt-4">Nenhuma ficha encontrada</Text>
            </View>
          )}
        </ScrollView>

        {/* Close Button */}
        <View className="px-5 pb-4">
          <Pressable
            onPress={handleClose}
            className="py-4 rounded-2xl items-center"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-white font-bold text-base">FECHAR</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Link Generation Modal */}
      <Modal
        visible={!!selectedLinkTemplate}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedLinkTemplate(null)}
      >
        <Pressable
          className="flex-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setSelectedLinkTemplate(null)}
        >
          <View className="flex-1 justify-end">
            <Pressable onPress={() => {}}>
              <View
                className="rounded-t-3xl px-5 pt-5 pb-8"
                style={{ backgroundColor: colors.backgroundCard }}
              >
                {/* Handle bar */}
                <View className="w-10 h-1 rounded-full self-center mb-5" style={{ backgroundColor: colors.border }} />

                {/* Header */}
                <View className="flex-row items-center justify-between mb-5">
                  <View className="flex-row items-center flex-1 mr-3">
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                      style={{ backgroundColor: colors.secondary + '15' }}
                    >
                      <Link2 size={20} color={colors.secondary}  variant="Outline" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-bold text-lg">Gerar Link</Text>
                      <Text className="text-gray-500 text-xs">
                        {selectedLinkTemplate?.name}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => setSelectedLinkTemplate(null)}
                    className="w-9 h-9 rounded-full items-center justify-center"
                    style={{ backgroundColor: colors.surface }}
                  >
                    <CloseCircle size={18} color={colors.textPrimary}  variant="Outline" />
                  </Pressable>
                </View>

                {/* Description */}
                <View
                  className="p-4 rounded-2xl mb-5"
                  style={{ backgroundColor: colors.secondary + '10' }}
                >
                  <Text className="text-sm leading-5" style={{ color: colors.secondary }}>
                    Compartilhe este link com seu cliente para que ele preencha a ficha antes do atendimento, sem precisar baixar o aplicativo.
                  </Text>
                </View>

                {/* Link display */}
                {selectedLinkTemplate && (
                  <View
                    className="flex-row items-center p-4 rounded-2xl mb-5"
                    style={{ backgroundColor: colors.background }}
                  >
                    <Text
                      className="flex-1 text-sm mr-3"
                      style={{ color: colors.textMuted }}
                      numberOfLines={2}
                    >
                      {generateLink(selectedLinkTemplate)}
                    </Text>
                    <View
                      className="w-1 h-8 rounded-full mr-3"
                      style={{ backgroundColor: colors.border }}
                    />
                    <Pressable
                      onPress={handleCopyLink}
                      className="w-10 h-10 rounded-xl items-center justify-center"
                      style={{ backgroundColor: linkCopied ? colors.success + '20' : colors.primary + '15' }}
                    >
                      {linkCopied
                        ? <TickSquare size={18} color={colors.success}  variant="Outline" />
                        : <Copy size={18} color={colors.primary}  variant="Outline" />
                      }
                    </Pressable>
                  </View>
                )}

                {/* Action buttons */}
                <View className="flex-row gap-3">
                  <Pressable
                    onPress={handleCopyLink}
                    className="flex-1 py-4 rounded-2xl items-center flex-row justify-center"
                    style={{
                      backgroundColor: linkCopied ? colors.success : colors.surface,
                    }}
                  >
                    {linkCopied
                      ? <TickSquare size={18} color="#fff"  variant="Outline" />
                      : <Copy size={18} color={colors.textPrimary}  variant="Outline" />
                    }
                    <Text
                      className="font-semibold ml-2"
                      style={{ color: linkCopied ? '#fff' : colors.textPrimary }}
                    >
                      {linkCopied ? 'Copiado!' : 'Copiar'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={handleShareLink}
                    className="flex-1 py-4 rounded-2xl items-center flex-row justify-center"
                    style={{ backgroundColor: colors.secondary }}
                  >
                    <ShareIcon size={18} color="#fff" />
                    <Text className="text-white font-semibold ml-2">Compartilhar</Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
