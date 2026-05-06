CREATE TABLE `users` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `username` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `reset_token` VARCHAR(255) NULL,
  `reset_expires` DATETIME(0) NULL,
  `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

  UNIQUE INDEX `username`(`username`),
  UNIQUE INDEX `email`(`email`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `tasks` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NULL,
  `description` LONGTEXT NULL,
  `status` VARCHAR(50) NULL DEFAULT 'Aguardando aceitação',
  `start_date` DATE NULL,
  `due_date` DATE NULL,
  `doubt` TEXT NULL,
  `answer` TEXT NULL,
  `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  `developer` VARCHAR(100) NULL,
  `branch` VARCHAR(100) NULL,
  `files` JSON NULL,

  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `roles` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,

  UNIQUE INDEX `name`(`name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `user_roles` (
  `user_id` INTEGER NOT NULL,
  `role_id` INTEGER NOT NULL,

  INDEX `role_id`(`role_id`),
  PRIMARY KEY (`user_id`, `role_id`),
  CONSTRAINT `user_roles_ibfk_1`
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION,
  CONSTRAINT `user_roles_ibfk_2`
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `role_permissions` (
  `role_id` INTEGER NOT NULL,
  `permission` VARCHAR(50) NOT NULL,

  PRIMARY KEY (`role_id`, `permission`),
  CONSTRAINT `role_permissions_ibfk_1`
    FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
    ON DELETE CASCADE
    ON UPDATE NO ACTION
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
