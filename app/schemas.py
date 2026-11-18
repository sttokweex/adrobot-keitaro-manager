from pydantic import BaseModel, Field


class CampaignInput(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    country: str = Field(min_length=2, max_length=2)
    offer_id: int = Field(gt=0)
    domain_id: int = Field(gt=0)
    group_id: int = Field(gt=0)
    traffic_source_id: int = Field(gt=0)


class AddOfferInput(BaseModel):
    offer_id: int = Field(gt=0)


class ShareInput(BaseModel):
    share: int = Field(ge=0, le=100)
