-- Additive migration: public team profiles and shared website CTA defaults.
-- Safe to run repeatedly; no existing rows or columns are removed.

CREATE TABLE IF NOT EXISTS `team_profiles` (
  `id` VARCHAR(36) NOT NULL,
  `site_id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `position` VARCHAR(191) NULL,
  `description` TEXT NULL,
  `image_url` VARCHAR(1024) NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (`id`),
  INDEX `team_profiles_site_idx` (`site_id`, `sort_order`)
);

-- Button settings use the existing themes.design JSON column, so no ALTER TABLE
-- is necessary. Preserve configured values and add defaults only when missing.
UPDATE `themes`
SET `design` = JSON_SET(
  COALESCE(`design`, JSON_OBJECT()),
  '$.scheduleCtaLabel', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(`design`, '$.scheduleCtaLabel')), 'Schedule Service'),
  '$.scheduleCtaHref', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(`design`, '$.scheduleCtaHref')), '/make-an-appointment/'),
  '$.diagnosticsCtaLabel', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(`design`, '$.diagnosticsCtaLabel')), 'Start Diagnostics'),
  '$.diagnosticsCtaHref', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(`design`, '$.diagnosticsCtaHref')), '/diagnostics/'),
  '$.tiresCtaLabel', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(`design`, '$.tiresCtaLabel')), 'Find the Right Tires'),
  '$.tiresCtaHref', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(`design`, '$.tiresCtaHref')), '/tires/'),
  '$.aboutCtaLabel', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(`design`, '$.aboutCtaLabel')), 'About Us'),
  '$.aboutCtaHref', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(`design`, '$.aboutCtaHref')), '/about-us/'),
  '$.servicesCtaLabel', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(`design`, '$.servicesCtaLabel')), 'View Services'),
  '$.servicesCtaHref', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(`design`, '$.servicesCtaHref')), '/services/'),
  '$.serviceCardCtaLabel', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(`design`, '$.serviceCardCtaLabel')), 'Learn More'),
  '$.callCtaLabel', COALESCE(JSON_UNQUOTE(JSON_EXTRACT(`design`, '$.callCtaLabel')), 'Call Now')
);

-- Per-page team selection/order is stored as an ordered array at:
-- page_sections.props.teamMemberIds
