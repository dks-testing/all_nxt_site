-- Per-site email routing for booking notifications.
-- Empty From values fall back to the server's NOTIFY_FROM_EMAIL setting.

ALTER TABLE `booking_settings`
  ADD COLUMN `notify_from_email` VARCHAR(191) NULL AFTER `notify_emails`,
  ADD COLUMN `notify_cc_emails` JSON NULL AFTER `notify_from_email`,
  ADD COLUMN `notify_bcc_emails` JSON NULL AFTER `notify_cc_emails`,
  ADD COLUMN `notify_reply_to_email` VARCHAR(191) NULL AFTER `notify_bcc_emails`;
