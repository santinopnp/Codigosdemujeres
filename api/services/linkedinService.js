"use strict";

const LI_API = "https://api.linkedin.com/v2";

function headers(token) {
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-Restli-Protocol-Version": "2.0.0",
  };
}

/**
 * Register an image with LinkedIn and upload it.
 * Returns the asset URN.
 */
async function uploadImage({ token, orgUrn, imageUrl }) {
  // Step 1: Register the upload
  const regRes = await fetch(`${LI_API}/assets?action=registerUpload`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: orgUrn,
        serviceRelationships: [{
          relationshipType: "OWNER",
          identifier: "urn:li:userGeneratedContent",
        }],
      },
    }),
  });

  if (!regRes.ok) {
    const txt = await regRes.text();
    throw new Error(`LinkedIn register upload failed (${regRes.status}): ${txt}`);
  }

  const regData = await regRes.json();
  const uploadUrl = regData.value.uploadMechanism[
    "com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"
  ].uploadUrl;
  const assetUrn = regData.value.asset;

  // Step 2: Fetch and upload the image binary
  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Cannot fetch image from ${imageUrl}: ${imgRes.status}`);
  const imgBuffer = await imgRes.arrayBuffer();

  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Authorization": `Bearer ${token}` },
    body: imgBuffer,
  });

  if (!uploadRes.ok) {
    const txt = await uploadRes.text();
    throw new Error(`LinkedIn image upload failed (${uploadRes.status}): ${txt}`);
  }

  return assetUrn;
}

/**
 * Post text (+ optional image) to a LinkedIn Organization Page.
 *
 * Required env vars:
 *   LINKEDIN_ACCESS_TOKEN   — OAuth 2.0 access token (w_organization_social scope)
 *   LINKEDIN_ORGANIZATION_ID — numeric ID of your LinkedIn Company Page
 *
 * @param {object} opts
 * @param {string} opts.text       - Post caption / text body
 * @param {string} [opts.imageUrl] - Publicly accessible image URL (optional)
 * @returns {Promise<string>}      - LinkedIn post URN (e.g. "urn:li:ugcPost:1234567890")
 */
async function postToLinkedIn({ text, imageUrl }) {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const orgId = process.env.LINKEDIN_ORGANIZATION_ID;

  if (!token || !orgId) throw new Error("linkedin_not_configured");

  const orgUrn = `urn:li:organization:${orgId}`;
  let specificContent;

  if (imageUrl) {
    const assetUrn = await uploadImage({ token, orgUrn, imageUrl });
    specificContent = {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: "IMAGE",
        media: [{
          status: "READY",
          description: { text: text.slice(0, 200) },
          media: assetUrn,
          title: { text: text.slice(0, 200) },
        }],
      },
    };
  } else {
    specificContent = {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: "NONE",
      },
    };
  }

  const res = await fetch(`${LI_API}/ugcPosts`, {
    method: "POST",
    headers: headers(token),
    body: JSON.stringify({
      author: orgUrn,
      lifecycleState: "PUBLISHED",
      specificContent,
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`LinkedIn ugcPost failed (${res.status}): ${txt}`);
  }

  const data = await res.json();
  return data.id ?? "published";
}

module.exports = { postToLinkedIn };
