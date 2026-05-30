import { LegalDocumentView } from '../../components/LegalDocumentView';
import { PRIVACY_POLICY_SECTIONS } from '../../lib/legalDocuments';

export default function PrivacyPolicyScreen() {
  return (
    <LegalDocumentView title="Privacy Policy" sections={PRIVACY_POLICY_SECTIONS} />
  );
}
