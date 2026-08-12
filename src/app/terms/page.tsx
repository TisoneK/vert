import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/vert/LegalPageShell'
import { SITE_NAME, absoluteUrl } from '@/lib/site-metadata'

export const metadata: Metadata = {
  title: `Terms of Service · ${SITE_NAME}`,
  description: `The terms that govern your use of ${SITE_NAME}.`,
  alternates: { canonical: absoluteUrl('/terms') },
}

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service" lastUpdated="August 11, 2026">
      <p>
        Welcome to Vert. These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use
        of Vert (the &ldquo;Service&rdquo;). By creating an account or using the Service, you agree
        to these Terms. If you do not agree, do not use the Service.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 13 years old (or the minimum age of digital consent in your country) to
        use Vert. If you use the Service on behalf of an organization, you represent that you are
        authorized to accept these Terms for it.
      </p>

      <h2>2. Your account</h2>
      <p>
        You are responsible for your account and for keeping your login credentials secure. You are
        responsible for all activity that happens under your account. Notify us promptly of any
        unauthorized use.
      </p>

      <h2>3. Your content</h2>
      <p>
        You retain ownership of the videos and other content you upload (&ldquo;Your Content&rdquo;).
        By uploading, you grant Vert a worldwide, non-exclusive, royalty-free license to host,
        store, reproduce, and display Your Content solely to operate and provide the Service.
      </p>
      <p>You represent that you own or have the necessary rights to Your Content, and that it does not:</p>
      <ul>
        <li>infringe anyone&rsquo;s intellectual property, privacy, or other rights;</li>
        <li>contain unlawful, harassing, hateful, or sexually exploitative material;</li>
        <li>contain malware, or spam, or attempt to deceive other users.</li>
      </ul>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>break the law or violate others&rsquo; rights while using the Service;</li>
        <li>attempt to access accounts, data, or systems you are not authorized to access;</li>
        <li>scrape, overload, disrupt, or reverse-engineer the Service;</li>
        <li>upload content you do not have the rights to distribute.</li>
      </ul>

      <h2>5. Content moderation and termination</h2>
      <p>
        We may remove content or suspend or terminate accounts that violate these Terms or that we
        reasonably believe are harmful to users or the Service. You may stop using the Service and
        delete your account at any time from your account settings.
      </p>

      <h2>6. Third-party content</h2>
      <p>
        The Service may display content uploaded by other users and links to third-party sites. We
        do not endorse and are not responsible for third-party content.
      </p>

      <h2>7. Disclaimers</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo; and &ldquo;as available,&rdquo; without
        warranties of any kind, to the fullest extent permitted by law. We do not warrant that the
        Service will be uninterrupted, secure, or error-free.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, Vert will not be liable for any indirect,
        incidental, special, consequential, or punitive damages, or any loss of data or profits,
        arising from your use of the Service.
      </p>

      <h2>9. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. If we make material changes, we will update the
        &ldquo;Last updated&rdquo; date above and, where appropriate, notify you. Your continued use
        of the Service after changes take effect means you accept the updated Terms.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions about these Terms? Reach us through our <a href="/contact">contact page</a>.
      </p>
    </LegalPageShell>
  )
}
