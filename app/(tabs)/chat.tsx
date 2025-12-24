import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, Sparkles, Trash2 } from 'lucide-react-native';
import { getColors } from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { useRorkAgent, createRorkTool, generateText } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';

type ChatRole = 'user' | 'assistant';

type ChatTextPart = {
  type: 'text';
  text: string;
};

type ChatMessage = {
  id: string;
  role: ChatRole;
  parts: ChatTextPart[];
};

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function toPlainTextFromMessageParts(parts: any[]): string {
  try {
    return (parts || [])
      .map((p) => {
        if (!p || typeof p !== 'object') return '';
        if (p.type === 'text') return String(p.text ?? '');
        return '';
      })
      .join('\n')
      .trim();
  } catch {
    return '';
  }
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { activeChild, activeChildLogs = [], chatHistory = [], saveChatHistory, clearChatHistory, preferences } = useApp();
  const Colors = useMemo(() => getColors(preferences), [preferences]);
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const [input, setInput] = useState<string>('');
  const [isFallbackMode, setIsFallbackMode] = useState<boolean>(false);
  const [fallbackSending, setFallbackSending] = useState<boolean>(false);
  const [fallbackError, setFallbackError] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const tools = useMemo(() => ({
    getChildProfile: createRorkTool({
      description: 'Get child profile info including diagnosis, triggers, age, school',
      zodSchema: z.object({}),
      execute: () => {
        try {
          if (!activeChild) return JSON.stringify({ error: 'No profile' });
          return JSON.stringify({
            name: activeChild.name || 'Unknown',
            age: activeChild.age || 0,
            diagnosis: activeChild.diagnosis || 'Not specified',
            school: activeChild.schoolName || 'Not specified',
            grade: activeChild.gradeLevel || 'Not specified',
            triggers: activeChild.commonTriggers || [],
          });
        } catch (error) {
          console.error('getChildProfile error:', error);
          return JSON.stringify({ error: 'Failed to get profile' });
        }
      },
    }),
    getLogsSummary: createRorkTool({
      description: 'Get a comprehensive summary of log entries for the child. Use this to analyze patterns, moods, and trends.',
      zodSchema: z.object({
        days: z.number().describe('Number of recent days to summarize').optional(),
      }),
      execute: (input) => {
        try {
          const days = input.days || 30;
          const recentLogs = (activeChildLogs || []).slice(-days);
          
          const moodCounts = recentLogs.reduce((acc, log) => {
            if (log?.moodRating) {
              acc[log.moodRating] = (acc[log.moodRating] || 0) + 1;
            }
            return acc;
          }, {} as Record<string, number>);
          
          const tagCounts = recentLogs.reduce((acc, log) => {
            (log?.moodTags || []).forEach((tag: string) => {
              if (tag) {
                acc[tag] = (acc[tag] || 0) + 1;
              }
            });
            return acc;
          }, {} as Record<string, number>);
          
          return JSON.stringify({
            period: `Last ${days} days`,
            totalLogs: recentLogs.length,
            moodDistribution: moodCounts,
            commonTags: tagCounts,
            recentEntries: recentLogs.slice(-7).map(l => ({
              date: l?.date || 'Unknown',
              mood: l?.moodRating || 'Unknown',
              tags: l?.moodTags || [],
              positiveNotes: l?.positiveNotes || '',
              challengeNotes: l?.challengeNotes || '',
            })),
          });
        } catch (error) {
          console.error('getLogsSummary error:', error);
          return JSON.stringify({ error: 'Failed to get logs summary' });
        }
      },
    }),
    getDetailedLog: createRorkTool({
      description: 'Get detailed information about a specific log entry by date',
      zodSchema: z.object({
        date: z.string().describe('Date of the log entry in ISO format (YYYY-MM-DD)'),
      }),
      execute: (input) => {
        try {
          const log = (activeChildLogs || []).find(l => l?.date === input.date);
          if (!log) {
            return JSON.stringify({ error: 'No log found for this date' });
          }
          return JSON.stringify({
            date: log.date || 'Unknown',
            mood: log.moodRating || 'Unknown',
            tags: log.moodTags || [],
            positiveNotes: log.positiveNotes || '',
            challengeNotes: log.challengeNotes || '',
            sleepHours: log.sleepHours || 0,
            behaviors: log.behaviors || '',
            triggers: log.triggers || '',
          });
        } catch (error) {
          console.error('getDetailedLog error:', error);
          return JSON.stringify({ error: 'Failed to get log details' });
        }
      },
    }),
    findPatterns: createRorkTool({
      description: 'Analyze logs to identify patterns in moods, triggers, and behaviors',
      zodSchema: z.object({
        category: z.enum(['moods', 'tags', 'triggers', 'behaviors']).describe('Category to analyze for patterns'),
      }),
      execute: (input) => {
        try {
          const logs = (activeChildLogs || []).slice(-30);
          
          if (input.category === 'tags') {
            const tagsByMood: Record<string, string[]> = {};
            logs.forEach(log => {
              if (log?.moodRating) {
                if (!tagsByMood[log.moodRating]) {
                  tagsByMood[log.moodRating] = [];
                }
                tagsByMood[log.moodRating].push(...(log.moodTags || []));
              }
            });
            
            const tagFrequency: Record<string, Record<string, number>> = {};
            Object.entries(tagsByMood).forEach(([mood, tags]) => {
              tagFrequency[mood] = tags.reduce((acc, tag) => {
                if (tag) {
                  acc[tag] = (acc[tag] || 0) + 1;
                }
                return acc;
              }, {} as Record<string, number>);
            });
            
            return JSON.stringify({
              category: 'Mood Tags Patterns',
              analysis: tagFrequency,
              insight: 'Shows which emotional tags are associated with different mood ratings',
            });
          }
          
          if (input.category === 'moods') {
            const moodTrend = logs.map(l => ({
              date: l?.date || 'Unknown',
              mood: l?.moodRating || 'Unknown',
            }));
            
            return JSON.stringify({
              category: 'Mood Trends',
              trend: moodTrend,
              insight: 'Chronological progression of mood ratings',
            });
          }
          
          return JSON.stringify({ message: 'Analysis in progress' });
        } catch (error) {
          console.error('findPatterns error:', error);
          return JSON.stringify({ error: 'Failed to analyze patterns' });
        }
      },
    }),
  }), [activeChild, activeChildLogs]);

  const { messages, error, sendMessage, setMessages } = useRorkAgent({ tools });

  const appendLocalTextMessage = useCallback((role: ChatRole, text: string) => {
    const msg: ChatMessage = {
      id: makeId(role),
      role,
      parts: [{ type: 'text', text }],
    };
    setMessages((prev: any[]) => {
      const next = [...(prev || []), msg];
      return next;
    });
  }, [setMessages]);

  const fallbackSend = useCallback(async (text: string) => {
    const toolkitUrl = process.env.EXPO_PUBLIC_TOOLKIT_URL;

    if (!toolkitUrl) {
      throw new Error('AI service is not configured');
    }

    setFallbackError(null);
    setFallbackSending(true);

    try {
      const childContext = activeChild
        ? {
            name: activeChild.name || 'Unknown',
            age: activeChild.age || 0,
            diagnosis: activeChild.diagnosis || 'Not specified',
            school: activeChild.schoolName || 'Not specified',
            grade: activeChild.gradeLevel || 'Not specified',
            triggers: activeChild.commonTriggers || [],
          }
        : null;

      const recentLogs = (activeChildLogs || []).slice(-14);
      const compactLogSummary = recentLogs.map((l) => ({
        date: l?.date ?? 'Unknown',
        mood: l?.moodRating ?? 'Unknown',
        tags: l?.moodTags ?? [],
        positiveNotes: (l?.positiveNotes ?? '').slice(0, 240),
        challengeNotes: (l?.challengeNotes ?? '').slice(0, 240),
      }));

      const history = (messages || []).slice(-10).map((m: any) => {
        const role = m?.role === 'user' ? 'user' : 'assistant';
        const content = toPlainTextFromMessageParts(m?.parts);
        return { role, content } as { role: 'user' | 'assistant'; content: string };
      }).filter((m) => m.content.length > 0);

      const contextBlock = `Context (use when relevant):\n${JSON.stringify({ child: childContext, recentLogs: compactLogSummary }, null, 2)}`;

      console.log('=== Fallback Chat Debug ===');
      console.log('toolkitUrl set:', !!toolkitUrl);
      console.log('history messages:', history.length);
      console.log('recentLogs:', recentLogs.length);
      console.log('user input length:', text.length);
      console.log('context length:', contextBlock.length);
      console.log('===========================');

      const assistantText = await generateText({
        messages: [
          ...history,
          { role: 'user', content: `${contextBlock}\n\nUser: ${text}` },
        ],
      });

      return assistantText;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      console.error('fallbackSend error:', e);
      setFallbackError(msg);
      throw e;
    } finally {
      setFallbackSending(false);
    }
  }, [activeChild, activeChildLogs, messages]);

  useEffect(() => {
    if (chatHistory && chatHistory.length > 0 && messages.length === 0) {
      setMessages(chatHistory);
    }
  }, [chatHistory, messages.length, setMessages]);

  useEffect(() => {
    if (messages.length > 0) {
      saveChatHistory(messages);
    }
  }, [messages, saveChatHistory]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  useEffect(() => {
    if (error) {
      console.error('=== Chat Error ===');
      console.error('Error type:', typeof error);
      console.error('Error:', error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown');
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      if (typeof error === 'object' && error !== null) {
        console.error('Error keys:', Object.keys(error));
        console.error('Error JSON:', JSON.stringify(error, null, 2));
      }
      console.error('==================');
    }
  }, [error]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    console.log('=== Chat Send Debug ===');
    console.log('isFallbackMode:', isFallbackMode);
    console.log('Input length:', text.length);
    console.log('Active Child:', activeChild?.id);
    console.log('Message count:', messages.length);
    console.log('Tools count:', Object.keys(tools).length);
    console.log('======================');

    setInput('');

    if (isFallbackMode) {
      appendLocalTextMessage('user', text);
      try {
        const assistant = await fallbackSend(text);
        appendLocalTextMessage('assistant', assistant);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unable to connect to AI service';
        Alert.alert('Connection Error', `${errorMessage}. Please try again.`, [{ text: 'OK' }]);
      }
      return;
    }

    try {
      await sendMessage(text);
    } catch (err) {
      console.error('=== Send Error ===');
      console.error('Error:', err);
      console.error('==================');

      const errorMessage = err instanceof Error
        ? err.message
        : typeof err === 'string'
          ? err
          : 'Unable to connect to AI service';

      const isConnectionError = 
        /internal server error/i.test(errorMessage) || 
        /500/.test(errorMessage) ||
        /fetch failed/i.test(errorMessage) ||
        /could not connect/i.test(errorMessage) ||
        /network/i.test(errorMessage) ||
        /timeout/i.test(errorMessage) ||
        /ECONNREFUSED/i.test(errorMessage) ||
        /unable to connect/i.test(errorMessage);

      if (isConnectionError) {
        console.warn('Switching chat to fallback (non-streaming) mode due to connection error');
        setIsFallbackMode(true);
        appendLocalTextMessage('user', text);
        try {
          const assistant = await fallbackSend(text);
          appendLocalTextMessage('assistant', assistant);
          return;
        } catch {
          // fall through to alert below
        }
      }

      Alert.alert(
        'Connection Error', 
        'Unable to connect to AI service. Please check your internet connection and try again.', 
        [
          { text: 'OK' },
          { 
            text: 'Try Basic Mode', 
            onPress: () => {
              setIsFallbackMode(true);
              appendLocalTextMessage('user', text);
              fallbackSend(text).then(assistant => {
                appendLocalTextMessage('assistant', assistant);
              }).catch(() => {});
            }
          }
        ]
      );
    }
  }, [activeChild?.id, appendLocalTextMessage, fallbackSend, input, isFallbackMode, messages.length, sendMessage, tools]);

  const handleClearHistory = useCallback(() => {
    Alert.alert(
      'Clear Chat History',
      'This will delete all previous conversations. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            clearChatHistory();
            setMessages([]);
          },
        },
      ]
    );
  }, [clearChatHistory, setMessages]);

  const suggestedQuestions = activeChild?.diagnosis
    ? [
      `Patterns in ${activeChild.name}'s logs?`,
      `Tips for ${activeChild.name}'s triggers?`,
      `How is ${activeChild.name} progressing?`,
      `Strategies for ${activeChild.diagnosis}?`,
    ]
    : [
      "What patterns do you see?",
      "How can I support better?",
      "What insights can you provide?",
      "Tips for logging effectively?",
    ];

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 16, backgroundColor: Colors.background, borderBottomColor: Colors.border }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Sparkles size={32} color={Colors.secondary} />
            <View>
              <Text style={styles.title}>Autumn</Text>
              <Text style={styles.subtitle}>AI Assistant{isFallbackMode ? ' (basic mode)' : ' with Memory'}</Text>
            </View>
          </View>
          {messages.length > 0 && (
            <TouchableOpacity
              onPress={handleClearHistory}
              style={styles.clearButton}
              activeOpacity={0.7}
            >
              <Trash2 size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View style={styles.welcome}>
              <Text style={styles.welcomeText}>
                Hi! I&apos;m Autumn, your AI assistant{activeChild?.name ? ` with full knowledge of ${activeChild.name}'s profile and history` : ''}. {activeChild?.name && activeChild?.age ? `I understand ${activeChild.name} is ${activeChild.age} years old` : ''}{activeChild?.diagnosis ? ` with ${activeChild.diagnosis}` : ''}{activeChild ? ', and I' : 'I'}&apos;m here to provide personalized support.
              </Text>
              <Text style={styles.welcomeSubtext}>
                I have access to {activeChildLogs?.length || 0} log entries{activeChild?.name ? ` and know about ${activeChild.name}'s triggers, patterns, and progress` : ''}. Ask me anything!
              </Text>
              <Text style={styles.suggestionsTitle}>Try asking:</Text>
              {suggestedQuestions.map((q, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionButton}
                  onPress={() => setInput(q)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {messages.map((message) => (
            <View key={message.id} style={styles.messageGroup}>
              {message.parts.map((part, partIndex) => {
                if (part.type === 'text') {
                  return (
                    <View
                      key={`${message.id}-${partIndex}`}
                      style={[
                        styles.messageBubble,
                        message.role === 'user' ? styles.userBubble : styles.assistantBubble,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          message.role === 'user' ? styles.userText : styles.assistantText,
                        ]}
                      >
                        {part.text}
                      </Text>
                    </View>
                  );
                } else if (part.type === 'tool') {
                  if (part.state === 'input-streaming' || part.state === 'input-available') {
                    return (
                      <View key={`${message.id}-${partIndex}`} style={styles.toolBubble}>
                        <ActivityIndicator size="small" color={Colors.secondary} />
                        <Text style={styles.toolText}>Analyzing your data...</Text>
                      </View>
                    );
                  } else if (part.state === 'output-error') {
                    return (
                      <View key={`${message.id}-${partIndex}`} style={styles.errorBubble}>
                        <Text style={styles.errorText}>Error: {part.errorText}</Text>
                      </View>
                    );
                  }
                }
                return null;
              })}
            </View>
          ))}

          {(error || fallbackError) && (
            <View style={styles.errorBubble}>
              <Text style={styles.errorText}>Something went wrong. Please try again.</Text>
              <Text style={[styles.errorText, { fontSize: 12, marginTop: 8, opacity: 0.8 }]}>
                {fallbackError
                  ? fallbackError
                  : typeof error === 'object' && error !== null && 'message' in error
                    ? String((error as any).message)
                    : typeof error === 'string'
                      ? error
                      : 'Unknown error occurred'}
              </Text>
              {isFallbackMode && (
                <TouchableOpacity
                  testID="chatExitBasicMode"
                  style={[styles.suggestionButton, { marginTop: 12 }]}
                  onPress={() => {
                    setIsFallbackMode(false);
                    setFallbackError(null);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.suggestionText}>Try full AI mode again</Text>
                </TouchableOpacity>
              )}
              {__DEV__ && error && (
                <Text style={[styles.errorText, { fontSize: 11, marginTop: 8, fontFamily: 'monospace' }]}>Debug: {JSON.stringify(error, null, 2)}</Text>
              )}
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 16, backgroundColor: Colors.background, borderTopColor: Colors.border }]}>
          <TextInput
            testID="chatInput"
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={isFallbackMode ? "Ask (basic mode)…" : "Ask me anything..."}
            placeholderTextColor={Colors.textLight}
            multiline
            maxLength={500}
            editable={!fallbackSending}
          />
          <TouchableOpacity
            testID="chatSendButton"
            style={[styles.sendButton, (!input.trim() || fallbackSending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || fallbackSending}
            activeOpacity={0.7}
          >
            {fallbackSending ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Send size={20} color={Colors.background} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (Colors: ReturnType<typeof getColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearButton: {
    padding: 8,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  welcome: {
    gap: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    textAlign: 'center',
  },
  welcomeSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic' as const,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  suggestionButton: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionText: {
    fontSize: 14,
    color: Colors.primary,
  },
  messageGroup: {
    marginBottom: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surface,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: Colors.background,
  },
  assistantText: {
    color: Colors.text,
  },
  toolBubble: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  toolText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  errorBubble: {
    backgroundColor: Colors.error + '20',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
