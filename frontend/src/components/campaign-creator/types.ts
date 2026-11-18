export type CampaignFormState = {
  name: string;
  country: string;
  domain_id: string;
  group_id: string;
  traffic_source_id: string;
};

export type CampaignFormField = keyof CampaignFormState;
