-- CreateEnum
CREATE TYPE "ShipmentProvider" AS ENUM ('MANUAL', 'SHIPROCKET');

-- AlterEnum
ALTER TYPE "ShipmentStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "courierName" TEXT,
ADD COLUMN     "lastWebhookPayload" JSONB,
ADD COLUMN     "provider" "ShipmentProvider" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "shiprocketOrderId" TEXT,
ADD COLUMN     "shiprocketShipmentId" TEXT,
ADD COLUMN     "trackingUrl" TEXT;

-- CreateIndex
CREATE INDEX "Shipment_shiprocketShipmentId_idx" ON "Shipment"("shiprocketShipmentId");
