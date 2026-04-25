import { formatDurationMs } from "./session-runtime";

type AnalyticsSeedRow = {
  name: string;
  sessionCount: number;
  averageDurationMs: number;
  averagePeakHour: number;
  averageLogsPerSession: number;
  averagePushMsPerSession: number;
};

type RegionalAnalyticsSeedRow = AnalyticsSeedRow & {
  foodProfile: string;
};

export type GlobalAnalyticsRow = {
  name: string;
  sessionCount: number;
  averageDurationMs: number;
  averageDurationLabel: string;
  averagePeakHour: number;
  averagePeakHourLabel: string;
  averageLogsPerSession: number;
  averagePushMsPerSession: number;
  averagePushLabel: string;
};

export type RegionalAnalyticsRow = GlobalAnalyticsRow & {
  foodProfile: string;
};

export type GlobalAnalyticsSnapshot = {
  minimumSessions: number;
  previewNotice: string;
  countryLeaderboard: GlobalAnalyticsRow[];
  regionalStats: RegionalAnalyticsRow[];
};

type BuildGlobalAnalyticsOptions = {
  minimumSessions?: number;
  countries?: AnalyticsSeedRow[];
  regions?: RegionalAnalyticsSeedRow[];
};

export const globalAnalyticsMinimumSessions = 50;

const previewCountrySeeds: AnalyticsSeedRow[] = [
  {
    name: "Japan",
    sessionCount: 88,
    averageDurationMs: 198000,
    averagePeakHour: 7,
    averageLogsPerSession: 2.3,
    averagePushMsPerSession: 94000,
  },
  {
    name: "United Kingdom",
    sessionCount: 63,
    averageDurationMs: 214000,
    averagePeakHour: 8,
    averageLogsPerSession: 2.1,
    averagePushMsPerSession: 101000,
  },
  {
    name: "United States",
    sessionCount: 142,
    averageDurationMs: 226000,
    averagePeakHour: 7,
    averageLogsPerSession: 2.5,
    averagePushMsPerSession: 112000,
  },
  {
    name: "Canada",
    sessionCount: 57,
    averageDurationMs: 239000,
    averagePeakHour: 9,
    averageLogsPerSession: 2.2,
    averagePushMsPerSession: 118000,
  },
  {
    name: "Mexico",
    sessionCount: 41,
    averageDurationMs: 251000,
    averagePeakHour: 10,
    averageLogsPerSession: 2.6,
    averagePushMsPerSession: 121000,
  },
];

const previewRegionalSeeds: RegionalAnalyticsSeedRow[] = [
  {
    name: "US West",
    sessionCount: 74,
    averageDurationMs: 225000,
    averagePeakHour: 7,
    averageLogsPerSession: 2.4,
    averagePushMsPerSession: 109000,
    foodProfile:
      "Placeholder foods: cold brew, breakfast burritos, and suspiciously expensive greens.",
  },
  {
    name: "US East",
    sessionCount: 69,
    averageDurationMs: 218000,
    averagePeakHour: 8,
    averageLogsPerSession: 2.3,
    averagePushMsPerSession: 104000,
    foodProfile:
      "Placeholder foods: deli sandwiches, late-night pizza, and coffee taken too personally.",
  },
  {
    name: "Canada",
    sessionCount: 58,
    averageDurationMs: 241000,
    averagePeakHour: 9,
    averageLogsPerSession: 2.2,
    averagePushMsPerSession: 117000,
    foodProfile:
      "Placeholder foods: poutine, double-doubles, and polite gastrointestinal regret.",
  },
  {
    name: "Western Europe",
    sessionCount: 71,
    averageDurationMs: 212000,
    averagePeakHour: 8,
    averageLogsPerSession: 2,
    averagePushMsPerSession: 99000,
    foodProfile:
      "Placeholder foods: espresso, butter-heavy pastry, and a firm commitment to cured meats.",
  },
  {
    name: "East Asia",
    sessionCount: 54,
    averageDurationMs: 194000,
    averagePeakHour: 7,
    averageLogsPerSession: 2.1,
    averagePushMsPerSession: 91000,
    foodProfile:
      "Placeholder foods: convenience-store coffee, noodles, and immaculate digestive scheduling.",
  },
  {
    name: "Oceania",
    sessionCount: 36,
    averageDurationMs: 233000,
    averagePeakHour: 9,
    averageLogsPerSession: 2.4,
    averagePushMsPerSession: 108000,
    foodProfile:
      "Placeholder foods: flat whites, toast, and beach-day overconfidence.",
  },
];

function sortRows<T extends AnalyticsSeedRow>(rows: T[]): T[] {
  return [...rows].sort((leftRow, rightRow) => {
    if (leftRow.averageDurationMs !== rightRow.averageDurationMs) {
      return leftRow.averageDurationMs - rightRow.averageDurationMs;
    }

    return rightRow.sessionCount - leftRow.sessionCount;
  });
}

export function formatPeakHourLabel(hour: number): string {
  const normalizedHour = ((Math.round(hour) % 24) + 24) % 24;
  const displayHour = normalizedHour % 12 || 12;
  const suffix = normalizedHour >= 12 ? "PM" : "AM";

  return `${displayHour} ${suffix}`;
}

function toGlobalAnalyticsRow(seedRow: AnalyticsSeedRow): GlobalAnalyticsRow {
  return {
    ...seedRow,
    averageDurationLabel: formatDurationMs(seedRow.averageDurationMs),
    averagePeakHourLabel: formatPeakHourLabel(seedRow.averagePeakHour),
    averagePushLabel: formatDurationMs(seedRow.averagePushMsPerSession),
  };
}

function toRegionalAnalyticsRow(
  seedRow: RegionalAnalyticsSeedRow,
): RegionalAnalyticsRow {
  return {
    ...toGlobalAnalyticsRow(seedRow),
    foodProfile: seedRow.foodProfile,
  };
}

export function buildGlobalAnalyticsSnapshot(
  options: BuildGlobalAnalyticsOptions = {},
): GlobalAnalyticsSnapshot {
  const minimumSessions =
    options.minimumSessions ?? globalAnalyticsMinimumSessions;
  const countries = options.countries ?? previewCountrySeeds;
  const regions = options.regions ?? previewRegionalSeeds;

  return {
    minimumSessions,
    previewNotice:
      "Preview analytics only. Real country and region buckets unlock when the geolocation pipeline lands.",
    countryLeaderboard: sortRows(
      countries.filter((row) => row.sessionCount >= minimumSessions),
    ).map(toGlobalAnalyticsRow),
    regionalStats: sortRows(
      regions.filter((row) => row.sessionCount >= minimumSessions),
    ).map(toRegionalAnalyticsRow),
  };
}
