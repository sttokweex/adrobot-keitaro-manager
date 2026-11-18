import unittest

from app.database import Base, engine
from app.repositories import offer_archive
from app.services import streams


class OfferArchiveWorkflowTests(unittest.TestCase):
    def setUp(self):
        Base.metadata.drop_all(engine)
        Base.metadata.create_all(engine)
        for offer_id, share in ((11, 60), (12, 40)):
            offer_archive.put_offer({
                "campaign_id": 9001,
                "stream_id": 901,
                "offer_id": offer_id,
                "name": f"Offer {offer_id}",
                "current_share": share,
                "remote_share": share,
                "status": "active",
                "pinned": 0,
            })

    def test_pin_rebalance_external_removal_and_bring_back(self):
        streams.toggle_pin(9001, 901, 11)
        offer_archive.put_offer({
            "campaign_id": 9001,
            "stream_id": 901,
            "offer_id": 13,
            "name": "Offer 13",
            "current_share": 0,
            "remote_share": None,
            "status": "pending_add",
            "pinned": 0,
        })

        streams.rebalance(9001, 901)
        rows = offer_archive.rows_for_campaign(9001)
        by_id = {row["offer_id"]: row for row in rows}
        self.assertEqual(by_id[11]["current_share"], 60)
        self.assertEqual(by_id[11]["pinned"], 1)
        self.assertEqual(by_id[12]["current_share"], 20)
        self.assertEqual(by_id[13]["current_share"], 20)
        self.assertEqual(sum(row["current_share"] for row in rows), 100)

        by_id[12]["status"] = "pending_remove"
        offer_archive.put_offer(by_id[12])
        offer_archive.sync_campaign(
            9001,
            [{"id": 901, "offers": [
                {"offer_id": 11, "share": 60},
                {"offer_id": 13, "share": 40},
            ]}],
            {},
        )
        removed = offer_archive.get_offer(9001, 901, 12)
        self.assertEqual(removed["status"], "removed")
        self.assertEqual(removed["current_share"], 0)
        self.assertEqual(removed["remote_share"], 0)

        streams.bring_back(9001, 901, 12)
        rows = offer_archive.rows_for_campaign(9001)
        self.assertEqual(offer_archive.get_offer(9001, 901, 12)["status"], "pending_add")
        self.assertEqual(sum(row["current_share"] for row in rows), 100)


if __name__ == "__main__":
    unittest.main()
