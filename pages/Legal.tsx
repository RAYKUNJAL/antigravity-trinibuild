import React from 'react';
import { Shield, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

interface LegalProps {
  type: 'terms' | 'privacy' | 'contractor-agreement' | 'liability-waiver' | 'affiliate-terms' | 'document-disclaimer';
}

export const Legal: React.FC<LegalProps> = ({ type }) => {
  const renderContent = () => {
    switch (type) {
      case 'terms':
        return (
          <>
            <h1>TriniBuild Terms of Service</h1>
            <p className="text-gray-500">Last Updated: November 25, 2025</p>

            <h3>1. Platform Nature</h3>
            <p>
              TriniBuild is a digital platform providing marketplace, service, job, ride-share, ticketing, and business-document tools.
              TriniBuild does not employ, supervise, or control users.
            </p>

            <h3>2. Independent Contractor Status</h3>
            <p>
              <strong>Mandatory for all users:</strong> All users (vendors, buyers, drivers, delivery persons, freelancers, job seekers, paid members, affiliate users, service providers)
              acknowledge they are independent contractors responsible for their own taxes, insurance, licenses, and legal compliance.
            </p>

            <h3>3. Affiliate Membership</h3>
            <p>
              All users are automatically enrolled as affiliate partners and may earn commissions on referrals. Users are responsible for taxes on any commissions earned.
            </p>

            <h3>4. DocuSign Requirement</h3>
            <p>
              Certain features (drivers, service providers, freelancers, paid subscription members) require signing a legally binding agreement via DocuSign.
            </p>

            <h3>5. Liability Limitations</h3>
            <p>
              TriniBuild is not liable for accidents, injuries, property damage, financial losses, disputes, fraud, downtime, or user-generated content to the maximum extent permissible under law.
            </p>
          </>
        );
      case 'privacy':
        return (
          <>
            <h1>TriniBuild Privacy Policy</h1>
            <p className="text-gray-500">Last Updated: November 25, 2025</p>

            <h3>1. Data Collected</h3>
            <p>
              We collect name, address, phone, email, device data, location (optional for rides), business information, uploaded documents, transaction history, and ID for KYC purposes.
            </p>

            <h3>2. How Data is Used</h3>
            <p>
              Data is used for identity verification, document generation, fraud prevention, analytics, platform improvement, affiliate tracking, and payment processing.
            </p>

            <h3>3. Third-Party Sharing</h3>
            <p>
              We share data with KYC providers, payment processors, DocuSign, fraud prevention services, and law enforcement (if required).
            </p>
          </>
        );
      case 'contractor-agreement':
        return (
          <>
            <h1>Independent Contractor Agreement</h1>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6 flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
              <p className="text-sm text-yellow-800">
                This is a legally binding agreement. By using TriniBuild services as a provider, driver, or vendor, you agree to these terms.
              </p>
            </div>

            <h3>1. Contractor Status</h3>
            <p>
              The user acknowledges that they are an independent contractor, not an employee of TriniBuild. You are solely responsible for your own taxes, insurance, licenses, and compliance with local laws.
            </p>

            <h3>2. No Employment Claims</h3>
            <p>
              You agree to waive any claims to employment benefits, including but not limited to health insurance, paid time off, or retirement benefits.
            </p>

            <h3>3. Business Document Rights</h3>
            <p>
              You grant TriniBuild permission to generate job letters, income summaries, and business-related documents based on your platform activity for your convenience.
            </p>

            <h3>4. Tax Responsibility</h3>
            <p>
              All income earned through TriniBuild is self-employment income. TriniBuild does not withhold taxes on your behalf.
            </p>
          </>
        );
      case 'liability-waiver':
        return (
          <>
            <h1>Service, Delivery & Ride Liability Waiver</h1>

            <h3>1. User Risk Acknowledgement</h3>
            <p>
              User acknowledges all responsibilities and risks associated with transporting passengers, delivering items, or performing services. You operate entirely at your own risk.
            </p>

            <h3>2. TriniBuild Liability Disclaimer</h3>
            <p>
              TriniBuild is not responsible for injuries, accidents, thefts, property damage, or disputes arising from interactions between users.
            </p>

            <h3>3. Insurance Requirement</h3>
            <p>
              You must maintain appropriate insurance coverage (vehicle, liability, etc.) to cover your work on the platform.
            </p>
          </>
        );
      case 'affiliate-terms':
        return (
          <>
            <h1>Affiliate & Referral Terms</h1>

            <h3>1. Automatic Membership</h3>
            <p>
              All users are automatically considered affiliate partners of TriniBuild.
            </p>

            <h3>2. Commissions</h3>
            <p>
              Commission is paid based on approved referrals only. TriniBuild reserves the right to withhold commissions for suspicious activity.
            </p>

            <h3>3. Prohibited Actions</h3>
            <p>
              Spam marketing, false claims, unauthorized advertisements, and misrepresentation of TriniBuild are strictly prohibited and may result in account termination.
            </p>
          </>
        );
      case 'document-disclaimer':
        return (
          <>
            <h1>Document Generation Disclaimer</h1>

            <h3>1. Automated Generation</h3>
            <p>
              All documents (job letters, income summaries, contractor statements) are automatically generated from user activity and data provided by you.
            </p>

            <h3>2. No Employment Relationship</h3>
            <p>
              The generation of these documents does not imply that TriniBuild employs the user. They are proof of your independent business activity on the platform.
            </p>

            <h3>3. No Guarantee</h3>
            <p>
              Documents are provided for convenience only and do not guarantee income or approval by any financial institution or visa authority.
            </p>
          </>
        );
      default:
        return <p>Document not found.</p>;
    }
  };

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="prose prose-red lg:prose-lg mx-auto">
          <div className="flex justify-center mb-8">
            <img src="/trinibuild-logo.png" alt="TriniBuild Logo" className="h-16 w-auto" />
          </div>
          {renderContent()}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} TriniBuild. All rights reserved.
            <br />
            Use of this site constitutes acceptance of our <a href="/#/terms" className="text-trini-red hover:underline">Terms</a> and <a href="/#/privacy" className="text-trini-red hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};