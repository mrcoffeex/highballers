import { LegalDocumentView } from '../../components/LegalDocumentView';
import { TERMS_SECTIONS } from '../../lib/legalDocuments';

export default function TermsScreen() {
  return (
    <LegalDocumentView title="Terms & Conditions" sections={TERMS_SECTIONS} />
  );
}
