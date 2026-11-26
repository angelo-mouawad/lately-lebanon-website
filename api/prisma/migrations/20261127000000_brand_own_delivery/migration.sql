-- AlterTable
ALTER TABLE `Brand` ADD COLUMN `ownDelivery` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `BrandDeliveryFee` (
    `brandId` INTEGER NOT NULL,
    `zoneId` INTEGER NOT NULL,
    `feeCents` INTEGER NOT NULL,

    INDEX `BrandDeliveryFee_zoneId_idx`(`zoneId`),
    PRIMARY KEY (`brandId`, `zoneId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderBrandDelivery` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `brandId` INTEGER NOT NULL,
    `feeCents` INTEGER NOT NULL,

    INDEX `OrderBrandDelivery_brandId_idx`(`brandId`),
    UNIQUE INDEX `OrderBrandDelivery_orderId_brandId_key`(`orderId`, `brandId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `BrandDeliveryFee` ADD CONSTRAINT `BrandDeliveryFee_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BrandDeliveryFee` ADD CONSTRAINT `BrandDeliveryFee_zoneId_fkey` FOREIGN KEY (`zoneId`) REFERENCES `DeliveryZone`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderBrandDelivery` ADD CONSTRAINT `OrderBrandDelivery_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderBrandDelivery` ADD CONSTRAINT `OrderBrandDelivery_brandId_fkey` FOREIGN KEY (`brandId`) REFERENCES `Brand`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

