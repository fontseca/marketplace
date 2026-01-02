/*
  Warnings:

  - You are about to drop the column `search_vector` on the `product` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "product_search_idx";

-- AlterTable
ALTER TABLE "product" DROP COLUMN "search_vector";
