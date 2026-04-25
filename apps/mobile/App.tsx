import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createSessionFlowState,
  dismissRetroactiveSessionStub,
  ensureAnonymousIdentity,
  getExpoPublicSupabaseEnv,
  openRetroactiveSessionStub,
  startLiveSession,
  type SessionFlowState,
} from "@impoopingrightnow/shared";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type ScreenKey = "home" | "stats" | "global" | "settings";

type ScreenConfig = {
  tabLabel: string;
  sectionLabel: string;
  title: string;
  body: string;
  statuses: Array<{
    label: string;
    value: string;
  }>;
  noteTitle: string;
  noteBody: string;
};

type IdentityBannerState = {
  title: string;
  body: string;
};

const screenOrder: ScreenKey[] = ["home", "stats", "global", "settings"];

function createIdentityBannerState(
  username: string | null,
  isSupabaseConfigured: boolean,
): IdentityBannerState {
  if (!username) {
    return {
      title: "Provisioning anonymous record",
      body: "Creating the local UUID and generated username that the session flow will use later.",
    };
  }

  if (isSupabaseConfigured) {
    return {
      title: `Anonymous record: ${username}`,
      body: "Saved on-device. Supabase public env is configured, so the next session-start step can upsert this user.",
    };
  }

  return {
    title: `Anonymous record: ${username}`,
    body: "Saved on-device. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable session-start upserts.",
  };
}

