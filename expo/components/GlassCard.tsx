import React from 'react';
import { Platform, View, ViewStyle, StyleProp } from 'react-native';
import { GlassView } from 'expo-glass-effect';

type GlassCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  fallbackStyle?: StyleProp<ViewStyle>;
  glassEffectStyle?: 'regular' | 'clear';
  tintColor?: string;
};

export default function GlassCard({
  children,
  style,
  fallbackStyle,
  glassEffectStyle = 'regular',
  tintColor,
}: GlassCardProps) {
  if (Platform.OS === 'ios') {
    return (
      <GlassView
        style={style}
        glassEffectStyle={glassEffectStyle}
        tintColor={tintColor}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View style={[style, fallbackStyle]}>
      {children}
    </View>
  );
}
