/**
 * Privacy Policy Page
 * Required for Google Play Store compliance
 */

import React from 'react';
import MobileHeader from '../components/mobile/MobileHeader';
import { useSetCurrentScreen } from '../stores';
import { t } from '../utils/translations';

const PrivacyPolicyPage = () => {
    const setCurrentScreen = useSetCurrentScreen();

    return (
        <div className="min-h-screen bg-gray-50 pb-24 sm:pb-8">
            <MobileHeader title="Privacy Policy" backScreen="settings" />
            
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
                    
                    <div className="prose prose-sm sm:prose max-w-none text-gray-700 space-y-6">
                        <section>
                            <p className="text-sm text-gray-600 mb-4">
                                <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
                            </p>
                            <p>
                                This Privacy Policy describes how we collect, use, and protect your personal information 
                                when you use our Korean Commerce App ("the App").
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
                            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.1 Account Information</h3>
                            <p>
                                When you create an account, we collect:
                            </p>
                            <ul className="list-disc list-inside ml-4 space-y-2">
                                <li>Email address</li>
                                <li>Name (if provided)</li>
                                <li>Authentication credentials (stored securely)</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.2 Transaction Information</h3>
                            <p>
                                When you make purchases or create listings, we collect:
                            </p>
                            <ul className="list-disc list-inside ml-4 space-y-2">
                                <li>Order details and payment information (processed securely through Stripe)</li>
                                <li>Shipping and delivery addresses</li>
                                <li>Transaction history</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-3">1.3 Usage Information</h3>
                            <p>
                                We automatically collect:
                            </p>
                            <ul className="list-disc list-inside ml-4 space-y-2">
                                <li>Device information and identifiers</li>
                                <li>App usage patterns and preferences</li>
                                <li>Error logs and crash reports (for app improvement)</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
                            <p>We use your information to:</p>
                            <ul className="list-disc list-inside ml-4 space-y-2">
                                <li>Provide and improve our services</li>
                                <li>Process transactions and payments</li>
                                <li>Communicate with you about your account and orders</li>
                                <li>Send you important updates and notifications (with your consent)</li>
                                <li>Detect and prevent fraud or abuse</li>
                                <li>Comply with legal obligations</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Payment Processing</h2>
                            <p>
                                Payments are processed securely through Stripe. We do not store your full payment card details. 
                                All payment information is encrypted and handled in accordance with PCI DSS standards.
                            </p>
                            <p className="mt-4">
                                <strong>Important:</strong> In development or testing environments, payments may be processed 
                                using test mode. You will be clearly notified if you are in a test environment.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data Sharing</h2>
                            <p>We do not sell your personal information. We may share your information only:</p>
                            <ul className="list-disc list-inside ml-4 space-y-2">
                                <li>With payment processors (Stripe) to process transactions</li>
                                <li>With service providers who assist in operating our app (under strict confidentiality agreements)</li>
                                <li>When required by law or to protect our rights</li>
                                <li>With your explicit consent</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Data Security</h2>
                            <p>
                                We implement industry-standard security measures to protect your information, including:
                            </p>
                            <ul className="list-disc list-inside ml-4 space-y-2">
                                <li>Encryption of data in transit and at rest</li>
                                <li>Secure authentication and authorization</li>
                                <li>Regular security audits and updates</li>
                                <li>Access controls and monitoring</li>
                            </ul>
                            <p className="mt-4">
                                However, no method of transmission over the internet is 100% secure. 
                                While we strive to protect your data, we cannot guarantee absolute security.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Your Rights</h2>
                            <p>You have the right to:</p>
                            <ul className="list-disc list-inside ml-4 space-y-2">
                                <li>Access your personal information</li>
                                <li>Correct inaccurate information</li>
                                <li>Request deletion of your account and data</li>
                                <li>Opt-out of marketing communications</li>
                                <li>Export your data</li>
                            </ul>
                            <p className="mt-4">
                                To exercise these rights, please contact us through the app settings or email us at the 
                                contact information provided below.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Data Retention</h2>
                            <p>
                                We retain your information for as long as necessary to provide our services and comply 
                                with legal obligations. When you delete your account, we will delete or anonymize your 
                                personal information, except where we are required to retain it by law.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Children's Privacy</h2>
                            <p>
                                Our app is not intended for users under the age of 13. We do not knowingly collect 
                                personal information from children under 13. If you believe we have collected information 
                                from a child under 13, please contact us immediately.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. International Users</h2>
                            <p>
                                If you are using our app from outside the country where our servers are located, your 
                                information may be transferred to and processed in that country. By using our app, you 
                                consent to this transfer.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Changes to This Policy</h2>
                            <p>
                                We may update this Privacy Policy from time to time. We will notify you of any material 
                                changes by posting the new policy on this page and updating the "Last Updated" date.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Contact Us</h2>
                            <p>
                                If you have questions about this Privacy Policy or our data practices, please contact us:
                            </p>
                            <ul className="list-none ml-4 space-y-2 mt-4">
                                <li><strong>Email:</strong> contpickstudio@gmail.com</li>
                                <li><strong>App:</strong> Settings → Contact Support</li>
                            </ul>
                        </section>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-200">
                        <button
                            onClick={() => setCurrentScreen('settings')}
                            className="btn-secondary"
                        >
                            {t('common.backToSettings', null, 'Back to Settings')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;

