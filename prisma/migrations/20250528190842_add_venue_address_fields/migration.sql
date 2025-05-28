-- AlterTable
ALTER TABLE "venues" ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "streetAddress" TEXT;

-- CreateIndex
CREATE INDEX "artists_locationId_idx" ON "artists"("locationId");

-- CreateIndex
CREATE INDEX "artists_artistType_idx" ON "artists"("artistType");

-- CreateIndex
CREATE INDEX "artists_genres_idx" ON "artists"("genres");

-- CreateIndex
CREATE INDEX "artists_tourStatus_idx" ON "artists"("tourStatus");

-- CreateIndex
CREATE INDEX "artists_verified_idx" ON "artists"("verified");

-- CreateIndex
CREATE INDEX "artists_name_idx" ON "artists"("name");

-- CreateIndex
CREATE INDEX "artists_createdAt_idx" ON "artists"("createdAt");

-- CreateIndex
CREATE INDEX "bids_tourRequestId_idx" ON "bids"("tourRequestId");

-- CreateIndex
CREATE INDEX "bids_venueId_idx" ON "bids"("venueId");

-- CreateIndex
CREATE INDEX "bids_bidderId_idx" ON "bids"("bidderId");

-- CreateIndex
CREATE INDEX "bids_status_idx" ON "bids"("status");

-- CreateIndex
CREATE INDEX "bids_proposedDate_idx" ON "bids"("proposedDate");

-- CreateIndex
CREATE INDEX "bids_holdPosition_idx" ON "bids"("holdPosition");

-- CreateIndex
CREATE INDEX "bids_createdAt_idx" ON "bids"("createdAt");

-- CreateIndex
CREATE INDEX "conversation_participants_conversationId_idx" ON "conversation_participants"("conversationId");

-- CreateIndex
CREATE INDEX "conversation_participants_userId_idx" ON "conversation_participants"("userId");

-- CreateIndex
CREATE INDEX "conversations_createdAt_idx" ON "conversations"("createdAt");

-- CreateIndex
CREATE INDEX "conversations_updatedAt_idx" ON "conversations"("updatedAt");

-- CreateIndex
CREATE INDEX "feedback_type_idx" ON "feedback"("type");

-- CreateIndex
CREATE INDEX "feedback_priority_idx" ON "feedback"("priority");

-- CreateIndex
CREATE INDEX "feedback_status_idx" ON "feedback"("status");

-- CreateIndex
CREATE INDEX "feedback_createdAt_idx" ON "feedback"("createdAt");

-- CreateIndex
CREATE INDEX "locations_country_stateProvince_city_idx" ON "locations"("country", "stateProvince", "city");

-- CreateIndex
CREATE INDEX "locations_city_idx" ON "locations"("city");

-- CreateIndex
CREATE INDEX "locations_stateProvince_idx" ON "locations"("stateProvince");

-- CreateIndex
CREATE INDEX "locations_latitude_longitude_idx" ON "locations"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "media_embeds_entityType_entityId_idx" ON "media_embeds"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "media_embeds_entityId_idx" ON "media_embeds"("entityId");

-- CreateIndex
CREATE INDEX "media_embeds_order_idx" ON "media_embeds"("order");

-- CreateIndex
CREATE INDEX "media_embeds_isFeatured_idx" ON "media_embeds"("isFeatured");

-- CreateIndex
CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

-- CreateIndex
CREATE INDEX "messages_senderId_idx" ON "messages"("senderId");

-- CreateIndex
CREATE INDEX "messages_receiverId_idx" ON "messages"("receiverId");

-- CreateIndex
CREATE INDEX "messages_createdAt_idx" ON "messages"("createdAt");

-- CreateIndex
CREATE INDEX "scene_infrastructure_locationId_idx" ON "scene_infrastructure"("locationId");

-- CreateIndex
CREATE INDEX "scene_infrastructure_type_idx" ON "scene_infrastructure"("type");

-- CreateIndex
CREATE INDEX "scene_infrastructure_verified_idx" ON "scene_infrastructure"("verified");

-- CreateIndex
CREATE INDEX "scene_reports_locationId_idx" ON "scene_reports"("locationId");

-- CreateIndex
CREATE INDEX "scene_reports_venueId_idx" ON "scene_reports"("venueId");

-- CreateIndex
CREATE INDEX "scene_reports_authorId_idx" ON "scene_reports"("authorId");

-- CreateIndex
CREATE INDEX "scene_reports_reportType_idx" ON "scene_reports"("reportType");

-- CreateIndex
CREATE INDEX "scene_reports_rating_idx" ON "scene_reports"("rating");

-- CreateIndex
CREATE INDEX "scene_reports_createdAt_idx" ON "scene_reports"("createdAt");

-- CreateIndex
CREATE INDEX "shows_venueId_idx" ON "shows"("venueId");

-- CreateIndex
CREATE INDEX "shows_artistId_idx" ON "shows"("artistId");

-- CreateIndex
CREATE INDEX "shows_date_idx" ON "shows"("date");

-- CreateIndex
CREATE INDEX "shows_status_idx" ON "shows"("status");

-- CreateIndex
CREATE INDEX "shows_createdAt_idx" ON "shows"("createdAt");

-- CreateIndex
CREATE INDEX "tour_requests_artistId_idx" ON "tour_requests"("artistId");

-- CreateIndex
CREATE INDEX "tour_requests_status_idx" ON "tour_requests"("status");

-- CreateIndex
CREATE INDEX "tour_requests_startDate_endDate_idx" ON "tour_requests"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "tour_requests_genres_idx" ON "tour_requests"("genres");

-- CreateIndex
CREATE INDEX "tour_requests_targetLocations_idx" ON "tour_requests"("targetLocations");

-- CreateIndex
CREATE INDEX "tour_requests_createdAt_idx" ON "tour_requests"("createdAt");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "venues_locationId_idx" ON "venues"("locationId");

-- CreateIndex
CREATE INDEX "venues_venueType_idx" ON "venues"("venueType");

-- CreateIndex
CREATE INDEX "venues_capacity_idx" ON "venues"("capacity");

-- CreateIndex
CREATE INDEX "venues_ageRestriction_idx" ON "venues"("ageRestriction");

-- CreateIndex
CREATE INDEX "venues_verified_idx" ON "venues"("verified");

-- CreateIndex
CREATE INDEX "venues_name_idx" ON "venues"("name");

-- CreateIndex
CREATE INDEX "venues_createdAt_idx" ON "venues"("createdAt");
