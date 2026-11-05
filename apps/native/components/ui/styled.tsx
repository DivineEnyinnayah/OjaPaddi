import {
  Text,
  View,
  TouchableOpacity,
  Pressable,
  TextInput,
  ScrollView,
  Image,
  KeyboardAvoidingView,
} from "react-native";
import { withUniwind } from "uniwind";

/**
 * Primitive layer: uniwind-wrapped React Native hosts.
 *
 * These are bindings, not design-system components — they carry no token
 * values themselves. Composed components (Button, Input, Chip, …) build on
 * top of them and own every visual value.
 */
export const StyledText = withUniwind(Text);
export const StyledView = withUniwind(View);
export const StyledTouchableOpacity = withUniwind(TouchableOpacity);
export const StyledPressable = withUniwind(Pressable);
export const StyledTextInput = withUniwind(TextInput);
export const StyledScrollView = withUniwind(ScrollView);
export const StyledImage = withUniwind(Image);
export const StyledKeyboardAvoidingView = withUniwind(KeyboardAvoidingView);
