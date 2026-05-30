import { APP_LEGAL_META, LEGAL_VERSION } from "./legal";

export interface LegalSection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

const meta = APP_LEGAL_META;

export const PRIVACY_POLICY_SECTIONS: LegalSection[] = [
  {
    title: "Introduction",
    paragraphs: [
      `${meta.appName} ("we", "us", or "our") operates the ${meta.appName} mobile application and related services. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our app.`,
      `Effective date: ${meta.effectiveDate}. Version ${LEGAL_VERSION}.`,
    ],
  },
  {
    title: "Information We Collect",
    paragraphs: [
      "We collect information you provide and data generated when you use the app:",
    ],
    bullets: [
      "Account data: email address, password (stored securely by our auth provider), display name, nickname, position, skill ratings, optional profile photo, and subscription tier.",
      "Club & game data: club memberships, game schedules, locations you enter, court assignments, box score statistics, and club chat messages.",
      "Device data: push notification tokens (if you enable notifications), and basic technical data needed to run the app.",
      "OAuth data: if you sign in with Google, we receive profile information permitted by Google (such as name and email).",
      "Purchase data: if you subscribe to All-Star Baller, Apple or Google processes payment. We receive subscription status, product ID, and transaction identifiers to unlock features — we do not receive your full payment card details.",
    ],
  },
  {
    title: "How We Use Your Information",
    paragraphs: ["We use your information to:"],
    bullets: [
      "Create and manage your account and player profile.",
      "Sync clubs, games, stats, and chat across your devices.",
      "Send optional push notifications about club activity (e.g. new games or chat).",
      "Display leaderboards, profiles, and game stories within your clubs.",
      "Enforce our Terms, prevent abuse, and improve reliability and security.",
    ],
  },
  {
    title: "Legal Bases (EEA/UK Users)",
    paragraphs: [
      "Where applicable, we process personal data based on: performance of our contract with you (providing the service), your consent (e.g. notifications or optional photos), and our legitimate interests (security, fraud prevention, and product improvement).",
    ],
  },
  {
    title: "Sharing & Service Providers",
    paragraphs: [
      "We do not sell your personal information. We share data only as needed to operate the app:",
    ],
    bullets: [
      "Supabase — authentication, database, storage, and realtime features.",
      "Google — if you choose Sign in with Google.",
      "Apple App Store / Google Play — subscription billing and receipt validation when you purchase All-Star Baller.",
      "Expo / platform services — app delivery, push notification delivery on iOS and Android.",
      "Other club members — your profile, stats, and club-visible activity are visible to members of clubs you join.",
    ],
  },
  {
    title: "Photos, Location & Permissions",
    paragraphs: [
      "Profile and club images are uploaded only when you choose them. Game locations may include coordinates you pin on a map. You can control notification and photo permissions in your device settings.",
    ],
  },
  {
    title: "Retention",
    paragraphs: [
      "We retain your data while your account is active. If you delete your account, we delete or anonymize associated personal data within a reasonable period, except where law requires retention.",
    ],
  },
  {
    title: "Your Rights & Choices",
    paragraphs: ["Depending on your region, you may have the right to:"],
    bullets: [
      "Access, correct, or delete your personal data.",
      "Export your data or object to certain processing.",
      "Withdraw consent where processing is consent-based.",
      "Lodge a complaint with your local data protection authority.",
    ],
  },
  {
    title: "Account Deletion",
    paragraphs: [
      `You may delete your account from Profile → Legal → Delete account, or email ${meta.contactEmail}. Deletion removes your profile and disassociates you from clubs; some club content you created may remain visible to other members in anonymized form where needed for club history.`,
    ],
  },
  {
    title: "Children's Privacy",
    paragraphs: [
      `${meta.appName} is not directed to children under ${meta.minimumAge}. We do not knowingly collect data from children under ${meta.minimumAge}. Contact us if you believe a child has provided personal data.`,
    ],
  },
  {
    title: "Security",
    paragraphs: [
      "We use industry-standard measures including encrypted connections (HTTPS/TLS) and access controls. No method of transmission or storage is 100% secure.",
    ],
  },
  {
    title: "International Transfers",
    paragraphs: [
      "Your data may be processed in countries where our service providers operate. We rely on appropriate safeguards where required by law.",
    ],
  },
  {
    title: "Changes",
    paragraphs: [
      "We may update this policy. We will post the new version in the app and update the effective date. Continued use after changes means you accept the updated policy where permitted by law.",
    ],
  },
  {
    title: "Contact Us",
    paragraphs: [`Questions about privacy: ${meta.contactEmail}`],
  },
];

