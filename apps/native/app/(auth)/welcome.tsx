import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { withUniwind } from "uniwind";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/container";
import { copy } from "@/constants/copy";
import { useThemeColor } from "@/hooks/useThemeColor";
import { colorTokens, radius, typeScale } from "@/constants/tokens";

const StyledView = withUniwind(View);
const StyledText = withUniwind(Text);

/**
 * FigCraft `02.1 — Welcome` (frame 415), 390×844.
 *
 * Single static screen: brand lockup, storefront illustration, headline,
 * sub, one CTA and a sign-in link. The previous 3-slide carousel was the old
 * design and has been removed (no equivalent frame exists in FigCraft `02`).
 *
 * The storefront is brand artwork drawn from primitives using its FigCraft
 * light-mode swatches; like the logo lockup it does NOT invert in dark mode.
 * Page chrome (background, headline, sub, CTA) follows the active theme.
 * DESIGN GAP: FigCraft specifies no dark-mode illustration variant.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const colors = useThemeColor();
  const C = colorTokens;

  return (
    <Container isScrollable withSafeAreaTop className="bg-background px-6">
      {/* Brand lockup — frame x24 y24, 240×62 */}
      <StyledView className="mt-6 h-[62px] w-[240px]">
        <Image
          source={require("@/assets/images/logo-lockup.png")}
          resizeMode="contain"
          style={{ width: "100%", height: "100%" }}
          accessibilityLabel="OjaPaddi"
        />
      </StyledView>

      {/* Storefront illustration — frame y92–364, centred */}
      <StyledView className="mt-7 items-center">
        <StyledView className="h-[272px] w-[342px] items-center justify-center">
          {/* Sun */}
          <StyledView
            className="absolute rounded-pill"
            style={{
              width: 146,
              height: 146,
              top: 0,
              backgroundColor: C.accentSoft.light,
            }}
          />
          {/* Awning + stripes */}
          <StyledView
            className="absolute flex-row overflow-hidden"
            style={{
              width: 316,
              height: 28,
              top: 86,
              borderRadius: radius.button,
              backgroundColor: C.accent.light,
            }}
          >
            {[0, 1, 2, 3, 4, 5].map((s) => (
              <StyledView
                key={s}
                style={{
                  width: 28,
                  height: 20,
                  marginTop: 4,
                  marginLeft: s === 0 ? 11 : 18,
                  borderRadius: 2,
                  backgroundColor: C.background.light,
                }}
              />
            ))}
          </StyledView>
          {/* Storefront */}
          <StyledView
            className="absolute border"
            style={{
              width: 280,
              height: 158,
              top: 114,
              borderRadius: 20,
              backgroundColor: C.card.light,
              borderColor: C.border.light,
            }}
          >
            {/* Sign */}
            <StyledText
              className="absolute self-center font-extrabold tracking-[3px]"
              style={{ top: 26, fontSize: 11, color: C.brandStrong.light }}
            >
              OJAPADDI
            </StyledText>
            {/* Windows */}
            <StyledView
              className="absolute"
              style={{
                width: 64,
                height: 54,
                top: 60,
                left: 20,
                borderRadius: 10,
                backgroundColor: C.brandSoft.light,
              }}
            />
            <StyledView
              className="absolute"
              style={{
                width: 64,
                height: 54,
                top: 60,
                right: 20,
                borderRadius: 10,
                backgroundColor: C.brandSoft.light,
              }}
            />
            {/* Door + knob */}
            <StyledView
              className="absolute self-center"
              style={{
                width: 62,
                height: 106,
                top: 52,
                borderTopLeftRadius: 12,
                borderTopRightRadius: 12,
                backgroundColor: C.brandStrong.light,
              }}
            >
              <StyledView
                className="absolute rounded-pill"
                style={{ width: 8, height: 8, top: 54, right: 8, backgroundColor: C.accent.light }}
              />
            </StyledView>
          </StyledView>
          {/* Cash bubble (left) */}
          <StyledView
            className="absolute items-center justify-center self-start rounded-pill"
            style={{
              width: 92,
              height: 48,
              top: 26,
              backgroundColor: C.accent.light,
            }}
          >
            <StyledText className="font-extrabold" style={{ fontSize: 15, color: C.ink.light }}>
              ₦34,000
            </StyledText>
          </StyledView>
          {/* Stock bubble (right) */}
          <StyledView
            className="absolute items-center justify-center self-end rounded-pill"
            style={{
              width: 116,
              height: 48,
              top: 8,
              backgroundColor: C.brand.light,
            }}
          >
            <StyledText className="font-bold" style={{ fontSize: 15, color: C.card.light }}>
              +3 bags
            </StyledText>
          </StyledView>
        </StyledView>
      </StyledView>

      <StyledView className="flex-1 justify-end pb-2">
        {/* Headline */}
        <StyledText
          className="font-display"
          style={{
            fontSize: typeScale.hero.fontSize,
            lineHeight: typeScale.hero.lineHeight,
            letterSpacing: -0.33,
            color: colors.brandStrong,
          }}
        >
          Know stock.{"\n"}Know profit.{"\n"}No guesswork.
        </StyledText>

        {/* Sub */}
        <StyledText
          className="mt-6 font-body"
          style={{ fontSize: 15, lineHeight: 21, color: colors.muted }}
        >
          A pocket ledger for Nigerian sellers — stock, sales, credit and WhatsApp receipts.
        </StyledText>

        {/* CTA */}
        <Button
          variant="primary"
          size="lg"
          className="mt-7"
          onPress={() => router.push("/register")}
        >
          Start free — no card
        </Button>

        {/* Sign in link */}
        <TouchableOpacity
          className="mt-4 min-h-12 items-center justify-center"
          onPress={() => router.push("/login")}
          accessibilityRole="button"
        >
          <StyledText className="font-bold" style={{ fontSize: 13, color: colors.brand }}>
            {copy.welcome.signIn}
          </StyledText>
        </TouchableOpacity>
      </StyledView>
    </Container>
  );
}
