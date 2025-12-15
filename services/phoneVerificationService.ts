import { supabase } from './supabaseClient';

/**
 * Phone Verification Service with SMS and WhatsApp support
 * For Trinidad & Tobago phone numbers (+1-868-XXX-XXXX)
 */

export interface PhoneVerificationResult {
    success: boolean;
    message: string;
    verificationId?: string;
}

export const phoneVerificationService = {
    /**
     * Format Trinidad phone number to standard format
     */
    formatTrinidadPhone(phone: string): string {
        // Remove all non-numeric characters
        const digits = phone.replace(/\D/g, '');

        // Handle different input formats
        if (digits.length === 7) {
            // Local format: XXX-XXXX
            return `+1868${digits}`;
        } else if (digits.length === 10 && digits.startsWith('868')) {
            // 868-XXX-XXXX
            return `+1${digits}`;
        } else if (digits.length === 11 && digits.startsWith('1868')) {
            // 1-868-XXX-XXXX
            return `+${digits}`;
        }

        return phone;
    },

    /**
     * Validate Trinidad phone number format
     */
    isValidTrinidadPhone(phone: string): boolean {
        const formatted = this.formatTrinidadPhone(phone);
        return /^\+1868\d{7}$/.test(formatted);
    },

    /**
     * Generate OTP code
     */
    generateOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    },

    /**
     * Send SMS verification code
     */
    async sendSMSVerification(phone: string): Promise<PhoneVerificationResult> {
        const formattedPhone = this.formatTrinidadPhone(phone);

        if (!this.isValidTrinidadPhone(formattedPhone)) {
            return {
                success: false,
                message: 'Invalid Trinidad phone number format. Use +1-868-XXX-XXXX',
            };
        }

        const otpCode = this.generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        try {
            // Save OTP to database
            const { data, error } = await supabase
                .from('phone_verifications')
                .insert({
                    phone_number: formattedPhone,
                    otp_code: otpCode,
                    expires_at: expiresAt.toISOString(),
                    verified: false,
                    attempts: 0,
                })
                .select()
                .single();

            if (error) throw error;

            // In production, integrate with Twilio SMS API
            // For now, we'll log the OTP (development only)
            console.log(`📱 SMS OTP for ${formattedPhone}: ${otpCode}`);

            // TODO: Integrate Twilio SMS
            // await this.sendTwilioSMS(formattedPhone, otpCode);

            return {
                success: true,
                message: `Verification code sent to ${formattedPhone}`,
                verificationId: data.id,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to send verification code',
            };
        }
    },

    /**
     * Send WhatsApp verification code
     */
    async sendWhatsAppVerification(phone: string): Promise<PhoneVerificationResult> {
        const formattedPhone = this.formatTrinidadPhone(phone);

        if (!this.isValidTrinidadPhone(formattedPhone)) {
            return {
                success: false,
                message: 'Invalid Trinidad phone number format',
            };
        }

        const otpCode = this.generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        try {
            const { data, error } = await supabase
                .from('phone_verifications')
                .insert({
                    phone_number: formattedPhone,
                    otp_code: otpCode,
                    expires_at: expiresAt.toISOString(),
                    verified: false,
                    attempts: 0,
                    method: 'whatsapp',
                })
                .select()
                .single();

            if (error) throw error;

            console.log(`💬 WhatsApp OTP for ${formattedPhone}: ${otpCode}`);

            // TODO: Integrate WhatsApp Business API
            // await this.sendWhatsAppMessage(formattedPhone, otpCode);

            return {
                success: true,
                message: `Verification code sent via WhatsApp to ${formattedPhone}`,
                verificationId: data.id,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Failed to send WhatsApp verification',
            };
        }
    },

    /**
     * Verify OTP code
     */
    async verifyOTP(phone: string, otpCode: string): Promise<PhoneVerificationResult> {
        const formattedPhone = this.formatTrinidadPhone(phone);

        try {
            // Get the most recent verification for this phone
            const { data: verification, error: fetchError } = await supabase
                .from('phone_verifications')
                .select('*')
                .eq('phone_number', formattedPhone)
                .eq('verified', false)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (fetchError || !verification) {
                return {
                    success: false,
                    message: 'No verification found. Please request a new code.',
                };
            }

            // Check if expired
            if (new Date(verification.expires_at) < new Date()) {
                return {
                    success: false,
                    message: 'Verification code expired. Please request a new code.',
                };
            }

            // Check attempts
            if (verification.attempts >= 5) {
                return {
                    success: false,
                    message: 'Too many attempts. Please request a new code.',
                };
            }

            // Verify OTP
            if (verification.otp_code === otpCode) {
                // Mark as verified
                await supabase
                    .from('phone_verifications')
                    .update({ verified: true })
                    .eq('id', verification.id);

                return {
                    success: true,
                    message: 'Phone number verified successfully! ✓',
                };
            } else {
                // Increment attempts
                await supabase
                    .from('phone_verifications')
                    .update({ attempts: verification.attempts + 1 })
                    .eq('id', verification.id);

                return {
                    success: false,
                    message: 'Invalid verification code. Please try again.',
                };
            }
        } catch (error: any) {
            return {
                success: false,
                message: error.message || 'Verification failed',
            };
        }
    },

    /**
     * Check if phone number is already verified
     */
    async isPhoneVerified(phone: string): Promise<boolean> {
        const formattedPhone = this.formatTrinidadPhone(phone);

        const { data } = await supabase
            .from('phone_verifications')
            .select('verified')
            .eq('phone_number', formattedPhone)
            .eq('verified', true)
            .limit(1)
            .single();

        return !!data;
    },

    /**
     * Check if phone is already registered
     */
    async isPhoneRegistered(phone: string): Promise<boolean> {
        const formattedPhone = this.formatTrinidadPhone(phone);

        const { data } = await supabase
            .from('drivers')
            .select('id')
            .eq('phone_number', formattedPhone)
            .limit(1)
            .single();

        return !!data;
    },
};
