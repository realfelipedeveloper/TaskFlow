CREATE TABLE `projects` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

  UNIQUE INDEX `name`(`name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `tasks`
  ADD COLUMN `project_id` INTEGER NULL;

ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_project_id_fkey`
  FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`)
  ON DELETE SET NULL
  ON UPDATE NO ACTION;
