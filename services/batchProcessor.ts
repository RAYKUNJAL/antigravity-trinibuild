/**
 * AGENT 7: Batch Processing Service
 * 
 * Process 50-1000 products via CSV upload
 * - CSV parsing and validation
 * - Queue management
 * - Progress tracking
 * - Cost estimation
 */

import { supabase } from './supabaseClient';
import { optimizeListingFull, type OptimizationInput } from './listingOptimizer';

export interface CSVRow {
  image_url: string;
  existing_title?: string;
  existing_description?: string;
  category?: string;
  merchant_note?: string;
}

export interface BatchJob {
  id: string;
  user_id: string;
  seller_account_id: string;
  total_items: number;
  processed_items: number;
  failed_items: number;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  csv_data: CSVRow[];
  ai_job_ids: string[];
  total_cost_usd: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

/**
 * Parse CSV and create batch job
 */
export async function createBatchJob(
  userId: string,
  sellerAccountId: string,
  csvText: string,
): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    // Parse CSV (simple parser - assumes header row)
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const csvData: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx];
      });
      
      if (row.image_url) {
        csvData.push({
          image_url: row.image_url,
          existing_title: row.existing_title || row.title,
          existing_description: row.existing_description || row.description,
          category: row.category,
          merchant_note: row.merchant_note || row.note,
        });
      }
    }

    if (csvData.length === 0) {
      return { success: false, error: 'No valid rows found in CSV' };
    }

    // Create batch job
    const { data: job, error } = await supabase
      .from('batch_listing_jobs')
      .insert({
        user_id: userId,
        seller_account_id: sellerAccountId,
        total_items: csvData.length,
        processed_items: 0,
        failed_items: 0,
        status: 'queued',
        csv_data: csvData,
        ai_job_ids: [],
        total_cost_usd: 0,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Start processing in background
    processBatchJob(job.id).catch(console.error);

    return { success: true, jobId: job.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Process batch job (run in background)
 */
async function processBatchJob(jobId: string): Promise<void> {
  // Update status to processing
  await supabase
    .from('batch_listing_jobs')
    .update({ status: 'processing', started_at: new Date().toISOString() })
    .eq('id', jobId);

  // Get job details
  const { data: job } = await supabase
    .from('batch_listing_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (!job) return;

  const csvData: CSVRow[] = job.csv_data;
  const aiJobIds: string[] = [];
  let processed = 0;
  let failed = 0;
  let totalCost = 0;

  // Process in batches of 10 to avoid overwhelming the API
  const BATCH_SIZE = 10;
  for (let i = 0; i < csvData.length; i += BATCH_SIZE) {
    const batch = csvData.slice(i, i + BATCH_SIZE);
    
    const results = await Promise.allSettled(
      batch.map(row =>
        optimizeListingFull({
          imageUrl: row.image_url,
          existingTitle: row.existing_title,
          existingDescription: row.existing_description,
          hints: {
            storeCategory: row.category,
            merchantNote: row.merchant_note,
          },
        })
      )
    );

    for (const result of results) {
      if (result.status === 'fulfilled') {
        processed++;
        // Save individual AI job
        const { data: aiJob } = await supabase
          .from('ai_listing_jobs')
          .insert({
            user_id: job.user_id,
            seller_account_id: job.seller_account_id,
            job_type: 'batch',
            status: 'completed',
            output_listing: result.value,
            confidence_score: result.value.qualityScore / 100,
            completed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (aiJob) {
          aiJobIds.push(aiJob.id);
          totalCost += 0.01; // Estimate ~1 cent per listing
        }
      } else {
        failed++;
      }
    }

    // Update progress
    await supabase
      .from('batch_listing_jobs')
      .update({
        processed_items: processed,
        failed_items: failed,
        total_cost_usd: totalCost,
        ai_job_ids: aiJobIds,
      })
      .eq('id', jobId);
  }

  // Mark as completed
  await supabase
    .from('batch_listing_jobs')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

/**
 * Get batch job status
 */
export async function getBatchJobStatus(jobId: string): Promise<BatchJob | null> {
  const { data } = await supabase
    .from('batch_listing_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  return data;
}

/**
 * Get all batch jobs for a user
 */
export async function getUserBatchJobs(userId: string): Promise<BatchJob[]> {
  const { data } = await supabase
    .from('batch_listing_jobs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return data || [];
}

/**
 * Estimate cost before processing
 */
export function estimateBatchCost(itemCount: number): number {
  return itemCount * 0.01; // ~$0.01 per item
}
