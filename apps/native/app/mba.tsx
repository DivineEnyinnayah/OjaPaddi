import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Share,
  Alert,
  useWindowDimensions,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { withUniwind } from "uniwind";
import { useMba, type MBARule } from "@/hooks/useMba";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Container } from "@/components/container";
import { Surface } from "@/components/ui/surface";

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);
const StyledTouchableOpacity = withUniwind(TouchableOpacity);
const StyledMaterialIcons = withUniwind(MaterialIcons);

type Tab = "recommendations" | "rules";

export default function MBAScreen() {
  const { rules, isLoading, error, fetchRules } = useMba();
  const colors = useThemeColor();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState<Tab>("recommendations");
  const [minSupport, setMinSupport] = useState<number>(0.1);
  const [minConfidence, setMinConfidence] = useState<number>(0.5);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadData = useCallback(() => {
    // Round to 2 decimal places to prevent float precision issues
    const support = Math.round(minSupport * 100) / 100;
    const confidence = Math.round(minConfidence * 100) / 100;
    
    fadeAnim.setValue(0);
    fetchRules(support, confidence);
  }, [minSupport, minConfidence, fetchRules, fadeAnim]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!isLoading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [isLoading]);

  const adjustSupport = (amount: number) => {
    setMinSupport(prev => {
      const next = prev + amount;
      return Math.min(Math.max(next, 0.01), 1);
    });
  };

  const adjustConfidence = (amount: number) => {
    setMinConfidence(prev => {
      const next = prev + amount;
      return Math.min(Math.max(next, 0.05), 1);
    });
  };

  const handleExportCSV = async () => {
    if (isLoading) {
      Alert.alert("Loading", "Please wait while the analysis is completing.");
      return;
    }
    if (rules.length === 0) {
      Alert.alert("No rules to export", "Try lowering the support or confidence thresholds to find more rules.");
      return;
    }

    try {
      let csv = "Antecedent,Consequent,Support,Confidence,Lift\n";
      for (const r of rules) {
        const antecedent = r.antecedentNames.join(" & ").replace(/"/g, '""');
        const consequent = r.consequentNames.join(" & ").replace(/"/g, '""');
        csv += `"${antecedent}","${consequent}",${(r.support * 100).toFixed(1)}%,${(r.confidence * 100).toFixed(1)}%,${r.lift.toFixed(2)}\n`;
      }

      await Share.share({
        message: csv,
        title: "Market Basket Analysis Rules",
      });
    } catch (err: unknown) {
      Alert.alert("Export Failed", err instanceof Error ? err.message : String(err));
    }
  };

  const getLiftText = (lift: number) => {
    if (lift > 2) return "Highly Likely";
    if (lift > 1.2) return "Very Likely";
    return "Likely";
  };

  return (
    <Container isScrollable={false} withTabBar={false} withSafeAreaTop className="bg-background flex-1">
      {/* Header */}
      <StyledView className="bg-surface-container-lowest h-14 px-margin flex-row justify-between items-center z-50 border-b border-outline-variant/30">
        <StyledView className="flex-row items-center gap-2 flex-1 mr-2">
          <StyledTouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center"
          >
            <StyledMaterialIcons name="arrow-back" size={24} className="text-on-surface" />
          </StyledTouchableOpacity>
          <StyledText 
            className="text-h3 font-bold text-on-surface flex-1" 
            numberOfLines={1} 
            ellipsizeMode="tail"
          >
            Smart Recommendations
          </StyledText>
        </StyledView>

        <StyledTouchableOpacity
          onPress={handleExportCSV}
          className="flex-row items-center gap-1.5 px-3 py-1.5 bg-primary/10 rounded-full"
        >
          <StyledMaterialIcons name="ios-share" size={16} className="text-primary" />
          <StyledText className="text-primary font-semibold text-xs">Export CSV</StyledText>
        </StyledTouchableOpacity>
      </StyledView>

      {/* Threshold Selectors */}
      <StyledView className="p-margin bg-surface-container-lowest border-b border-outline-variant/30">
        <StyledText className="text-xs font-bold text-on-surface-variant mb-3 uppercase tracking-wider">
          Analysis Configuration
        </StyledText>
        
        <StyledView className={screenWidth < 360 ? "flex-col gap-3" : "flex-row gap-4"}>
          {/* Support Threshold control */}
          <StyledView className="flex-1 bg-surface-container-low rounded-xl p-3 border border-outline-variant/20">
            <StyledText className="text-xs text-on-surface-variant mb-1.5 font-medium">Min Support</StyledText>
            <StyledView className="flex-row items-center justify-between">
              <StyledTouchableOpacity
                onPress={() => adjustSupport(-0.05)}
                className="w-8 h-8 rounded-full bg-surface-container-lowest items-center justify-center border border-outline-variant/30"
              >
                <StyledMaterialIcons name="remove" size={16} className="text-on-surface" />
              </StyledTouchableOpacity>
              <StyledText className="font-bold text-on-surface text-lg">
                {(minSupport * 100).toFixed(0)}%
              </StyledText>
              <StyledTouchableOpacity
                onPress={() => adjustSupport(0.05)}
                className="w-8 h-8 rounded-full bg-surface-container-lowest items-center justify-center border border-outline-variant/30"
              >
                <StyledMaterialIcons name="add" size={16} className="text-on-surface" />
              </StyledTouchableOpacity>
            </StyledView>
          </StyledView>

          {/* Confidence Threshold control */}
          <StyledView className="flex-1 bg-surface-container-low rounded-xl p-3 border border-outline-variant/20">
            <StyledText className="text-xs text-on-surface-variant mb-1.5 font-medium">Min Confidence</StyledText>
            <StyledView className="flex-row items-center justify-between">
              <StyledTouchableOpacity
                onPress={() => adjustConfidence(-0.05)}
                className="w-8 h-8 rounded-full bg-surface-container-lowest items-center justify-center border border-outline-variant/30"
              >
                <StyledMaterialIcons name="remove" size={16} className="text-on-surface" />
              </StyledTouchableOpacity>
              <StyledText className="font-bold text-on-surface text-lg">
                {(minConfidence * 100).toFixed(0)}%
              </StyledText>
              <StyledTouchableOpacity
                onPress={() => adjustConfidence(0.05)}
                className="w-8 h-8 rounded-full bg-surface-container-lowest items-center justify-center border border-outline-variant/30"
              >
                <StyledMaterialIcons name="add" size={16} className="text-on-surface" />
              </StyledTouchableOpacity>
            </StyledView>
          </StyledView>
        </StyledView>
      </StyledView>

      {/* Segmented Tab Selector */}
      <StyledView className="flex-row bg-surface-container-lowest px-margin py-2.5 border-b border-outline-variant/20 z-40">
        <StyledTouchableOpacity
          onPress={() => setActiveTab("recommendations")}
          className={`flex-1 py-2 items-center rounded-lg ${
            activeTab === "recommendations" ? "bg-primary" : "bg-transparent"
          }`}
        >
          <StyledText
            className={`font-semibold text-sm ${
              activeTab === "recommendations" ? "text-on-primary" : "text-on-surface-variant"
            }`}
          >
            Recommendations
          </StyledText>
        </StyledTouchableOpacity>

        <StyledTouchableOpacity
          onPress={() => setActiveTab("rules")}
          className={`flex-1 py-2 items-center rounded-lg ${
            activeTab === "rules" ? "bg-primary" : "bg-transparent"
          }`}
        >
          <StyledText
            className={`font-semibold text-sm ${
              activeTab === "rules" ? "text-on-primary" : "text-on-surface-variant"
            }`}
          >
            Association Rules
          </StyledText>
        </StyledTouchableOpacity>
      </StyledView>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={loadData} colors={[colors.primary]} />
        }
      >
        {isLoading && rules.length === 0 ? (
          <StyledView className="mt-20 items-center justify-center gap-4">
            <Animated.View style={{ opacity: fadeAnim }}>
              <StyledView className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
                <StyledMaterialIcons name="auto-awesome" size={32} className="text-primary" />
              </StyledView>
            </Animated.View>
            <ActivityIndicator size="large" color={colors.primary} />
            <StyledText className="text-on-surface-variant text-body-sm font-medium text-center px-10">
              Analyzing purchase patterns...
            </StyledText>
          </StyledView>
        ) : error ? (
          <StyledView className="items-center p-6 bg-surface-container-low rounded-xl border border-outline-variant mt-10">
            <StyledMaterialIcons name="error-outline" size={40} className="text-error" />
            <StyledText className="text-error text-center mt-3 mb-4 text-body-lg font-semibold">
              {error}
            </StyledText>
            <StyledTouchableOpacity className="px-6 py-3 bg-primary rounded-xl" onPress={loadData}>
              <StyledText className="text-on-primary font-semibold">Retry</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        ) : rules.length === 0 ? (
          <StyledView className="p-8 items-center bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant mt-6">
            <StyledMaterialIcons name="auto-awesome" size={48} className="text-on-surface-variant opacity-40" />
            <StyledText className="text-on-surface text-body-lg font-bold mt-4 mb-2 text-center">
              No product patterns found
            </StyledText>
            <StyledText className="text-on-surface-variant text-body-sm text-center mb-6 leading-5">
              We couldn't find any associations above the current settings. Try lowering support or confidence to discover weaker correlations.
            </StyledText>
            <StyledTouchableOpacity
              onPress={() => {
                setMinSupport(0.05);
                setMinConfidence(0.2);
              }}
              className="bg-primary/10 rounded-xl px-5 py-2.5"
            >
              <StyledText className="text-primary font-semibold text-sm">Use Lower Settings</StyledText>
            </StyledTouchableOpacity>
          </StyledView>
        ) : activeTab === "recommendations" ? (
          /* Simplified Recommendations Card List */
          <StyledView className="gap-3">
            <StyledText className="text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
              Plain Business Insights ({rules.length})
            </StyledText>
            {rules.map((rule, idx) => (
              <Surface key={idx} variant="primary" className="rounded-2xl p-4 border border-outline-variant/10 flex-row gap-3">
                <StyledView className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                  <StyledMaterialIcons name="auto-awesome" size={20} className="text-primary" />
                </StyledView>
                <StyledView className="flex-1">
                  <StyledText className="text-body-lg font-black text-on-surface mb-2 leading-6">
                    Customers who buy <StyledText className="text-primary">{rule.antecedentNames.join(" & ")}</StyledText> often also buy <StyledText className="text-secondary">{rule.consequentNames.join(" & ")}</StyledText>.
                  </StyledText>
                  
                  <StyledView className="flex-row items-center gap-4 mt-2 pt-2.5 border-t border-outline-variant/10">
                    <StyledView>
                      <StyledText className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Likelihood</StyledText>
                      <StyledText className="text-body-sm font-semibold text-primary mt-0.5">
                        {(rule.confidence * 100).toFixed(0)}% Certainty
                      </StyledText>
                    </StyledView>
                    
                    <StyledView>
                      <StyledText className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Strength</StyledText>
                      <StyledText className="text-body-sm font-semibold text-on-surface mt-0.5">
                        {getLiftText(rule.lift)} ({rule.lift.toFixed(1)}x)
                      </StyledText>
                    </StyledView>
                  </StyledView>
                </StyledView>
              </Surface>
            ))}
          </StyledView>
        ) : (
          /* Technical Association Rules Detail Table */
          <StyledView className="gap-3">
            <StyledText className="text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">
              Technical Rule Rankings ({rules.length})
            </StyledText>
            {rules.map((rule, idx) => (
              <Surface key={idx} variant="primary" className="rounded-xl p-4 border border-outline-variant/20">
                <StyledView className="flex-row justify-between items-start mb-3">
                  <StyledView className="bg-surface-container-low px-2 py-1 rounded-md">
                    <StyledText className="text-[10px] font-bold text-primary">RULE #{idx + 1}</StyledText>
                  </StyledView>
                  <StyledView className="flex-row items-center gap-1">
                    <StyledMaterialIcons name="trending-up" size={14} className="text-secondary" />
                    <StyledText className="text-xs font-semibold text-on-surface-variant">
                      Lift: <StyledText className="text-on-surface font-bold">{rule.lift.toFixed(2)}</StyledText>
                    </StyledText>
                  </StyledView>
                </StyledView>

                {/* Antecedent -> Consequent representation */}
                <StyledView className="bg-surface-container-low rounded-lg p-3 mb-3">
                  <StyledView className={screenWidth < 380 ? "flex-col items-center gap-2" : "flex-row items-center gap-2"}>
                    <StyledView className={screenWidth < 380 ? "items-center w-full" : "flex-1"}>
                      <StyledText className="text-[10px] text-on-surface-variant font-bold uppercase mb-0.5">If they buy</StyledText>
                      <StyledText className={`text-body-sm font-bold text-on-surface ${screenWidth < 380 ? "text-center" : ""}`}>{rule.antecedentNames.join(" + ")}</StyledText>
                    </StyledView>
                    
                    <StyledMaterialIcons 
                      name={screenWidth < 380 ? "arrow-downward" : "arrow-forward"} 
                      size={18} 
                      className="text-primary" 
                    />
                    
                    <StyledView className={screenWidth < 380 ? "items-center w-full" : "flex-1"}>
                      <StyledText className="text-[10px] text-on-surface-variant font-bold uppercase mb-0.5">They also buy</StyledText>
                      <StyledText className={`text-body-sm font-bold text-on-surface ${screenWidth < 380 ? "text-center" : ""}`}>{rule.consequentNames.join(" + ")}</StyledText>
                    </StyledView>
                  </StyledView>
                </StyledView>

                {/* Detailed metrics */}
                <StyledView className="flex-row justify-between pt-2 border-t border-outline-variant/10">
                  <StyledView className="items-center">
                    <StyledText className="text-[10px] text-on-surface-variant font-semibold">Support</StyledText>
                    <StyledText className="text-body-sm font-bold text-on-surface">{(rule.support * 100).toFixed(1)}%</StyledText>
                  </StyledView>

                  <StyledView className="items-center">
                    <StyledText className="text-[10px] text-on-surface-variant font-semibold">Confidence</StyledText>
                    <StyledText className="text-body-sm font-bold text-on-surface">{(rule.confidence * 100).toFixed(1)}%</StyledText>
                  </StyledView>

                  <StyledView className="items-center">
                    <StyledText className="text-[10px] text-on-surface-variant font-semibold">Correlation</StyledText>
                    <StyledText className={`text-body-sm font-bold ${rule.lift > 1 ? "text-success" : "text-error"}`}>
                      {rule.lift > 1 ? "Positive" : "Negative"}
                    </StyledText>
                  </StyledView>
                </StyledView>
              </Surface>
            ))}
          </StyledView>
        )}
      </ScrollView>
    </Container>
  );
}
