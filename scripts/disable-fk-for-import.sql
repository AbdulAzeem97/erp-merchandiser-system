-- Temporarily disable foreign key constraints for import
ALTER TABLE job_cards DROP CONSTRAINT IF EXISTS job_cards_productId_fkey;
ALTER TABLE job_cards DROP CONSTRAINT IF EXISTS job_cards_companyId_fkey;
ALTER TABLE prepress_jobs DROP CONSTRAINT IF EXISTS prepress_jobs_job_card_id_fkey;
ALTER TABLE ratio_reports DROP CONSTRAINT IF EXISTS ratio_reports_job_card_id_fkey;
ALTER TABLE item_specifications DROP CONSTRAINT IF EXISTS item_specifications_job_card_id_fkey;
ALTER TABLE job_lifecycles DROP CONSTRAINT IF EXISTS job_lifecycles_jobCardId_fkey;
ALTER TABLE job_process_selections DROP CONSTRAINT IF EXISTS job_process_selections_jobId_fkey;
ALTER TABLE prepress_activity DROP CONSTRAINT IF EXISTS prepress_activity_prepress_job_id_fkey;
ALTER TABLE item_specification_items DROP CONSTRAINT IF EXISTS item_specification_items_item_specification_id_fkey;

