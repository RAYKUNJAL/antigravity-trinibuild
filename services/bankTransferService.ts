import { supabase } from './supabaseClient';

export interface BankTransferProof {
  id: string;
  order_id: string;
  store_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  reference_number?: string;
  bank_name?: string;
  account_last_four?: string;
  proof_image_url: string;
  uploaded_at: string;
  status: 'pending' | 'approved' | 'rejected';
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;
}

class BankTransferService {
  /**
   * Upload bank transfer proof
   */
  async uploadProof(
    orderId: string,
    storeId: string,
    amount: number,
    proofFile: File,
    details?: {
      reference_number?: string;
      bank_name?: string;
      account_last_four?: string;
    }
  ): Promise<BankTransferProof> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload proof image to Supabase Storage
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${user.id}/${orderId}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('bank-transfer-proofs')
        .upload(fileName, proofFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('bank-transfer-proofs')
        .getPublicUrl(fileName);

      // Create proof record
      const { data, error } = await supabase
        .from('bank_transfer_proofs')
        .insert({
          order_id: orderId,
          store_id: storeId,
          customer_id: user.id,
          amount,
          currency: 'TTD',
          reference_number: details?.reference_number,
          bank_name: details?.bank_name,
          account_last_four: details?.account_last_four,
          proof_image_url: urlData.publicUrl,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Notify merchant
      await this.notifyMerchant(storeId, orderId);

      return data;
    } catch (error) {
      console.error('Error uploading bank transfer proof:', error);
      throw error;
    }
  }

  /**
   * Get pending proofs for a store
   */
  async getPendingProofs(storeId: string): Promise<BankTransferProof[]> {
    try {
      const { data, error } = await supabase
        .from('bank_transfer_proofs')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'pending')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending proofs:', error);
      throw error;
    }
  }

  /**
   * Get all proofs for a store
   */
  async getStoreProofs(storeId: string, status?: string): Promise<BankTransferProof[]> {
    try {
      let query = supabase
        .from('bank_transfer_proofs')
        .select('*')
        .eq('store_id', storeId);

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query.order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching store proofs:', error);
      throw error;
    }
  }

  /**
   * Approve bank transfer proof
   */
  async approveProof(proofId: string, notes?: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update proof status
      const { data: proof, error: proofError } = await supabase
        .from('bank_transfer_proofs')
        .update({
          status: 'approved',
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          verification_notes: notes,
        })
        .eq('id', proofId)
        .select()
        .single();

      if (proofError) throw proofError;

      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'confirmed',
        })
        .eq('id', proof.order_id);

      if (orderError) throw orderError;

      // Notify customer
      await this.notifyCustomer(proof.customer_id, proof.order_id, 'approved');
    } catch (error) {
      console.error('Error approving proof:', error);
      throw error;
    }
  }

  /**
   * Reject bank transfer proof
   */
  async rejectProof(proofId: string, reason: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update proof status
      const { data: proof, error: proofError } = await supabase
        .from('bank_transfer_proofs')
        .update({
          status: 'rejected',
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          verification_notes: reason,
        })
        .eq('id', proofId)
        .select()
        .single();

      if (proofError) throw proofError;

      // Notify customer
      await this.notifyCustomer(proof.customer_id, proof.order_id, 'rejected', reason);
    } catch (error) {
      console.error('Error rejecting proof:', error);
      throw error;
    }
  }

  /**
   * Get customer's upload history
   */
  async getCustomerProofs(): Promise<BankTransferProof[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('bank_transfer_proofs')
        .select('*')
        .eq('customer_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching customer proofs:', error);
      throw error;
    }
  }

  /**
   * Notify merchant about new proof upload
   */
  private async notifyMerchant(storeId: string, orderId: string): Promise<void> {
    // Implementation depends on notification system
    console.log(`Notify merchant: New bank transfer proof for order ${orderId}`);
  }

  /**
   * Notify customer about verification result
   */
  private async notifyCustomer(
    customerId: string,
    orderId: string,
    status: 'approved' | 'rejected',
    reason?: string
  ): Promise<void> {
    // Implementation depends on notification system
    console.log(`Notify customer ${customerId}: Payment ${status} for order ${orderId}`, reason);
  }
}

export const bankTransferService = new BankTransferService();
