import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>PSB Digital App</Text>
      <Text style={styles.subtitle}>v0.0.1</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a3d3a',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD500',
  },
  subtitle: {
    fontSize: 14,
    color: '#999999',
    marginTop: 10,
  },
});