export const TERMS_SECTIONS: LegalSection[] = [
  {
    title: "Agreement",
    paragraphs: [
      `These Terms & Conditions ("Terms") govern your use of ${meta.appName} operated by ${meta.companyName}. By creating an account or using the app, you agree to these Terms and our Privacy Policy.`,
      `Effective date: ${meta.effectiveDate}. Version ${LEGAL_VERSION}.`,
    ],
  },
  {
    title: "Eligibility",
    paragraphs: [
      `You must be at least ${meta.minimumAge} years old and able to form a binding contract. You are responsible for the accuracy of information you provide.`,
    ],
  },
  {
    title: "Accounts & Security",
    paragraphs: [
      "You are responsible for safeguarding your login credentials and for activity under your account. Notify us promptly of unauthorized use.",
    ],
  },
  {
    title: "The Service",
    paragraphs: [
      `${meta.appName} helps basketball communities organize clubs, schedule games, balance teams, record stats, and chat. Features may change; some features require a paid "All-Star" subscription as described in the app.`,
    ],
  },
  {
    title: "User Content & Conduct",
    paragraphs: [
      "You retain ownership of content you submit. You grant us a license to host and display it to provide the service. You agree not to:",
    ],
    bullets: [
      "Harass, threaten, or discriminate against others.",
      "Post unlawful, misleading, or infringing content.",
      "Scrape, reverse engineer, or disrupt the service.",
      "Use the app for commercial spam or unauthorized advertising.",
    ],
  },
  {
    title: "Clubs & Organizers",
    paragraphs: [
      "Club captains may manage membership, games, and visibility settings. We are not responsible for disputes between players or clubs. Private club and organizer tools may be limited by subscription tier.",
    ],
  },
  {
    title: "Subscriptions",
    paragraphs: [
      "All-Star Baller is an optional auto-renewing monthly subscription sold through the Apple App Store or Google Play. Payment is charged to your store account at confirmation of purchase.",
      "Your subscription renews automatically unless you cancel at least 24 hours before the end of the current billing period. You can manage or cancel in your device subscription settings. Refunds are handled under Apple or Google policies.",
      "We may change subscription price or features with notice in the app. Continued use after a price change takes effect constitutes acceptance where permitted by store rules.",
    ],
  },
  {
    title: "Disclaimer",
    paragraphs: [
      'THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. Pickup basketball involves physical risk; you participate in real-world games at your own risk. We do not guarantee scheduling accuracy, stat correctness, or availability.',
    ],
  },
  {
    title: "Limitation of Liability",
    paragraphs: [
      "TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE ARE NOT LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, OR FOR INJURY OR PROPERTY DAMAGE ARISING FROM GAMES OR MEETUPS ORGANIZED THROUGH THE APP. OUR TOTAL LIABILITY IS LIMITED TO THE GREATER OF AMOUNT YOU PAID US IN THE PAST 12 MONTHS OR USD $50.",
    ],
  },
  {
    title: "Indemnity",
    paragraphs: [
      "You agree to indemnify us against claims arising from your misuse of the service or violation of these Terms.",
    ],
  },
  {
    title: "Termination",
    paragraphs: [
      "You may stop using the app and delete your account at any time. We may suspend or terminate access for violations or to protect the community.",
    ],
  },
  {
    title: "Governing Law",
    paragraphs: [
      "These Terms are governed by the laws applicable to the operator, without regard to conflict-of-law rules. Disputes will be resolved in courts of competent jurisdiction unless local law requires otherwise.",
    ],
  },
  {
    title: "Contact",
    paragraphs: [`Questions about these Terms: ${meta.contactEmail}`],
  },
];
