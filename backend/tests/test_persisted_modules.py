"""Isolated API checks for the operational showcase modules."""
from __future__ import annotations

import os
import unittest

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["DEMO_MODE"] = "true"

from app.main import (  # noqa: E402
    SessionLocal, seed_demo, User, Restaurant, select, create_staff, list_staff, update_staff, delete_staff,
    create_showcase, list_showcase, update_showcase, delete_showcase,
)


class PersistedModuleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.db = SessionLocal()
        seed_demo(cls.db)
        cls.owner = cls.db.scalar(select(User).where(User.email == "owner@ralypto.com"))

    @classmethod
    def tearDownClass(cls) -> None:
        cls.db.close()

    def test_staff_pin_is_hashed_and_staff_changes_persist(self) -> None:
        staff = create_staff({"name": "Test Staff", "role": "waiter", "phone": "+94000111222", "pin": "9876"}, self.owner, self.db)
        self.assertNotIn("pin", staff)
        self.assertTrue(any(item["id"] == staff["id"] for item in list_staff(self.owner, self.db)))
        changed = update_staff(staff["id"], {"phone": "+94000999888", "isActive": False}, self.owner, self.db)
        self.assertFalse(changed["isActive"])
        self.assertIsNone(delete_staff(staff["id"], self.owner, self.db))

    def test_settings_upsert_and_operational_collections_roundtrip(self) -> None:
        first = create_showcase("settings", {"restName": "Isolated Bistro", "taxRate": 8.5}, self.owner, self.db)
        second = create_showcase("settings", {"restPhone": "+94000000000"}, self.owner, self.db)
        self.assertEqual(second["restName"], "Isolated Bistro")
        self.assertEqual(second["restPhone"], "+94000000000")
        restaurant = self.db.get(Restaurant, self.owner.restaurant_id)
        self.assertEqual(restaurant.name, "Isolated Bistro")
        self.assertEqual(restaurant.tax_rate, 850)
        self.assertEqual(len([row for row in list_showcase("settings", self.owner, self.db) if row["key"] == "restaurant"]), 1)

        examples = {
            "inventory": {"name": "Rice", "quantity": 6, "unit": "kg", "reorderLevel": 2},
            "delivery": {"customer": "Guest", "phone": "000", "address": "Road", "status": "received"},
            "accounting": {"description": "Utilities", "category": "Utilities", "amountCents": 1200},
        }
        for collection, payload in examples.items():
            with self.subTest(collection=collection):
                created = create_showcase(collection, payload, self.owner, self.db)
                record_id = created["id"]
                self.assertTrue(any(row["id"] == record_id for row in list_showcase(collection, self.owner, self.db)))
                updated = update_showcase(collection, record_id, {"status": "updated"}, self.owner, self.db)
                self.assertEqual(updated["status"], "updated")
                self.assertIsNone(delete_showcase(collection, record_id, self.owner, self.db))

    def test_collection_does_not_allow_arbitrary_name(self) -> None:
        from fastapi import HTTPException
        with self.assertRaises(HTTPException):
            list_showcase("users", self.owner, self.db)

    def test_showcase_roles_are_restricted(self) -> None:
        from fastapi import HTTPException
        cashier = self.db.scalar(select(User).where(User.email == "cashier@ralypto.com"))
        with self.assertRaises(HTTPException) as denied:
            create_showcase("settings", {"restName": "Forbidden"}, cashier, self.db)
        self.assertEqual(denied.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
