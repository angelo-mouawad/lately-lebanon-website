-- AlterTable: the WhatsApp number is optional; empty hides WhatsApp across the site and emails.
ALTER TABLE `Settings` MODIFY `whatsappNumber` VARCHAR(20) NULL;
