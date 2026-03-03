/**
 * Hope Station — Configuration
 * Update these values with your actual credentials
 *
 * SETUP GUIDE:
 * 1. Create Airtable base "Hope Station CRM" (see reference/hopestation-airtable-setup.md)
 * 2. Get your Airtable Personal Access Token: airtable.com/create/tokens
 *    - Scope: data.records:write
 *    - Access: Hope Station CRM base
 * 3. Paste the token and base ID below
 * 4. Commit and push to deploy
 */
window.HOPESTATION_CONFIG = {
  // Airtable — direct API integration
  airtableToken: '',        // pat... personal access token
  airtableBaseId: '',       // app... base ID
  airtableTableName: 'Enquiries',

  // PayFast merchant details
  payfastMerchantId: '',
  payfastMerchantKey: '',
};
