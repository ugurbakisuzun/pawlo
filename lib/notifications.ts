import { Platform } from "react-native";

let Notifications: any = null;
try {
  Notifications = require("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch {}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!Notifications) return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === "granted") return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

export async function scheduleDailyReminder(
  hour = 19,
  minute = 0,
): Promise<void> {
  if (!Notifications) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const granted = await requestNotificationPermission();
    if (!granted) return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("training", {
        name: "Training Reminders",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to train! 🐾",
        body: "Your daily session is waiting. Keep that streak alive!",
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  } catch {}
}

export async function sendSessionCompleteNotification(
  dogName: string,
  xpEarned: number,
  streakDays: number,
): Promise<void> {
  if (!Notifications) return;
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("training", {
        name: "Training Reminders",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Great session, ${dogName}! 🎉`,
        body: `+${xpEarned} XP earned · ${streakDays}-day streak 🔥`,
        sound: true,
        ...(Platform.OS === "android" && { channelId: "training" }),
      },
      trigger: null,
    });
  } catch {}
}