const screenContent: Record<ScreenKey, ScreenConfig> = {
  home: {
    tabLabel: "Home",
    sectionLabel: "Home / Session shell",
    title: "The live session entrypoint is reserved here.",
    body: "This is the mobile-first shell for the landing and active session flow. The timer, hold button, and flush action will replace these placeholders in later steps.",
    statuses: [
      { label: "Primary CTA", value: "I’m Pooping Right Now" },
      { label: "Secondary CTA", value: "I Pooped · coming soon" },
      { label: "Counter slot", value: "Pinned at top" },
    ],
    noteTitle: "Immediate follow-up",
    noteBody:
      "The next slice here is the landing flow and session surface, not persistence or analytics.",
  },
  stats: {
    tabLabel: "Stats",
    sectionLabel: "My Stats shell",
    title: "Retention surfaces exist before the data arrives.",
    body: "Heatmaps, streaks, personal records, and weekly summaries will live here once session data exists. For now, the shell only protects the navigation and layout.",
    statuses: [
      { label: "Heatmap", value: "Reserved" },
      { label: "Streaks", value: "Current and best" },
      { label: "Records", value: "Fastest, longest, most logs" },
    ],
    noteTitle: "Rule for this screen",
    noteBody:
      "If the user has no completed sessions later, this surface should render nothing misleading.",
  },
  global: {
    tabLabel: "Global",
    sectionLabel: "Global shell",
    title: "Public analytics now have a dedicated mobile surface.",
    body: "The country leaderboard and regional comparisons will land here. This step only gives them a stable destination in the app structure.",
    statuses: [
      { label: "Leaderboard", value: "Read-only" },
      { label: "Regions", value: "Bucketed later" },
      { label: "Food profiles", value: "Placeholder copy only" },
    ],
    noteTitle: "Later responsibility",
    noteBody:
      "Once backend aggregation exists, this tab becomes the deadpan, browse-while-pooping analytics page.",
  },
  settings: {
    tabLabel: "Settings",
    sectionLabel: "Settings shell",
    title: "Identity stays optional and anonymous-first.",
    body: "Username editing and the passive email prompt will live here. The shell deliberately avoids any login framing.",
    statuses: [
      { label: "Identity", value: "Anonymous UUID" },
      { label: "Username", value: "Editable later" },
      { label: "Email", value: "Passive banner only" },
    ],
    noteTitle: "Constraint to preserve",
    noteBody:
      "Users should never need to create an account before they can start or finish a session.",
  },
};

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenKey>("home");
  const [identityBanner, setIdentityBanner] = useState<IdentityBannerState>(
    createIdentityBannerState(null, false),
  );
  const [sessionFlow, setSessionFlow] = useState<SessionFlowState>(() =>
    createSessionFlowState(),
  );
  const currentScreen = screenContent[activeScreen];

  useEffect(() => {
    let isMounted = true;

    async function provisionIdentity() {
      const localIdentity = await ensureAnonymousIdentity({
        getItem(key) {
          return AsyncStorage.getItem(key);
        },
        setItem(key, value) {
          return AsyncStorage.setItem(key, value);
        },
      });

      if (!isMounted) {
        return;
      }

      setIdentityBanner(
        createIdentityBannerState(
          localIdentity.identity.username,
          Boolean(getExpoPublicSupabaseEnv()),
        ),
      );
    }

    provisionIdentity().catch(() => {
      if (!isMounted) {
        return;
      }

      setIdentityBanner({
        title: "Anonymous record unavailable",
        body: "On-device storage is unavailable, so identity will be recreated until storage access succeeds.",
      });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const startedAtLabel = sessionFlow.startedAt
    ? new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(sessionFlow.startedAt))
    : null;

  const isActiveSession = sessionFlow.stage === "active";

  return (
    <View style={styles.app}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.bannerCard}>
          <View style={styles.bannerMetaRow}>
            <Text style={styles.eyebrow}>V1 structural shell</Text>
            <View style={styles.counterPill}>
              <Text style={styles.counterText}>
                847 people pooping right now
              </Text>
            </View>
          </View>

          <Text style={styles.brandLine}>impoopingrightnow.com</Text>
          <Text style={styles.heroTitle}>
            Deadpan infrastructure for an absurd product.
          </Text>
          <Text style={styles.heroBody}>
            This slice keeps the shell intact while adding anonymous identity
            bootstrapping and Supabase foundation for the next session step.
          </Text>

          <View style={styles.identityCard}>
            <Text style={styles.identityTitle}>{identityBanner.title}</Text>
            <Text style={styles.identityBody}>{identityBanner.body}</Text>
          </View>
        </View>

        <View style={styles.mainCard}>
          <View style={styles.tabRow}>
            {screenOrder.map((screenKey) => {
              const tab = screenContent[screenKey];
              const isActive = activeScreen === screenKey;

              return (
                <Pressable
                  key={screenKey}
                  onPress={() => setActiveScreen(screenKey)}
                  style={[styles.tabButton, isActive && styles.tabButtonActive]}
                >
                  <Text
                    style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                  >
                    {tab.tabLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {activeScreen === "home" ? (
            isActiveSession ? (
              <>
                <View style={styles.screenCard}>
                  <View style={styles.sessionMetaRow}>
                    <Text style={styles.eyebrow}>Active session shell</Text>
                    <Text style={styles.sessionMetaText}>
                      Started {startedAtLabel}
                    </Text>
                  </View>

                  <View style={styles.timerCard}>
                    <Text style={styles.timerLabel}>Poop timer</Text>
                    <Text style={styles.timerValue}>00:00</Text>
                    <Text style={styles.screenBody}>
                      Timer wiring lands in the next step. This slice only
                      establishes the immediate transition into the live-session
                      surface.
                    </Text>
                  </View>

                  <View style={styles.holdButtonPlaceholder}>
                    <Text style={styles.holdButtonLabel}>
                      IT&apos;S COMING OUT
                    </Text>
                  </View>

                  <Text style={styles.encouragementText}>
                    hang in there, champ
                  </Text>

                  <View style={styles.sessionFooterCard}>
                    <View style={styles.flushButtonPlaceholder}>
                      <Text style={styles.flushButtonLabel}>Flush</Text>
                    </View>
                    <Text style={styles.noteBody}>
                      Flush, certificate generation, and the live feed composer
                      arrive in later steps.
                    </Text>
                  </View>

                  <View style={styles.feedPlaceholderCard}>
                    <Text style={styles.eyebrow}>Floating feed corner</Text>
                    <Text style={styles.noteBody}>
                      Live messages will drift through this corner once the
                      realtime slice lands.
                    </Text>
                  </View>
                </View>

                <View style={styles.noteCard}>
                  <Text style={styles.noteTitle}>Session shell status</Text>
                  <Text style={styles.noteBody}>
                    Primary entry now transitions directly into the active
                    session surface. The next slice adds the running timer and
                    hold mechanic inside this layout.
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.screenCard}>
                  <Text style={styles.eyebrow}>Landing screen</Text>
                  <Text style={styles.screenTitle}>
                    Start immediately. No login wall. No intake form.
                  </Text>
                  <Text style={styles.screenBody}>
                    The primary action now drops the user straight into the live
                    session shell. Retroactive logging stays visible, passive,
                    and intentionally stubbed.
                  </Text>

                  <View style={styles.homeActionStack}>
                    <Pressable
                      onPress={() =>
                        setSessionFlow(startLiveSession(new Date()))
                      }
                      style={styles.primaryHomeButton}
                    >
                      <Text style={styles.primaryHomeButtonLabel}>
                        I&apos;m Pooping Right Now
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        setSessionFlow((current) =>
                          openRetroactiveSessionStub(current),
                        )
                      }
                      style={styles.secondaryHomeButton}
                    >
                      <Text style={styles.secondaryHomeButtonLabel}>
                        I Pooped
                      </Text>
                    </Pressable>
                  </View>

                  <Text style={styles.homeCaption}>
                    Primary action starts immediately. Secondary action stays a
                    stub and only shows a passive coming-soon notice.
                  </Text>

                  {sessionFlow.retroactiveStub ? (
                    <View style={styles.stubCard}>
                      <View style={styles.stubCopy}>
                        <Text style={styles.eyebrow}>Retroactive logging</Text>
                        <Text style={styles.stubTitle}>
                          {sessionFlow.retroactiveStub.title}
                        </Text>
                        <Text style={styles.noteBody}>
                          {sessionFlow.retroactiveStub.body}
                        </Text>
                      </View>

                      <Pressable
                        onPress={() =>
                          setSessionFlow((current) =>
                            dismissRetroactiveSessionStub(current),
                          )
                        }
                        style={styles.stubDismissButton}
                      >
                        <Text style={styles.stubDismissButtonLabel}>
                          Dismiss
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}

                  <View style={styles.statusList}>
                    {[
                      "Top counter stays visible from the first screen onward.",
                      "Home surface now switches into active-session mode in place.",
                      "Timer, hold mechanic, and flush stay reserved for later slices.",
                    ].map((item) => (
                      <View key={item} style={styles.statusRow}>
                        <View style={styles.statusIconWrap}>
                          <Text style={styles.statusIcon}>§</Text>
                        </View>
                        <View style={styles.statusCopy}>
                          <Text style={styles.statusValue}>{item}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.noteCard}>
                  <Text style={styles.noteTitle}>What this slice covers</Text>
                  <Text style={styles.noteBody}>
                    Landing now behaves like the product brief: immediate entry,
                    passive retroactive stub, and a session surface ready for
                    timer and hold logic.
                  </Text>
                </View>
              </>
            )
          ) : (
            <>
              <View style={styles.screenCard}>
                <Text style={styles.eyebrow}>{currentScreen.sectionLabel}</Text>
                <Text style={styles.screenTitle}>{currentScreen.title}</Text>
                <Text style={styles.screenBody}>{currentScreen.body}</Text>

                <View style={styles.statusList}>
                  {currentScreen.statuses.map((status) => (
                    <View key={status.label} style={styles.statusRow}>
                      <View style={styles.statusIconWrap}>
                        <Text style={styles.statusIcon}>§</Text>
                      </View>
                      <View style={styles.statusCopy}>
                        <Text style={styles.statusLabel}>{status.label}</Text>
                        <Text style={styles.statusValue}>{status.value}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.noteCard}>
                <Text style={styles.noteTitle}>{currentScreen.noteTitle}</Text>
                <Text style={styles.noteBody}>{currentScreen.noteBody}</Text>
              </View>

              <View style={styles.stampCard}>
                <View style={styles.stampCircle}>
                  <Text style={styles.stampText}>Foundational shell only</Text>
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: "#efe3cc",
  },
  scrollContent: {
    paddingTop: 72,
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 18,
  },
  bannerCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(35, 23, 13, 0.12)",
    backgroundColor: "rgba(255, 248, 235, 0.9)",
    padding: 18,
    shadowColor: "#3a220b",
    shadowOpacity: 0.16,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 4,
    gap: 12,
  },
  bannerMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  eyebrow: {
    color: "#6b523f",
    fontSize: 11,
    letterSpacing: 2.6,
    textTransform: "uppercase",
  },
  counterPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(46, 91, 62, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(46, 91, 62, 0.14)",
  },
  counterText: {
    color: "#2e5b3e",
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  brandLine: {
    color: "#8c5a2b",
    fontSize: 12,
    letterSpacing: 2.2,
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#23170d",
    fontSize: 38,
    lineHeight: 39,
    fontWeight: "700",
    fontFamily: "Georgia",
  },
  heroBody: {
    color: "#67503e",
    fontSize: 15,
    lineHeight: 24,
  },
  identityCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(46, 91, 62, 0.14)",
    backgroundColor: "rgba(46, 91, 62, 0.08)",
    padding: 14,
    gap: 6,
  },
  identityTitle: {
    color: "#2e5b3e",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "700",
  },
  identityBody: {
    color: "#465546",
    fontSize: 13,
    lineHeight: 20,
  },
  mainCard: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(35, 23, 13, 0.12)",
    backgroundColor: "rgba(255, 248, 235, 0.84)",
    padding: 16,
    gap: 16,
  },
  tabRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tabButton: {
    minWidth: "47%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(35, 23, 13, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  tabButtonActive: {
    backgroundColor: "#8c5a2b",
    borderColor: "#8c5a2b",
  },
  tabLabel: {
    color: "#23170d",
    fontSize: 14,
    fontWeight: "600",
  },
  tabLabelActive: {
    color: "#fff8eb",
  },
  screenCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(35, 23, 13, 0.1)",
    backgroundColor: "rgba(255, 252, 247, 0.92)",
    padding: 18,
    gap: 10,
  },
  sessionMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  sessionMetaText: {
    color: "#2e5b3e",
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  screenTitle: {
    color: "#23170d",
    fontSize: 30,
    lineHeight: 31,
    fontWeight: "700",
    fontFamily: "Georgia",
  },
  homeActionStack: {
    gap: 12,
    marginTop: 12,
  },
  primaryHomeButton: {
    borderRadius: 24,
    backgroundColor: "#8c5a2b",
    paddingHorizontal: 20,
    paddingVertical: 22,
    shadowColor: "#8c5a2b",
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  primaryHomeButtonLabel: {
    color: "#fff8eb",
    fontSize: 32,
    lineHeight: 32,
    fontWeight: "700",
    fontFamily: "Georgia",
    textAlign: "center",
  },
  secondaryHomeButton: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(35, 23, 13, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  secondaryHomeButtonLabel: {
    color: "#23170d",
    fontSize: 24,
    lineHeight: 24,
    fontWeight: "700",
    fontFamily: "Georgia",
    textAlign: "center",
  },
  homeCaption: {
    color: "#67503e",
    fontSize: 13,
    lineHeight: 21,
  },
  stubCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(46, 91, 62, 0.18)",
    backgroundColor: "rgba(46, 91, 62, 0.08)",
    padding: 16,
    gap: 12,
  },
  stubCopy: {
    gap: 6,
  },
  stubTitle: {
    color: "#23170d",
    fontSize: 24,
    lineHeight: 26,
    fontWeight: "700",
    fontFamily: "Georgia",
  },
  stubDismissButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#2e5b3e",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  stubDismissButtonLabel: {
    color: "#fff8eb",
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  timerCard: {
    borderRadius: 26,
    backgroundColor: "rgba(245, 236, 219, 0.9)",
    paddingHorizontal: 18,
    paddingVertical: 22,
    alignItems: "center",
    gap: 8,
  },
  timerLabel: {
    color: "#6b523f",
    fontSize: 11,
    letterSpacing: 2.4,
    textTransform: "uppercase",
  },
  timerValue: {
    color: "#23170d",
    fontSize: 74,
    lineHeight: 74,
    fontWeight: "700",
    fontFamily: "Georgia",
  },
  holdButtonPlaceholder: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(140, 90, 43, 0.28)",
    backgroundColor: "rgba(140, 90, 43, 0.18)",
    paddingHorizontal: 18,
    paddingVertical: 28,
  },
  holdButtonLabel: {
    color: "#23170d",
    fontSize: 38,
    lineHeight: 38,
    fontWeight: "700",
    fontFamily: "Georgia",
    textAlign: "center",
  },
  encouragementText: {
    color: "#67503e",
    fontSize: 14,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    textAlign: "center",
  },
  sessionFooterCard: {
    gap: 10,
  },
  flushButtonPlaceholder: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(35, 23, 13, 0.12)",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  flushButtonLabel: {
    color: "#23170d",
    fontSize: 22,
    lineHeight: 22,
    fontWeight: "700",
    fontFamily: "Georgia",
    textAlign: "center",
  },
  feedPlaceholderCard: {
    alignSelf: "flex-end",
    maxWidth: 220,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(35, 23, 13, 0.1)",
    backgroundColor: "rgba(255, 255, 255, 0.42)",
    opacity: 0.82,
    padding: 14,
    gap: 8,
  },
  screenBody: {
    color: "#67503e",
    fontSize: 15,
    lineHeight: 24,
  },
  statusList: {
    gap: 10,
    marginTop: 10,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(35, 23, 13, 0.08)",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    padding: 12,
  },
  statusIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(140, 90, 43, 0.12)",
  },
  statusIcon: {
    color: "#8c5a2b",
    fontWeight: "700",
  },
  statusCopy: {
    flex: 1,
    gap: 4,
  },
  statusLabel: {
    color: "#6b523f",
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  statusValue: {
    color: "#23170d",
    fontSize: 20,
    lineHeight: 22,
    fontWeight: "700",
    fontFamily: "Georgia",
  },
  noteCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(35, 23, 13, 0.1)",
    backgroundColor: "rgba(245, 236, 219, 0.92)",
    padding: 18,
    gap: 8,
  },
  noteTitle: {
    color: "#23170d",
    fontSize: 24,
    lineHeight: 26,
    fontWeight: "700",
    fontFamily: "Georgia",
  },
  noteBody: {
    color: "#67503e",
    fontSize: 14,
    lineHeight: 23,
  },
  stampCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  stampCircle: {
    width: 130,
    height: 130,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(140, 90, 43, 0.42)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  stampText: {
    color: "#8c5a2b",
    fontSize: 11,
    lineHeight: 18,
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
  },
});
