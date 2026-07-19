import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { FeatureGate } from '@/components/ui/FeatureGate';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Send2, MagicStar, RotateLeft } from 'iconsax-react-native';
import { colors } from '@/lib/theme';

const BACKEND_URL = process.env.EXPO_PUBLIC_VIBECODE_BACKEND_URL ?? 'http://localhost:3000';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS = [
  'Como fidelizar mais clientes?',
  'Dicas para aumentar o ticket médio',
  'Como organizar a agenda da equipe?',
  'Estratégias de marketing para salão',
];

export default function AiAssistantScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const userText = text.trim();
      if (!userText || isStreaming) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: userText,
      };

      const assistantId = (Date.now() + 1).toString();
      const assistantMsg: Message = {
        id: assistantId,
        role: 'assistant',
        content: '',
      };

      const nextMessages = [...messages, userMsg, assistantMsg];
      setMessages(nextMessages);
      setInput('');
      setIsStreaming(true);
      scrollToBottom();

      try {
        const history = nextMessages
          .filter((m) => m.id !== assistantId)
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await fetch(`${BACKEND_URL}/api/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: history }),
        });

        if (!response.ok || !response.body) {
          throw new Error('Network error');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (line.startsWith('data:')) {
              const rawData = line.slice(5).trim();
              if (!rawData) continue;
              try {
                const parsed = JSON.parse(rawData) as { text?: string; error?: string };
                if (parsed.text) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId ? { ...m, content: m.content + parsed.text } : m
                    )
                  );
                  scrollToBottom();
                }
              } catch {
                // ignore malformed JSON
              }
            }
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: 'Desculpe, ocorreu um erro. Tente novamente.' }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
        scrollToBottom();
      }
    },
    [messages, isStreaming, scrollToBottom]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setInput('');
  }, []);

  return (
    <FeatureGate featureKey="assistente_ia">
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
          <Pressable
            onPress={() => router.back()}
            className="w-9 h-9 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: '#F3F4F6' }}
          >
            <ArrowLeft size={18} color={colors.textPrimary}  variant="Outline" />
          </Pressable>
          <View
            className="w-9 h-9 rounded-full items-center justify-center mr-3"
            style={{ backgroundColor: colors.primary }}
          >
            <MagicStar size={16} color="#fff"  variant="Outline" />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">Assistente IA</Text>
            <Text className="text-xs text-gray-500">Powered by Appbello</Text>
          </View>
          {messages.length > 0 && (
            <Pressable
              onPress={clearChat}
              className="w-9 h-9 rounded-full items-center justify-center"
              style={{ backgroundColor: '#F3F4F6' }}
            >
              <RotateLeft size={16} color={colors.textSecondary}  variant="Outline" />
            </Pressable>
          )}
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          keyboardVerticalOffset={0}
        >
          <ScrollView
            ref={scrollRef}
            className="flex-1 px-4"
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 ? (
              <View className="items-center mt-8">
                <View
                  className="w-16 h-16 rounded-3xl items-center justify-center mb-4"
                  style={{ backgroundColor: colors.primary + '15' }}
                >
                  <MagicStar size={32} color={colors.primary}  variant="Outline" />
                </View>
                <Text className="text-lg font-semibold text-gray-900 mb-2">
                  Como posso ajudar?
                </Text>
                <Text className="text-sm text-gray-500 text-center mb-8 px-6">
                  Sou seu assistente especializado em gestão de salão. Pergunte qualquer coisa!
                </Text>
                <View className="w-full gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <Pressable
                      key={prompt}
                      onPress={() => sendMessage(prompt)}
                      className="bg-white rounded-2xl px-4 py-3 border border-gray-100"
                    >
                      <Text className="text-sm text-gray-700">{prompt}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : (
              <View className="gap-3">
                {messages.map((msg) => (
                  <View
                    key={msg.id}
                    className={`max-w-[85%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}
                  >
                    <View
                      className="rounded-2xl px-4 py-3"
                      style={{
                        backgroundColor:
                          msg.role === 'user' ? colors.primary : '#FFFFFF',
                        borderWidth: msg.role === 'assistant' ? 1 : 0,
                        borderColor: '#E5E7EB',
                      }}
                    >
                      {msg.role === 'assistant' && msg.content === '' && isStreaming ? (
                        <View className="flex-row items-center gap-2 py-1">
                          <ActivityIndicator size="small" color={colors.primary} />
                          <Text className="text-sm text-gray-400">Pensando...</Text>
                        </View>
                      ) : (
                        <Text
                          className="text-sm leading-5"
                          style={{
                            color: msg.role === 'user' ? '#FFFFFF' : colors.textPrimary,
                          }}
                        >
                          {msg.content}
                          {msg.role === 'assistant' && isStreaming && msg.content !== '' && (
                            <Text style={{ color: colors.primary }}>▋</Text>
                          )}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View className="px-4 pb-4 pt-2 bg-white border-t border-gray-100">
            <View className="flex-row items-end gap-2">
              <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 min-h-[44px] max-h-28 justify-center">
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Pergunte algo..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  className="text-sm text-gray-900"
                  style={{ maxHeight: 96 }}
                  onSubmitEditing={() => sendMessage(input)}
                />
              </View>
              <Pressable
                onPress={() => sendMessage(input)}
                disabled={!input.trim() || isStreaming}
                className="w-11 h-11 rounded-2xl items-center justify-center"
                style={{
                  backgroundColor:
                    input.trim() && !isStreaming ? colors.primary : '#E5E7EB',
                }}
              >
                <Send2
                  size={18}
                  color={input.trim() && !isStreaming ? '#FFFFFF' : '#9CA3AF'}
                 variant="Outline" />
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
    </FeatureGate>
  );
}
