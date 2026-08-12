import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/vert/LegalPageShell'
import { SITE_NAME, absoluteUrl } from '@/lib/site-metadata'

export const metadata: Metadata = {
  title: `Privacy Policy · ${SITE_NAME}`,
  description: `How ${SITE_NAME} collects, uses, and protects your information.`,
  alternates: { canonical: absoluteUrl('/privacy') },
}

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy" lastUpdated="August 11, 2026">
      <p>
        This Privacy Policy explains what information Vert (&ldquo;we&rdquo;) collects, how we use
        it, and the choices you have. By using Vert, you agree to this policy.
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>
          <strong>Account information</strong> you provide when you sign up — your email address and
          username (and, if you sign in with Google, basic profile information from Google).
        </li>
        <li>
          <strong>Content you create</strong> — videos, thumbnails, comments, and other content you
          upload or post.
        </li>
        <li>
          <strong>Usage and device data</strong> — basic technical information such as your IP
          address and interactions with the Service, used to operate, secure, and improve it.
        </li>
      </ul>
      <p>We do not ask for or store payment card details.</p>

      <h2>2. How we use your information</h2>
      <ul>
        <li>to provide, maintain, and improve the Service;</li>
        <li>to authenticate you and keep your account secure;</li>
        <li>to send you notifications about activity you have opted into;</li>
        <li>to detect, prevent, and respond to abuse, fraud, and security issues.</li>
      </ul>

      <h2>3. Cookies</h2>
      <p>
        We use essential cookies to keep you signed in and to remember preferences such as your
        light/dark theme. We do not use advertising-tracking cookies.
      </p>

      <h2>4. How we share information</h2>
      <p>
        We do not sell your personal information. We share it only with service providers who help
        us run Vert (for example, hosting and file storage), and where required to comply with the
        law or to protect the rights and safety of our users and the Service. Content you post
        publicly (videos, comments, your channel) is visible to others by design.
      </p>

      <h2>5. Data retention</h2>
      <p>
        We keep your information for as long as your account is active or as needed to provide the
        Service. When you delete your account, we delete or de-identify your personal information,
        except where we need to retain it to comply with legal obligations or resolve disputes.
      </p>

      <h2>6. Your choices and rights</h2>
      <p>
        You can review and update your profile, and delete your account, from your account settings.
        Depending on where you live, you may have additional rights to access, correct, or delete
        your personal information — contact us to make a request.
      </p>

      <h2>7. Security</h2>
      <p>
        We use reasonable technical and organizational measures to protect your information,
        including hashing passwords and serving the Service over HTTPS. No method of transmission or
        storage is completely secure, however, and we cannot guarantee absolute security.
      </p>

      <h2>8. Children</h2>
      <p>
        Vert is not directed to children under 13, and we do not knowingly collect personal
        information from them. If you believe a child has provided us information, contact us and we
        will take appropriate steps.
      </p>

      <h2>9. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. We will update the &ldquo;Last updated&rdquo;
        date above and, where appropriate, notify you of material changes.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions about your privacy? Reach us through our <a href="/contact">contact page</a>.
      </p>
    </LegalPageShell>
  )
}
